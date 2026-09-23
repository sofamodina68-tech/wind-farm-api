import { Router } from 'express';
import { assigneesController } from '../controllers/assignees.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  assignTeamSchema,
  assigneeParamsSchema,
  requestIdParamSchema,
} from '../validators/assignees.schema.js';

const router = Router({ mergeParams: true });

// GET /api/requests/:id/assignees — состав бригады
router.get(
  '/',
  validate({ params: requestIdParamSchema }),
  assigneesController.list,
);

// POST /api/requests/:id/assignees — назначить бригаду
router.post(
  '/',
  validate({ params: requestIdParamSchema, body: assignTeamSchema }),
  assigneesController.assign,
);

// DELETE /api/requests/:id/assignees/:userId — снять специалиста
router.delete(
  '/:userId',
  validate({ params: assigneeParamsSchema }),
  assigneesController.remove,
);

export default router;