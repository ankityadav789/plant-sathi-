const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ============================================================================
// Registry paths
// ============================================================================

const BACKEND_DATA_DIR = path.join(
  __dirname,
  '..',
  '..',
  'data'
);

const SPECIES_REGISTRY_PATH = path.join(
  BACKEND_DATA_DIR,
  'species_registry.json'
);

const DISEASE_REGISTRY_PATH = path.join(
  BACKEND_DATA_DIR,
  'disease_registry.json'
);

const PLANTNET_META_PATH = path.join(
  BACKEND_DATA_DIR,
  'plantnet300k_species.json'
);


// ============================================================================
// Local PlantNet gate configuration
// ============================================================================

// Minimum local top-1 probability required.
const LOCAL_MIN_CONFIDENCE = 70;

// Minimum difference between top-1 and top-2.
// Example:
// top-1 = 80%, top-2 = 20% → margin = 60% → good
// top-1 = 53%, top-2 = 45% → margin = 8% → reject
const LOCAL_MIN_MARGIN = 15;


// ============================================================================
// Cached registries
// ============================================================================

let speciesRegistry = null;
let diseaseRegistry = null;
let plantNetMeta = null;


function loadJsonFile(filePath, label) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(
      `[${label}] Failed to load ${filePath}:`,
      error.message
    );

    return {};
  }
}


function loadRegistries() {
  if (!speciesRegistry) {
    speciesRegistry = loadJsonFile(
      SPECIES_REGISTRY_PATH,
      'Species Registry'
    );
  }

  if (!diseaseRegistry) {
    diseaseRegistry = loadJsonFile(
      DISEASE_REGISTRY_PATH,
      'Disease Registry'
    );
  }

  if (!plantNetMeta) {
    plantNetMeta = loadJsonFile(
      PLANTNET_META_PATH,
      'PlantNet Metadata'
    );
  }

  return {
    speciesRegistry,
    diseaseRegistry,
    plantNetMeta,
  };
}


// ============================================================================
// Local PlantNet-300K
// ============================================================================

async function identifyPlantLocal(imageBuffer, originalname) {
  try {
    const form = new FormData();

    form.append('file', imageBuffer, {
      filename: originalname || 'plant.jpg',
      contentType: 'image/jpeg',
    });

    console.log(
      '[Local PlantNet] POST http://127.0.0.1:8000/identify-species'
    );

    const response = await axios.post(
      'http://127.0.0.1:8000/identify-species',
      form,
      {
        headers: form.getHeaders(),
        timeout: 10000,
      }
    );

    if (!response.data?.success) {
      console.log(
        '[Local PlantNet] Identification failed'
      );

      return {
        success: false,
        reason: 'Local PlantNet returned an unsuccessful response',
      };
    }

    const predictions =
      response.data.predictions || [];

    if (predictions.length === 0) {
      return {
        success: false,
        reason: 'Local PlantNet returned no predictions',
      };
    }

    const topPrediction = predictions[0];

    console.log(
      `[Local PlantNet] Top prediction: ` +
      `${topPrediction.scientific_name} ` +
      `(${topPrediction.confidence}%)`
    );

    return {
      success: true,
      model: response.data.model,
      predictions,
      topPrediction,
    };

  } catch (error) {
    console.error(
      '[Local PlantNet Error]',
      error.response?.data || error.message
    );

    return {
      success: false,
      reason: error.message,
    };
  }
}


// ============================================================================
// Resolve local PlantNet prediction to our canonical taxonomy
// ============================================================================

function resolveLocalCanonicalSpecies(prediction) {
  if (!prediction) {
    return null;
  }

  const {
    class_index: classIndex,
    scientific_name: scientificName,
  } = prediction;

  const {
    speciesRegistry: projectRegistry,
    diseaseRegistry,
    plantNetMeta: meta,
  } = loadRegistries();

  // --------------------------------------------------------------------------
  // 1. Prefer the canonical ID already generated for this PlantNet class.
  // --------------------------------------------------------------------------

  const metaEntry =
    meta?.[String(classIndex)];

  if (metaEntry?.canonical_species_id) {
    return metaEntry.canonical_species_id;
  }

  // --------------------------------------------------------------------------
  // 2. Fallback: match scientific name against our registries.
  // --------------------------------------------------------------------------

  const normalizedName =
    scientificName
      ?.replace(/\s+L\.$/, '')
      ?.replace(/\s+$/, '')
      ?.trim()
      ?.toLowerCase();

  if (!normalizedName) {
    return null;
  }

  for (const [canonicalId, entry] of Object.entries(projectRegistry || {})) {
    if (
      entry?.scientific_name &&
      entry.scientific_name.trim().toLowerCase() === normalizedName
    ) {
      return canonicalId;
    }
  }

  for (const [canonicalId, entry] of Object.entries(diseaseRegistry || {})) {
    if (
      entry?.scientific_name &&
      entry.scientific_name.trim().toLowerCase() === normalizedName
    ) {
      return canonicalId;
    }
  }

  return null;
}


