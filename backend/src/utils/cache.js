const crypto = require('crypto');

// Simple in-memory cache
// In production, this would be Redis or a database
const analysisCache = new Map();

function generateImageHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function getCachedResult(hash) {
  return analysisCache.get(hash);
}

function setCachedResult(hash, data) {
  // Cache for 24 hours
  analysisCache.set(hash, data);
  setTimeout(() => {
    analysisCache.delete(hash);
  }, 24 * 60 * 60 * 1000);
}

module.exports = {
  generateImageHash,
  getCachedResult,
  setCachedResult
};
