import { fetchClient } from './client';

/**
 * Converts a base64 Data URL to a Blob for multipart upload.
 */
const dataURLtoBlob = (dataurl) => {
  const arr  = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n      = bstr.length;
  const u8   = new Uint8Array(n);
  while (n--) u8[n] = bstr.charCodeAt(n);
  return new Blob([u8], { type: mime });
};

/**
 * Requests the browser's geolocation (optional – used for real weather).
 * Resolves to { lat, lon } or null if denied / unavailable.
 */
const getGeoLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      ()    => resolve(null),
      { timeout: 5000 }
    );
  });

export const plantService = {
  /**
   * Sends the plant image to the backend analysis pipeline.
   * Attaches geolocation query params for live weather data.
   */
  analyzePlant: async (imageDataUrl) => {
    const formData = new FormData();
    formData.append('image', dataURLtoBlob(imageDataUrl), 'scan.jpg');

    // Try to get GPS coordinates for real weather
    const geo = await getGeoLocation();
    const params = geo ? `?lat=${geo.lat}&lon=${geo.lon}` : '';

    return await fetchClient(`/analyze-plant${params}`, {
      method : 'POST',
      body   : formData,
    });
  },

  /** Backend health check – verifies all API keys are configured. */
  checkHealth: async () => {
    return await fetchClient('/health', { method: 'GET' });
  },

  /**
   * Sends a chat message to the Groq AI with full conversation history and plant context.
   * @param {Array} messages - Full conversation: [{role:'user'|'assistant', content: string}]
   * @param {Object|null} plantContext - The current scan's apiData for contextual answers
   * @param {string} language - 'en' or 'hi'
   */
  chatWithPlantSathi: async (messages, plantContext = null, language = 'en') => {
    return await fetchClient('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, plantContext, language }),
    });
  },

  /**
   * Refreshes weather for a given lat/lon and regenerates the Groq report
   */
  refreshWeather: async (lat, lon, plantContext = null) => {
    return await fetchClient('/refresh-weather', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon, plantContext }),
    });
  }
};
