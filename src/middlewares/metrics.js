import {
  httpRequestsTotal,
  httpRequestDuration,
  httpErrorsTotal,
} from '../metrics/metrics.js';

export function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : req.originalUrl.split('?')[0];

    const method = req.method;
    const status = res.statusCode;

    httpRequestsTotal.labels(method, route, String(status)).inc();

    if (status >= 400) {
      httpErrorsTotal.labels(method, route, String(status)).inc();
    }

    const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
    httpRequestDuration.labels(method, route, String(status)).observe(durationSec);
  });

  next();
}