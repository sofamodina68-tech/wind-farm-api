import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller.js';
import { validate } from '../middlewares/validate.js';
import { siteIdParamSchema } from '../validators/assignees.schema.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get(
  '/:id/summary',
  authenticate,
  validate({ params: siteIdParamSchema }),
  reportsController.siteSummary,
);

export default router;