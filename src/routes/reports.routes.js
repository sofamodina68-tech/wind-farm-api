import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller.js';
import { validate } from '../middlewares/validate.js';
import Joi from 'joi';

const router = Router();

const equipmentLoadQuerySchema = Joi.object({
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  minRequests: Joi.number().integer().min(0).default(0),
});

// GET /api/reports/equipment-load
router.get(
  '/equipment-load',
  validate({ query: equipmentLoadQuerySchema }),
  reportsController.equipmentLoad,
);

export default router;