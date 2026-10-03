import { registry, metricsContentType } from '../metrics/metrics.js';

export const metricsController = {
  get: async (req, res) => {
    res.setHeader('Content-Type', metricsContentType);
    res.end(await registry.metrics());
  },
};