// ============================================================================
// Determine whether local result is relevant to our supported taxonomy
// ============================================================================

function isKnownApplicationSpecies(canonicalSpeciesId) {
  if (!canonicalSpeciesId) {
    return false;
  }

  const {
    speciesRegistry: projectRegistry,
    diseaseRegistry,
  } = loadRegistries();

  return Boolean(
    projectRegistry?.[canonicalSpeciesId] ||
    diseaseRegistry?.[canonicalSpeciesId]
  );
}


// ============================================================================
// Local PlantNet confidence + margin gate
// ============================================================================

function evaluateLocalPrediction(localResult) {
  if (!localResult?.success) {
    return {
      accepted: false,
      reason: 'Local PlantNet request failed',
    };
  }

  const predictions =
    localResult.predictions || [];

  if (predictions.length === 0) {
    return {
      accepted: false,
      reason: 'No local PlantNet predictions returned',
    };
  }

  const top1 = predictions[0];

  const top1Confidence =
    Number(top1.confidence) || 0;

  const top2Confidence =
    Number(predictions[1]?.confidence) || 0;

  const margin =
    top1Confidence - top2Confidence;

  const canonicalSpeciesId =
    resolveLocalCanonicalSpecies(top1);

  console.log(
    `[Local Species Gate] ` +
    `${top1.scientific_name} | ` +
    `confidence=${top1Confidence}% | ` +
    `margin=${margin.toFixed(2)}% | ` +
    `canonical=${canonicalSpeciesId || 'NONE'}`
  );

  // --------------------------------------------------------------------------
  // Gate 1: must have a safe canonical taxonomy mapping
  // --------------------------------------------------------------------------

  if (!canonicalSpeciesId) {
    return {
      accepted: false,
      reason: 'Local prediction has no safe canonical species mapping',
      canonicalSpeciesId: null,
      confidence: top1Confidence,
      margin,
    };
  }

  // --------------------------------------------------------------------------
  // Gate 2: species must matter to our application taxonomy
  // --------------------------------------------------------------------------

  if (!isKnownApplicationSpecies(canonicalSpeciesId)) {
    return {
      accepted: false,
      reason:
        'Local species is outside the currently trusted application taxonomy',
      canonicalSpeciesId,
      confidence: top1Confidence,
      margin,
    };
  }

  // --------------------------------------------------------------------------
  // Gate 3: minimum confidence
  // --------------------------------------------------------------------------

  if (top1Confidence < LOCAL_MIN_CONFIDENCE) {
    return {
      accepted: false,
      reason:
        `Local confidence ${top1Confidence}% is below ` +
        `${LOCAL_MIN_CONFIDENCE}%`,
      canonicalSpeciesId,
      confidence: top1Confidence,
      margin,
    };
  }

  // --------------------------------------------------------------------------
  // Gate 4: top-1 vs top-2 separation
  // --------------------------------------------------------------------------

  if (margin < LOCAL_MIN_MARGIN) {
    return {
      accepted: false,
      reason:
        `Local confidence margin ${margin.toFixed(2)}% is below ` +
        `${LOCAL_MIN_MARGIN}%`,
      canonicalSpeciesId,
      confidence: top1Confidence,
      margin,
    };
  }

  // --------------------------------------------------------------------------
  // Accepted
  // --------------------------------------------------------------------------

  return {
    accepted: true,
    canonicalSpeciesId,
    confidence: top1Confidence,
    margin,
    topPrediction: top1,
  };
}


// ============================================================================
// Real PlantNet API v2
// ============================================================================

