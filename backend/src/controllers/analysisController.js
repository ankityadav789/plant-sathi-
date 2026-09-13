const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { generateImageHash, getCachedResult, setCachedResult } = require('../utils/cache');
const { identifyPlant }          = require('../services/plantIdService');
const { getHindiName }           = require('../services/translationService');
const { analyzeDisease }         = require('../services/huggingfaceService');
const { getWeather }             = require('../services/weatherService');
const { generatePlantReport }    = require('../services/groqService');
const { validateImageQuality }   = require('../services/imageQualityService');

const DISEASE_REGISTRY_PATH = path.join(
  __dirname,
  '..',
  '..',
  'data',
  'disease_registry.json'
);

let diseaseRegistry = null;

function loadDiseaseRegistry() {
  if (!diseaseRegistry) {
    try {
      const data = fs.readFileSync(
        DISEASE_REGISTRY_PATH,
        'utf-8'
      );

      diseaseRegistry = JSON.parse(data);
      console.log(
        `[Disease Registry] Loaded ${Object.keys(diseaseRegistry).length} species`
      );
    } catch (err) {
      console.error(
        '[Disease Registry] Failed to load:',
        err.message
      );

      diseaseRegistry = {};
    }
  }

  return diseaseRegistry;
}


// Load species registry for canonical species ID resolution
const SPECIES_REGISTRY_PATH = path.join(__dirname, '..', '..', 'data', 'species_registry.json');
let speciesRegistry = null;

function loadSpeciesRegistry() {
  if (!speciesRegistry) {
    try {
      const data = fs.readFileSync(SPECIES_REGISTRY_PATH, 'utf-8');
      speciesRegistry = JSON.parse(data);
    } catch (err) {
      console.error('[Warning] Failed to load species registry:', err.message);
      speciesRegistry = {};
    }
  }
  return speciesRegistry;
}

/**
 * Resolve canonical species ID from scientific name.
 * Returns the first matching canonical ID or null if not found.
 */
function resolveCanonicalSpeciesId(scientificName) {
  if (!scientificName) return null;

  const nameLc = scientificName.trim().toLowerCase();

  // ------------------------------------------------------------
  // 1. Project species registry
  // ------------------------------------------------------------

  const speciesRegistry = loadSpeciesRegistry();

  for (const [canonicalId, entry] of Object.entries(speciesRegistry)) {
    if (
      entry.scientific_name &&
      entry.scientific_name.trim().toLowerCase() === nameLc
    ) {
      return canonicalId;
    }
  }

  // ------------------------------------------------------------
  // 2. Disease registry
  // ------------------------------------------------------------

  const diseaseRegistry = loadDiseaseRegistry();

  // Disease registry IDs are canonical species IDs.
  // Resolve by comparing against their known scientific names
  // where available.
  for (const canonicalId of Object.keys(diseaseRegistry)) {
    const speciesEntry = speciesRegistry[canonicalId];

    if (
      speciesEntry?.scientific_name &&
      speciesEntry.scientific_name.trim().toLowerCase() === nameLc
    ) {
      return canonicalId;
    }
  }

  // ------------------------------------------------------------
  // 3. No canonical match
  // ------------------------------------------------------------

  return null;
}

function hasDiseaseCoverage(canonicalSpeciesId) {
  if (!canonicalSpeciesId) return false;

  const registry = loadDiseaseRegistry();

  return (
    registry[canonicalSpeciesId] &&
    registry[canonicalSpeciesId].supported === true
  );
}

// ─── Health Check ─────────────────────────────────────────────────────────────
const checkHealth = (req, res) => {
  res.json({
    status: 'OK',
    message: 'PlantSathi AI Backend is operational.',
    services: {
      plantNet : !!process.env.PLANTNET_API_KEY,
      groq     : !!process.env.GROQ_API_KEY,
      weather  : !!process.env.WEATHER_API_KEY,
    },
  });
};

