import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { httpLogger } from './middlewares/logger.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import healthRoutes from './routes/health.routes.js';
import equipmentRoutes from './routes/equipment.routes.js';
import requestsRoutes from './routes/requests.routes.js';
import sitesRoutes from './routes/sites.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import authRoutes from './routes/auth.routes.js';

export function createApp() {
  const app = express();

  // 1. Security headers
  app.use(helmet());

  // 2. Логирование + requestId (pino-http) — как можно раньше,
  //    чтобы все дальнейшие ответы (429, 413, 400, CORS) имели requestId
  app.use(httpLogger);

  // 3. CORS
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

  // 4. Rate limiting на /api
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

  // 6. Cookie parser
  app.use(cookieParser());

  // 7. Routes
  // /api/health/live — процесс жив
  // /api/health/ready — БД доступна (иначе 503)
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/equipment', equipmentRoutes);
  app.use('/api/requests', requestsRoutes);
  app.use('/api/sites', sitesRoutes);
  app.use('/api/reports', reportsRoutes);

  // 8. 404 и error handler
  app.use(notFound);
  app.use(errorHandler);

  return app;
}