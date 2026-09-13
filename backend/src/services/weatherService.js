const axios = require('axios');

/**
 * Real OpenWeatherMap integration.
 * Falls back gracefully if key or location is unavailable.
 */
async function getWeather(lat, lon) {
  const apiKey = process.env.WEATHER_API_KEY;

  if (!apiKey) {
    console.warn('[Weather] WEATHER_API_KEY not set – returning null.');
    return null;
  }

  // Default to New Delhi if no coordinates provided
  const latitude  = lat  || '28.6139';
  const longitude = lon  || '77.2090';

  try {
    const [owmRes, meteoRes] = await Promise.allSettled([
      axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          lat: latitude,
          lon: longitude,
          appid: apiKey,
          units: 'metric',
        },
        timeout: 8000,
      }),
      axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: latitude,
          longitude: longitude,
          daily: 'uv_index_max',
          timezone: 'auto'
        },
        timeout: 5000,
      })
    ]);

    if (owmRes.status === 'rejected') throw owmRes.reason;
    const d = owmRes.value.data;

    let uvIndex = null;
    if (meteoRes.status === 'fulfilled' && meteoRes.value.data?.daily?.uv_index_max?.length > 0) {
      uvIndex = meteoRes.value.data.daily.uv_index_max[0];
    }

    return {
      temperature: Math.round(d.main.temp),
      humidity: d.main.humidity,
      condition: d.weather[0]?.description || 'Clear',
      windSpeed: Math.round(d.wind.speed * 3.6), // m/s → km/h
      uvIndex,
      feelsLike: Math.round(d.main.feels_like),
      visibility: d.visibility ? Math.round(d.visibility / 1000) : null,
      location: d.name || 'Local',
      country: d.sys?.country || '',
      sunrise: d.sys?.sunrise ? new Date(d.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      sunset: d.sys?.sunset ? new Date(d.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[Weather Error]', err.response?.data?.message || err.message);
    return null; // pipeline continues without weather
  }
}

module.exports = { getWeather };