// ─── Main Analysis Pipeline ───────────────────────────────────────────────────
const analyzePlant = async (req, res, next) => {
  try {
    // ── Guard: image required ──────────────────────────────────────────────────
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image received. Please upload a valid plant photo.',
      });
    }

    // ── Pre-Flight Image Quality Check ─────────────────────────────────────────
    const qualityCheck = await validateImageQuality(req.file.buffer);
    if (!qualityCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: qualityCheck.message,
      });
    }

    // ── 1. Cache lookup (by SHA-256 image hash) ────────────────────────────────
    const hash   = generateImageHash(req.file.buffer);
    const cached = getCachedResult(hash);
    if (cached) {
      console.log('[Cache HIT]', hash.slice(0, 12));
      return res.json({ success: true, data: cached, fromCache: true });
    }
    console.log('[Cache MISS] Running full pipeline…');

    // ── 2. PlantNet Identification ─────────────────────────────────────────────
    console.log('PlantNet ✔');
    const plantIdResult = await identifyPlant(req.file.buffer, req.file.originalname);

    if (!plantIdResult.success) {
      return res.status(400).json({ success: false, message: plantIdResult.message });
    }

    const { matches } = plantIdResult;
    const topMatch    = matches[0];

    // We no longer reject based on confidence; let the analysis continue.
    
    // ── 3. Simple Dictionary Lookup for Hindi Name ─────────────────────────────
    const nameEn = topMatch.englishName;
    const nameHi = await getHindiName(topMatch.scientificName, topMatch.englishName);

    // ── 4. Hugging Face Disease Detection ──────────────────────────────────────
    console.log('Hugging Face Disease Detection ✔');
    const canonicalSpeciesId =
      resolveCanonicalSpeciesId(topMatch.scientificName);

    console.log(
      `[Species Registry] ${topMatch.scientificName} → ${
        canonicalSpeciesId || 'UNRESOLVED'
      }`
    );

    let hfResult;

    if (!canonicalSpeciesId) {
      console.log(
        '[Disease AI] Skipping: species could not be resolved.'
      );

      hfResult = {
        success: true,
        supported: false,
        disease: null,
        confidence: null,
        error: 'Canonical species could not be resolved'
      };
    } else if (!hasDiseaseCoverage(canonicalSpeciesId)) {
      console.log(
        `[Disease AI] Skipping: no disease coverage for ${canonicalSpeciesId}`
      );

      hfResult = {
        success: true,
        supported: false,
        disease: null,
        confidence: null,
        error: 'No disease coverage for this species'
      };
    } else {
      console.log(
        `[Disease AI] Running model for ${canonicalSpeciesId}`
      );

      hfResult = await analyzeDisease(
        req.file.buffer,
        canonicalSpeciesId
      );
    }
    
    let finalDisease;
    let lowConfidenceWarning = null;

    // Disease confidence policy
    const DISEASE_CONFIDENCE_CONFIDENT = 70;
    const DISEASE_CONFIDENCE_UNCERTAIN = 50;

    if (
      hfResult.success &&
      hfResult.supported !== false &&
      hfResult.disease &&
      hfResult.disease !== 'Unknown'
    ) {
      const diseaseConfidence = Number(hfResult.confidence) || 0;

      const isHealthy = hfResult.disease
        .toLowerCase()
        .includes('healthy');

      // ------------------------------------------------------------
      // High-confidence result
      // ------------------------------------------------------------
      if (diseaseConfidence >= DISEASE_CONFIDENCE_CONFIDENT) {

        finalDisease = {
          name: hfResult.disease,
          confidence: diseaseConfidence,
          severity: isHealthy ? 'None' : 'High',
          affectedArea: 'Analyzed by AI',
          cause: 'Identified by AI',
          status: isHealthy ? 'Healthy' : 'Diseased',
          modelSource: 'HuggingFace ResNet50 (Local FastAPI)',
          allPredictions: hfResult.allPredictions || [],
          lowConfidenceWarning: null
        };

      // ------------------------------------------------------------
      // Low-confidence result
      // ------------------------------------------------------------
      } else if (diseaseConfidence >= DISEASE_CONFIDENCE_UNCERTAIN) {

        lowConfidenceWarning =
          'The AI found a possible result, but confidence is low. Please upload a clearer image showing the affected leaves, stem, or fruit.';

        finalDisease = {
          name: hfResult.disease,
          confidence: diseaseConfidence,
          severity: 'Unknown',
          affectedArea: 'Uncertain',
          cause: 'AI prediction has insufficient confidence for a reliable diagnosis.',
          status: 'Uncertain',
          modelSource: 'HuggingFace ResNet50 (Local FastAPI)',
          allPredictions: hfResult.allPredictions || [],
          lowConfidenceWarning
        };

      // ------------------------------------------------------------
      // Very low-confidence result
      // ------------------------------------------------------------
      } else {
        finalDisease = {
          name: 'Disease Status Uncertain',
          confidence: diseaseConfidence,
          severity: 'Unknown',
          affectedArea: 'Not Available',
          cause: 'The disease model was not confident enough to provide a reliable diagnosis.',
          status: 'Uncertain',
          modelSource: 'HuggingFace ResNet50 (Local FastAPI)',
          allPredictions: hfResult.allPredictions || [],
          lowConfidenceWarning
        };
      }

    } else {

      // ------------------------------------------------------------
      // Disease model not available / unsupported species
      // ------------------------------------------------------------

      console.log(
        `⚠️ Disease detection unavailable: ${
          hfResult.error || 'Unsupported plant'
        }`
      );

      finalDisease = {
        name: 'Disease Detection Unavailable',
        confidence: 0,
        severity: 'Unknown',
        affectedArea: 'Not Available',
        cause:
          'We successfully identified the plant, but our current AI model could not detect a disease for this plant. This may be because the plant species is not yet supported or the uploaded image does not contain enough visible disease symptoms.',
        status: 'Not Available',
        modelSource: 'PlantSathi AI Disease Detection',
        allPredictions: [],
        lowConfidenceWarning:
          'Try uploading a clearer image showing the affected leaves, stem, or fruit. Support for more plant species will be added in future updates.'
      };
    }

    // ── 5. Weather (optional – non-blocking if unavailable) ────────────────────
    console.log('Weather ✔');
    const lat     = req.query.lat || req.body.lat || null;
    const lon     = req.query.lon || req.body.lon || null;
    const weather = await getWeather(lat, lon);

