const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

/**
 * Sends an image to the local disease AI service.
 *
 * @param {Buffer|string} imageInput
 * @param {string} speciesId - Canonical species ID
 */
const analyzeDisease = async (imageInput, speciesId) => {
  try {
    if (!speciesId || typeof speciesId !== 'string') {
      return {
        success: false,
        supported: false,
        error: 'Canonical species ID is required for disease detection'
      };
    }

    const formData = new FormData();

    if (Buffer.isBuffer(imageInput)) {
      formData.append(
        'file',
        imageInput,
        {
          filename: 'upload.jpg',
          contentType: 'image/jpeg'
        }
      );
    } else if (typeof imageInput === 'string') {
      formData.append(
        'file',
        fs.createReadStream(imageInput)
      );
    } else {
      throw new Error(
        'Invalid image input type provided to huggingfaceService'
      );
    }

    // IMPORTANT:
    // Python uses this to select the correct disease classes.
    formData.append(
      'species_id',
      speciesId
    );

    const response = await axios.post(
      'http://127.0.0.1:8000/predict',
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 8000
      }
    );

    const data = response.data;

    if (data && data.success) {

      // Disease model does not cover this species.
      if (data.supported === false) {
        console.log(
          `[Disease AI] No disease coverage for ${speciesId}`
        );

        return {
          success: true,
          supported: false,
          speciesId,
          disease: null,
          confidence: null,
          message: data.message
        };
      }

      console.log(
        `[Disease AI] ${speciesId} → ` +
        `${data.prediction} (${data.confidence}%)`
      );

      return {
        success: true,
        supported: true,
        speciesId,
        disease: data.prediction,
        confidence: data.confidence,
        allPredictions: data.all_predictions || []
      };
    }

    const errorMsg =
      data?.error ||
      'Unknown model API error';

    console.error(
      `[HuggingFace API Error] ${errorMsg}`
    );

    return {
      success: false,
      error: errorMsg
    };

  } catch (error) {

    console.error(
      '⚠️ [HuggingFace API Error]',
      error.message
    );

    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  analyzeDisease
};
