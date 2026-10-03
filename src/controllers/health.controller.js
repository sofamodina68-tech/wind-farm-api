import { sequelize } from '../../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const healthController = {
  live: (req, res) => {
    res.json({
      status: 'ok',
      requestId: req.id,
      timestamp: new Date().toISOString(),
    });
  },

  ready: asyncHandler(async (req, res) => {
    try {
      await sequelize.authenticate();
      res.json({
        status: 'ready',
        requestId: req.id,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      req.log?.warn({ err }, 'Readiness check failed: DB unavailable');
      res.status(503).json({
        error: {
          code: 'NOT_READY',
          message: 'База данных недоступна',
          requestId: req.id,
        },
      });
    }
  }),
};