// ── 6. Health Score Engine ────────────────────────────────────────────────
// Deterministic, explainable scoring model:
//
// Disease / diagnostic confidence : 40%
// Species identification          : 30%
// Weather suitability             : 15%
// Water suitability               : 15%

    const HEALTH_WEIGHTS = {
      disease: 0.40,
      species: 0.30,
      weather: 0.15,
      water: 0.15
    };

    // ── A. Disease / diagnostic score ──────────────────────────────────────────
    const diseasePenaltyMap = {
      None: 0,
      Low: 10,
      Medium: 25,
      High: 45,
      Unknown: 40
    };

    let diseaseScore;
    let diseaseReason;

    if (finalDisease.status === 'Uncertain') {
      diseaseScore = 60;
      diseaseReason =
        `Disease result is uncertain at ${finalDisease.confidence}% confidence.`;
    } else if (finalDisease.status === 'Not Available') {
      diseaseScore = 60;
      diseaseReason =
        'Disease detection is unavailable for this species.';
    } else {
      const diseasePenalty =
        diseasePenaltyMap[finalDisease.severity] ?? 40;

      diseaseScore = Math.max(0, 100 - diseasePenalty);

      diseaseReason =
        finalDisease.status === 'Healthy'
          ? `No confirmed disease detected with ${finalDisease.confidence}% confidence.`
          : `Disease severity classified as ${finalDisease.severity}.`;
    }

    // ── B. Species identification score ───────────────────────────────────────
    const speciesScore = Math.max(
      0,
      Math.min(100, Number(topMatch.confidence) || 0)
    );

    const speciesReason =
      `Species identification confidence is ${speciesScore}%.`;

    // ── C. Weather suitability score ───────────────────────────────────────────
    let weatherScore = 75;
    let weatherReason = 'Weather data unavailable; neutral default applied.';

    if (weather) {
      const temp = Number(weather.temperature ?? 25);
      const humidity = Number(weather.humidity ?? 60);

      // Temperature component
      const tempScore =
        temp >= 15 && temp <= 35
          ? 100
          : Math.max(
              0,
              100 - Math.abs(temp - 25) * 4
            );

      // Humidity component
      const humidityScore =
        humidity >= 40 && humidity <= 80
          ? 100
          : Math.max(
              0,
              100 - Math.abs(humidity - 60) * 2
            );

      weatherScore = Math.round(
        (tempScore + humidityScore) / 2
      );

      weatherReason =
        `Temperature ${temp}°C and humidity ${humidity}% produced a weather suitability score of ${weatherScore}.`;
    }

    // ── D. Water suitability score ─────────────────────────────────────────────
    const waterHumidity = Number(weather?.humidity ?? 60);

    let waterScore;
    let waterReason;

    if (waterHumidity > 70) {
      waterScore = 90;
      waterReason =
        `High humidity (${waterHumidity}%) reduces immediate watering demand.`;
    } else if (waterHumidity > 50) {
      waterScore = 75;
      waterReason =
        `Moderate humidity (${waterHumidity}%) suggests balanced watering demand.`;
    } else {
      waterScore = 55;
      waterReason =
        `Lower humidity (${waterHumidity}%) increases watering demand.`;
    }

    // ── E. Weighted final score ────────────────────────────────────────────────
    const weightedDisease =
      diseaseScore * HEALTH_WEIGHTS.disease;

    const weightedSpecies =
      speciesScore * HEALTH_WEIGHTS.species;

    const weightedWeather =
      weatherScore * HEALTH_WEIGHTS.weather;

    const weightedWater =
      waterScore * HEALTH_WEIGHTS.water;

    const rawHealthScore =
      weightedDisease +
      weightedSpecies +
      weightedWeather +
      weightedWater;

    // Keep the existing lower bound of 30.
    const healthScore = Math.max(
      30,
      Math.min(100, Math.round(rawHealthScore))
    );

    // ── F. Explainable breakdown ───────────────────────────────────────────────
    const healthBreakdown = {
      disease: {
        score: diseaseScore,
        weight: HEALTH_WEIGHTS.disease,
        weightedScore: Number(weightedDisease.toFixed(2)),
        reason: diseaseReason
      },

      speciesConfidence: {
        score: speciesScore,
        weight: HEALTH_WEIGHTS.species,
        weightedScore: Number(weightedSpecies.toFixed(2)),
        reason: speciesReason
      },

      weather: {
        score: weatherScore,
        weight: HEALTH_WEIGHTS.weather,
        weightedScore: Number(weightedWeather.toFixed(2)),
        reason: weatherReason
      },

      water: {
        score: waterScore,
        weight: HEALTH_WEIGHTS.water,
        weightedScore: Number(weightedWater.toFixed(2)),
        reason: waterReason
      },

      rawScore: Number(rawHealthScore.toFixed(2)),
      total: healthScore
    };
    // ── 8. Groq AI Plant Doctor report ─────────────────────────────────────────
    console.log('Groq ✔');
    const groqResult = await generatePlantReport({
      nameEn,
      scientificName: topMatch.scientificName,
      healthScore,
      disease: finalDisease,
      weather,
    });

    // Extract Groq's weather-aware watering advice
    const wateringAdvice = groqResult.report?.wateringAdvice || {
      waterToday: weather?.humidity > 70 ? 'NO' : 'YES',
      quantity: 'Moderate',
      bestTime: 'Morning',
      reason: weather?.humidity > 70
        ? 'Water soon (1-2 days). High humidity detected.'
        : weather?.humidity > 50
        ? 'Needs Water Soon (2-3 days).'
        : 'Water today. Low humidity detected.'
    };

    const waterRec = { 
      status: wateringAdvice.waterToday === 'YES' ? 'Water today' : 'Needs Water Soon',
      advice: wateringAdvice 
    };

    // ── 9. Assemble unified response ────────────────────────────────────────────
    const baseResponse = {
      apiStatus: {
        plantIdSuccess: true, // We reach here only if plantId succeeded
        diseaseSuccess: hfResult.success,
        weatherSuccess: !!weather,
        groqSuccess: groqResult.success,
      },
      plantId: {
        nameEn,
        nameHi,
        scientificName : topMatch.scientificName,
        family         : topMatch.family || groqResult.report?.plantFamily || 'Unknown Family',
        category       : groqResult.report?.plantCategory || 'Plant',
        region         : groqResult.report?.nativeRegion || 'Worldwide',
        confidence     : topMatch.confidence,
        otherMatches   : await Promise.all(matches.slice(1).map(async m => ({
          englishName    : m.englishName,
          hindiName      : await getHindiName(m.scientificName, m.englishName),
          scientificName : m.scientificName,
          confidence     : m.confidence,
        }))),
      },
      healthScore,
      healthBreakdown,
      disease  : finalDisease,
      water    : waterRec,
      weather  : weather || { condition: 'Unavailable', location: 'Unknown' },
      doctorReport: groqResult.report,
      // Legacy shape kept to prevent any UI crash
      sunlight : { current: 'Indirect', intensity: 'Medium' },
      growth   : { currentHeight: 'Varies by species' },
      climate  : weather ? { compatible: true } : {},
      nutrient : {},
      garden   : [],
      timeline : [],
    };

    // ── 10. Cache and return ────────────────────────────────────────────────────
    
    setCachedResult(hash, baseResponse);
    console.log('Final JSON ✔', JSON.stringify(baseResponse, null, 2));
    return res.json({
      success : true,
      data    : baseResponse,
      imageId : crypto.randomUUID(),
    });

  } catch (error) {
    console.error('[Pipeline Error]', error.message);
    next(error);
  }
};

