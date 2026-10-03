import { Router } from 'express';
import { requestsController } from '../controllers/requests.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import {
  createRequestSchema,
  updateRequestSchema,
  changeStatusSchema,
  listRequestsQuerySchema,
  idParamSchema,
} from '../validators/requests.schema.js';
import assigneesRoutes from './assignees.routes.js';

const router = Router();

// Чтение — любой аутентифицированный пользователь
router.get(
  '/',
  authenticate,
  validate({ query: listRequestsQuerySchema }),
  requestsController.list,
);

router.get(
  '/:id',
  authenticate,
  validate({ params: idParamSchema }),
  requestsController.getById,
);

router.get(
  '/:id/history',
  authenticate,
  validate({ params: idParamSchema }),
  requestsController.history,
);

// Создание/обновление/статус — technician или admin
router.post(
  '/',
  authenticate,
  authorize('technician', 'admin'),
  validate({ body: createRequestSchema }),
  requestsController.create,
);

router.patch(
  '/:id',
  authenticate,
  authorize('technician', 'admin'),
  validate({ params: idParamSchema, body: updateRequestSchema }),
  requestsController.update,
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('technician', 'admin'),
  validate({ params: idParamSchema, body: changeStatusSchema }),
  requestsController.changeStatus,
);

// Удаление — только admin
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: idParamSchema }),
  requestsController.remove,
);

// Вложенный ресурс assignees — только admin
router.use('/:id/assignees', authenticate, authorize('admin'), assigneesRoutes);

export default router;