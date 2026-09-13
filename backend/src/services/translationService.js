const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const axios = require('axios');

let plantNameMap = {};
const dictionaryPath = path.join(__dirname, '../../plant_names.json');

try {
  if (fsSync.existsSync(dictionaryPath)) {
    const fileContent = fsSync.readFileSync(dictionaryPath, 'utf-8');
    const rawMap = JSON.parse(fileContent);
    for (const key of Object.keys(rawMap)) {
      plantNameMap[key.toLowerCase().trim()] = rawMap[key];
    }
  }
} catch (error) {
  console.warn('⚠️ Could not load plant_names.json dictionary.');
}

async function saveToCache() {
  try {
    await fs.writeFile(dictionaryPath, JSON.stringify(plantNameMap, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save to plant_names.json:', err.message);
  }
}

/**
 * Async lookup mapping English plant name (or scientific name) to Hindi name.
 * Uses Wikidata API for dynamic resolution if not found in local cache.
 */
async function getHindiName(scientificName = '', englishName = '') {
  const normEng = (englishName || '').toLowerCase().trim();
  const normSci = (scientificName || '').toLowerCase().trim();

  // 1. Check direct cache lookup
  if (normEng && plantNameMap[normEng] !== undefined) return plantNameMap[normEng];
  if (normSci && plantNameMap[normSci] !== undefined) return plantNameMap[normSci];

  // 2. Fetch from Wikidata using Scientific Name
  if (!scientificName) return null;

  try {
    const headers = { 'User-Agent': 'PlantSathiApp/1.0 (test@example.com)' };
    const searchRes = await axios.get('https://www.wikidata.org/w/api.php', {
      params: { action: 'wbsearchentities', search: scientificName, language: 'en', format: 'json' },
      headers,
      timeout: 5000
    });

    const entities = searchRes.data.search;
    if (entities && entities.length > 0) {
      const id = entities[0].id;
      const entityRes = await axios.get('https://www.wikidata.org/w/api.php', {
        params: { action: 'wbgetentities', ids: id, languages: 'hi', props: 'labels', format: 'json' },
        headers,
        timeout: 5000
      });

      const hiLabel = entityRes.data.entities[id]?.labels?.hi;
      if (hiLabel && hiLabel.value) {
        plantNameMap[normSci] = hiLabel.value;
        if (normEng) plantNameMap[normEng] = hiLabel.value;
        await saveToCache();
        return hiLabel.value;
      }
    }
    
    // No Hindi label found on Wikidata, cache null to avoid repeated lookups
    plantNameMap[normSci] = null;
    await saveToCache();
    return null;

  } catch (err) {
    console.error('[Wikidata Fetch Error]', err.message);
    return null;
  }
}

module.exports = {
  getHindiName
};
