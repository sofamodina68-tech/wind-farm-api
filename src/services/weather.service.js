import { config } from '../config/index.js';

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.weather.timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export const weatherService = {
  async getForecastByCoords({ lat, lon }, days = 3) {
    const url = new URL(config.weather.forecastUrl);
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set(
      'daily',
      'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
    );
    url.searchParams.set('forecast_days', String(days));
    url.searchParams.set('timezone', 'auto');

    const data = await fetchJson(url);
    const daily = data.daily;

    const suitable = daily.time.map((_, i) => {
      const precip = daily.precipitation_sum[i] ?? 0;
      const wind = daily.wind_speed_10m_max[i] ?? 0;
      return precip === 0 && wind < 10;
    });

    return {
      daily: {
        time: daily.time,
        temperatureMax: daily.temperature_2m_max,
        temperatureMin: daily.temperature_2m_min,
        precipitation: daily.precipitation_sum,
        windSpeedMax: daily.wind_speed_10m_max,
      },
      suitableForOutdoorWork: suitable,
      rule: 'осадки = 0 мм и ветер < 10 м/с',
    };
  },
};