async function identifyPlantExternal(imageBuffer, originalname) {
  const apiKey = process.env.PLANTNET_API_KEY;

  if (!apiKey) {
    throw new Error(
      'PLANTNET_API_KEY is missing. Please configure your environment variables.'
    );
  }

  const form = new FormData();

  form.append('images', imageBuffer, {
    filename: originalname || 'plant.jpg',
    contentType: 'image/jpeg',
  });

  form.append('organs', 'auto');

  const url =
    `https://my-api.plantnet.org/v2/identify/all` +
    `?api-key=${apiKey}&nb-results=3&lang=en`;

  const safeUrl =
    `https://my-api.plantnet.org/v2/identify/all` +
    `?api-key=***&nb-results=3&lang=en`;

  console.log(
    `[PlantNet API Request] POST ${safeUrl}`
  );

  const headers = form.getHeaders();

  headers['Content-Length'] =
    form.getLengthSync().toString();

  try {
    const response = await axios.post(
      url,
      form,
      {
        headers,
        timeout: 30000,
      }
    );

    const results =
      response.data.results;

    console.log(
      '[PlantNet API Response]:',
      JSON.stringify(
        response.data,
        null,
        2
      )
    );

    if (!results || results.length === 0) {
      return {
        success: false,
        message:
          'No plant detected in the image. Please try with a clearer photo.',
      };
    }

    const matches =
      results.map((r) => {
        const score =
          Math.round(r.score * 100);

        const scientificName =
          r.species.scientificNameWithoutAuthor ||
          'Unknown';

        const family =
          (
            r.species.family &&
            r.species.family.scientificNameWithoutAuthor
          ) || 'Unknown';

        const commonNames =
          r.species.commonNames || [];

        const englishName =
          commonNames.length > 0
            ? commonNames[0]
            : scientificName;

        return {
          scientificName,
          family,
          englishName,
          confidence: score,
        };
      });

    return {
      success: true,
      matches,
    };

  } catch (err) {
    const status =
      err.response?.status ||
      'NO_STATUS';

    const data =
      err.response?.data ||
      null;

    const code =
      err.code;

    console.error(
      `[PlantNet Error] Status: ${status} | Code: ${code}`
    );

    console.error(
      '[PlantNet Error] Response Body:',
      data
        ? JSON.stringify(data)
        : 'No response body'
    );

    console.error(
      '[PlantNet Error] Message:',
      err.message
    );

    if (
      code === 'ECONNABORTED' ||
      err.message.includes('timeout')
    ) {
      throw new Error(
        `Plant identification service timed out (30s). Root cause: ${err.message}`
      );
    }

    if (
      status === 401 ||
      status === 403
    ) {
      const errorMsg =
        data
          ? JSON.stringify(data)
          : 'No response body provided by PlantNet';

      throw new Error(
        `PlantNet Authentication Error (Status ${status}). Exact response: ${errorMsg}`
      );
    }

    if (status === 404) {
      return {
        success: false,
        message:
          'No plant could be identified from this image.',
      };
    }

    if (status === 400) {
      const errorMsg =
        data?.message ||
        'Unknown validation error';

      throw new Error(
        `PlantNet validation or image error: ${errorMsg}`
      );
    }

    if (!err.response) {
      throw new Error(
        `Network or DNS error connecting to PlantNet: ${err.message}`
      );
    }

    throw new Error(
      `Failed to connect to the PlantNet Identification service. ` +
      `Reason: ${err.message} (Status: ${status})`
    );
  }
}


// ============================================================================
// Main species identification
// ============================================================================

async function identifyPlant(imageBuffer, originalname) {

  // ==========================================================================
  // 1. Try local PlantNet-300K
  // ==========================================================================

  const localResult =
    await identifyPlantLocal(
      imageBuffer,
      originalname
    );

  if (localResult.success) {

    const gate =
      evaluateLocalPrediction(localResult);

    if (gate.accepted) {

      const top =
        gate.topPrediction;

      console.log(
        `[Local PlantNet] ✅ ACCEPTED`
      );

      console.log(
        `[Local PlantNet] ` +
        `${top.scientific_name} ` +
        `(${gate.confidence}%)`
      );

      return {
        success: true,

        source: 'local-plantnet-300k',

        canonicalSpeciesId:
          gate.canonicalSpeciesId,

        matches: localResult.predictions.map(
          (prediction) => ({
            scientificName:
              prediction.scientific_name,

            family:
              'Unknown',

            englishName:
              prediction.scientific_name,

            confidence:
              prediction.confidence,
          })
        ),

        localModel: {
          accepted: true,
          confidence: gate.confidence,
          margin: gate.margin,
        },
      };
    }

    console.log(
      `[Local PlantNet] ❌ REJECTED: ${gate.reason}`
    );
  } else {
    console.log(
      `[Local PlantNet] ❌ Unavailable: ${localResult.reason}`
    );
  }


  // ==========================================================================
  // 2. Existing external PlantNet fallback
  // ==========================================================================

  console.log(
    '[Species Identification] Using external PlantNet API'
  );

  const externalResult =
    await identifyPlantExternal(
      imageBuffer,
      originalname
    );

  return {
    ...externalResult,
    source: 'plantnet-api',
  };
}


module.exports = {
  identifyPlant,
  identifyPlantLocal,
  identifyPlantExternal,
  evaluateLocalPrediction,
};