import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({
  path: path.resolve(process.cwd(), '.env.test'),
  quiet: true,
});
process.env.NODE_ENV = 'test';

jest.unstable_mockModule('../src/services/weather.service.js', () => ({
  weatherService: {
    getForecastByCoords: jest.fn(async () => ({
      location: { lat: 0, lon: 0 },
      hours: 24,
      rules: { maxWindMs: 10, maxPrecipMm: 0 },
      suitable: true,
      reasons: [],
      forecast: [],
    })),
  },
}));