// ─── Refresh Weather & AI Report ──────────────────────────────────────────────
const refreshWeather = async (req, res, next) => {
  try {
    const { lat, lon, plantContext } = req.body;
    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required.' });
    }

    const weather = await getWeather(lat, lon);
    
    // Regenerate Groq AI report with new weather
    const groqResult = await generatePlantReport({
      nameEn: plantContext?.plantId?.nameEn || 'Plant',
      scientificName: plantContext?.plantId?.scientificName || '',
      healthScore: plantContext?.healthScore || 80,
      disease: plantContext?.disease || { confidence: 0, severity: 'None' },
      weather,
    });

    const wateringAdvice = groqResult.report?.wateringAdvice || {
      waterToday: weather?.humidity > 70 ? 'NO' : 'YES',
      quantity: 'Moderate',
      bestTime: 'Morning',
      reason: weather?.humidity > 70
        ? 'Water soon (1-2 days). High humidity detected.'
        : weather?.humidity > 50
        ? 'Needs Water Soon (2-3 days).'
        : 'Water today. Low humidity detected.'
    };

    const waterRec = { 
      status: wateringAdvice.waterToday === 'YES' ? 'Water today' : 'Needs Water Soon',
      advice: wateringAdvice 
    };

    return res.json({
      success: true,
      weather: weather || { condition: 'Unavailable', location: 'Unknown' },
      doctorReport: groqResult.report,
      water: waterRec,
      weatherSuccess: !!weather,
      groqSuccess: groqResult.success
    });
  } catch (error) {
    console.error('[Refresh Weather Error]', error.message);
    next(error);
  }
};

module.exports = { analyzePlant, checkHealth, refreshWeather };
