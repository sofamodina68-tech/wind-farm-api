import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { httpLogger } from './middlewares/logger.js';
import { metricsMiddleware } from './middlewares/metrics.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import healthRoutes from './routes/health.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import docsRoutes from './routes/docs.routes.js';
import equipmentRoutes from './routes/equipment.routes.js';
import requestsRoutes from './routes/requests.routes.js';
import sitesRoutes from './routes/sites.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import authRoutes from './routes/auth.routes.js';

export function createApp() {
  const app = express();

  // Trust proxy (Nginx) — чтобы req.ip и rate limit видели реальный IP клиента
  app.set('trust proxy', 1);

  // 1. Security headers
  app.use(helmet());

  // 2. Логирование + requestId (pino-http)
  app.use(httpLogger);

  // 3. Метрики Prometheus
  app.use(metricsMiddleware);

  // 4. CORS
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

  // 5. Rate limiting на /api
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

  // 6. Body parser с ограничением размера
  app.use(express.json({ limit: '100kb' }));

  // 7. Cookie parser
  app.use(cookieParser());

  // 8. Routes
  app.use('/metrics', metricsRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/docs', docsRoutes);
  app.use('/api/equipment', equipmentRoutes);
  app.use('/api/requests', requestsRoutes);
  app.use('/api/sites', sitesRoutes);
  app.use('/api/reports', reportsRoutes);

  // 9. 404 и error handler
  app.use(notFound);
  app.use(errorHandler);

  return app;
}