import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { requestId } from './middlewares/requestId.js';
import { logger } from './middlewares/logger.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import equipmentRoutes from './routes/equipment.routes.js';

export function createApp() {
  const app = express();

  // 1. Security headers
  app.use(helmet());

  // 2. CORS with explicit whitelist
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
        cb(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      credentials: true,
      maxAge: 600,
    }),
  );

  // 3. Rate limiting on /api
  app.use(
    '/api',
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Слишком много запросов',
            requestId: req.id,
          },
        });
      },
    }),
  );

  // 4. Body parser with size limit
  app.use(express.json({ limit: '100kb' }));

  // 5. Request ID + logger
  app.use(requestId);
  app.use(logger);

  // 6. Routes
  app.get('/api/health', (req, res) => res.json({ status: 'ok', requestId: req.id }));
  app.use('/api/equipment', equipmentRoutes);

  // 7. 404 and error handler (must be last!)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}