import process from 'node:process';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
    max: Number(process.env.RATE_LIMIT_MAX ?? 100),
  },
  weather: {
  forecastUrl:
    process.env.WEATHER_API_URL ?? 'https://api.open-meteo.com/v1/forecast',
  geocodingUrl:
    process.env.GEOCODING_API_URL ??
    'https://geocoding-api.open-meteo.com/v1/search',
  timeoutMs: Number(process.env.REQUEST_TIMEOUT_MS ?? 5000),
  maxWindMs: Number(process.env.WEATHER_MAX_WIND_MS ?? 10),
  maxPrecipMm: Number(process.env.WEATHER_MAX_PRECIP_MM ?? 0),
  defaultHours: Number(process.env.WEATHER_FORECAST_HOURS ?? 24),
 },
};
