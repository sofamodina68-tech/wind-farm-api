import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller.js';
import { validate } from '../middlewares/validate.js';
import { siteIdParamSchema } from '../validators/assignees.schema.js';

const router = Router();

// GET /api/sites/:id/summary
router.get(
  '/:id/summary',
  validate({ params: siteIdParamSchema }),
  reportsController.siteSummary,
);

export default router;