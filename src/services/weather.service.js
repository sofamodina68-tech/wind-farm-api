import { config } from '../config/index.js';
import { ExternalServiceError, AppError } from '../errors/AppError.js';

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.weather.timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new ExternalServiceError(
        'BAD_GATEWAY',
        `Погодный сервис вернул ошибку ${res.status}`,
      );
    }
    try {
      return await res.json();
    } catch {
      throw new ExternalServiceError(
        'BAD_GATEWAY',
        'Погодный сервис вернул некорректный JSON',
      );
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ExternalServiceError(
        'GATEWAY_TIMEOUT',
        `Превышен таймаут запроса к погодному сервису (${config.weather.timeoutMs} мс)`,
      );
    }
    if (err instanceof AppError) throw err;
    throw new ExternalServiceError(
      'BAD_GATEWAY',
      `Не удалось получить прогноз: ${err.message}`,
    );
  } finally {
    clearTimeout(timer);
  }
}

function evaluateHour(hour, { maxWindMs, maxPrecipMm }) {
  const reasons = [];
  const wind = hour.windSpeedMs ?? 0;
  const precip = hour.precipitationMm ?? 0;
  if (wind > maxWindMs) {
    reasons.push(`Ветер ${wind} м/с превышает порог ${maxWindMs} м/с`);
  }
  if (precip > maxPrecipMm) {
    reasons.push(`Осадки ${precip} мм превышают порог ${maxPrecipMm} мм`);
  }
  return { suitable: reasons.length === 0, reasons };
}

export const weatherService = {
  async getForecastByCoords({ lat, lon }, hours) {
    const forecastHours = hours ?? config.weather.defaultHours;

    const url = new URL(config.weather.forecastUrl);
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set('hourly', 'temperature_2m,precipitation,wind_speed_10m');
    url.searchParams.set('forecast_hours', String(forecastHours));
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('wind_speed_unit', 'ms');

    const data = await fetchJson(url);
    const hourly = data.hourly;

    const rules = {
      maxWindMs: config.weather.maxWindMs,
      maxPrecipMm: config.weather.maxPrecipMm,
    };

    const forecast = hourly.time.map((time, i) => {
      const hour = {
        time,
        temperature: hourly.temperature_2m[i],
        precipitationMm: hourly.precipitation[i],
        windSpeedMs: hourly.wind_speed_10m[i],
      };
      return { ...hour, ...evaluateHour(hour, rules) };
    });

    const suitable = forecast.every((h) => h.suitable);
    const reasons = forecast.flatMap((h) => h.reasons);

    return {
      location: { lat, lon },
      hours: forecastHours,
      rules,
      suitable,
      reasons: [...new Set(reasons)],
      forecast,
    };
  },
};