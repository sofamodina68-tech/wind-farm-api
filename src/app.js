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
import requestsRoutes from './routes/requests.routes.js';
import sitesRoutes from './routes/sites.routes.js';
import reportsRoutes from './routes/reports.routes.js';

export function createApp() {
  const app = express();

  // 1. Security headers
  app.use(helmet());

  // 2. Request ID + logger — как можно раньше,
  //    чтобы все дальнейшие ответы (429, 413, 400, CORS) имели requestId
  //    и попадали в лог.
  app.use(requestId);
  app.use(logger);

  // 3. CORS — отклонённые запросы теперь логируются
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
        const err = new Error('Not allowed by CORS');
        err.code = 'CORS_FORBIDDEN';
        err.statusCode = 403;
        cb(err);
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id', 'Location'],
      credentials: true,
      maxAge: 600,
    }),
  );

  // 4. Rate limiting на /api — тоже попадает в лог
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

  // 5. Body parser с ограничением размера
  app.use(express.json({ limit: '100kb' }));

  // 6. Routes
  app.get('/api/health', (req, res) =>
    res.json({ status: 'ok', requestId: req.id }),
  );
  app.use('/api/equipment', equipmentRoutes);
  app.use('/api/requests', requestsRoutes);
  app.use('/api/sites', sitesRoutes);
  app.use('/api/reports', reportsRoutes);

  // 7. 404 и обработчик ошибок — последними
  app.use(notFound);
  app.use(errorHandler);

  return app;
}