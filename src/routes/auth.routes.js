import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import process from 'node:process';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { registerSchema, loginSchema } from '../validators/auth.schema.js';

const router = Router();

// Отдельный rate limit на вход — защита от брутфорса
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Слишком много попыток входа, повторите позже',
        requestId: req.id,
      },
    });
  },
});

router.post(
  '/register',
  validate({ body: registerSchema }),
  authController.register,
);

router.post(
  '/login',
  loginLimiter,
  validate({ body: loginSchema }),
  authController.login,
);

router.post('/refresh', authController.refresh);

router.post('/logout', authController.logout);

router.get('/me', authenticate, authController.me);

export default router;