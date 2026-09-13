/**
 * Dedicated Plant Disease Detection Service
 * Uses a real computer vision model (MobileNetV2) via Hugging Face Inference API.
 * This model was trained on the PlantVillage dataset for leaf disease classification.
 * 
 * Groq is NEVER used here. Groq only explains diseases — it does not detect them.
 */
const axios = require('axios');

const HF_MODEL = 'linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

// Severity mapping based on confidence ranges
function mapSeverity(confidence, label) {
  if (label.toLowerCase().includes('healthy')) return 'None';
  if (confidence >= 85) return 'High';
  if (confidence >= 60) return 'Medium';
  return 'Low';
}

// Clean up the raw HF label into a human-readable disease name
function cleanLabel(raw) {
  // HF labels come as "Tomato___Late_blight" or "Apple___healthy"
  const parts = raw.split('___');
  const diseasePart = parts.length > 1 ? parts[1] : parts[0];
  return diseasePart
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

function extractPlantFromLabel(raw) {
  const parts = raw.split('___');
  return parts[0].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}

/**
 * @param {Buffer} imageBuffer  - Raw image bytes
 * @param {string} plantName    - Plant name from PlantNet (for context logging)
 * @param {string} scientificName - Scientific name from PlantNet
 * @returns {Promise<{success: boolean, disease: object}>}
 */
async function detectDisease(imageBuffer, plantName = 'Unknown plant', scientificName = '') {
  try {
    console.log(`[Disease CV] Running dedicated vision model for: ${plantName}`);

    const response = await axios.post(HF_API_URL, imageBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        ...(process.env.HF_API_KEY ? { 'Authorization': `Bearer ${process.env.HF_API_KEY}` } : {}),
      },
      timeout: 30000,
    });

    const predictions = response.data;

    if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
      console.warn('[Disease CV] Model returned empty predictions.');
      return fallbackResult('No predictions returned by the model.');
    }

    // Log all predictions for debugging
    console.log('[Disease CV] Raw predictions:', JSON.stringify(predictions.slice(0, 5)));

    const top = predictions[0];
    const confidence = Math.round(top.score * 100);
    const rawLabel = top.label || 'Unknown';
    const diseaseName = cleanLabel(rawLabel);
    const detectedPlant = extractPlantFromLabel(rawLabel);
    const isHealthy = rawLabel.toLowerCase().includes('healthy');

    return {
      success: true,
      disease: {
        name: isHealthy ? 'Healthy' : diseaseName,
        confidence,
        severity: mapSeverity(confidence, rawLabel),
        affectedArea: isHealthy ? 'None' : 'Leaf surface',
        cause: isHealthy
          ? `Vision model classifies ${detectedPlant} as healthy with ${confidence}% confidence.`
          : `Vision model detected ${diseaseName} on ${detectedPlant} with ${confidence}% confidence.`,
        status: isHealthy ? 'Healthy' : 'Diseased',
        modelSource: 'HuggingFace MobileNetV2 (PlantVillage)',
        allPredictions: predictions.slice(0, 5).map(p => ({
          label: cleanLabel(p.label),
          confidence: Math.round(p.score * 100),
        })),
      },
    };
  } catch (err) {
    // If HF model is loading (503), retry once after a short delay
    if (err.response?.status === 503) {
      console.log('[Disease CV] Model is loading, retrying in 10s...');
      await new Promise(r => setTimeout(r, 10000));
      try {
        const retryResponse = await axios.post(HF_API_URL, imageBuffer, {
          headers: {
            'Content-Type': 'application/octet-stream',
            ...(process.env.HF_API_KEY ? { 'Authorization': `Bearer ${process.env.HF_API_KEY}` } : {}),
          },
          timeout: 30000,
        });

        const predictions = retryResponse.data;
        if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
          return fallbackResult('Retry returned empty.');
        }

        const top = predictions[0];
        const confidence = Math.round(top.score * 100);
        const rawLabel = top.label || 'Unknown';
        const diseaseName = cleanLabel(rawLabel);
        const detectedPlant = extractPlantFromLabel(rawLabel);
        const isHealthy = rawLabel.toLowerCase().includes('healthy');

        return {
          success: true,
          disease: {
            name: isHealthy ? 'Healthy' : diseaseName,
            confidence,
            severity: mapSeverity(confidence, rawLabel),
            affectedArea: isHealthy ? 'None' : 'Leaf surface',
            cause: isHealthy
              ? `Vision model classifies ${detectedPlant} as healthy with ${confidence}% confidence.`
              : `Vision model detected ${diseaseName} on ${detectedPlant} with ${confidence}% confidence.`,
            status: isHealthy ? 'Healthy' : 'Diseased',
            modelSource: 'HuggingFace MobileNetV2 (PlantVillage)',
            allPredictions: predictions.slice(0, 5).map(p => ({
              label: cleanLabel(p.label),
              confidence: Math.round(p.score * 100),
            })),
          },
        };
      } catch (retryErr) {
        console.error('[Disease CV] Retry also failed:', retryErr.message);
        return fallbackResult(retryErr.message);
      }
    }

    console.error('[Disease CV Error]', err.message);
    return fallbackResult(err.message);
  }
}

function fallbackResult(reason) {
  return {
    success: false,
    disease: {
      name: 'Analysis Unavailable',
      confidence: 0,
      severity: 'None',
      affectedArea: 'None',
      cause: `Disease detection model could not process the image: ${reason}`,
      status: 'Unknown',
      modelSource: 'Unavailable',
      allPredictions: [],
    },
  };
}

module.exports = { detectDisease };
