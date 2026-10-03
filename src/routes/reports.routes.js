import { Router } from 'express';
import Joi from 'joi';
import { reportsController } from '../controllers/reports.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

const equipmentLoadQuerySchema = Joi.object({
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  minRequests: Joi.number().integer().min(0).default(0),
});

router.get(
  '/equipment-load',
  authenticate,
  authorize('admin'),
  validate({ query: equipmentLoadQuerySchema }),
  reportsController.equipmentLoad,
);

export default router;