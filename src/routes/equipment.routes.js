import { Router } from 'express';
import { equipmentController } from '../controllers/equipment.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import {
  createEquipmentSchema,
  updateEquipmentSchema,
  listEquipmentQuerySchema,
  weatherQuerySchema,
  idParamSchema,
} from '../validators/equipment.schema.js';

const router = Router();

// Чтение — доступно любому аутентифицированному пользователю
router.get(
  '/',
  authenticate,
  validate({ query: listEquipmentQuerySchema }),
  equipmentController.list,
);

router.get(
  '/:id',
  authenticate,
  validate({ params: idParamSchema }),
  equipmentController.getById,
);

router.get(
  '/:id/requests',
  authenticate,
  validate({ params: idParamSchema }),
  equipmentController.getRequests,
);

router.get(
  '/:id/weather',
  authenticate,
  validate({ params: idParamSchema, query: weatherQuerySchema }),
  equipmentController.getWeather,
);

// Изменяющие операции — только admin
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate({ body: createEquipmentSchema }),
  equipmentController.create,
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: idParamSchema, body: updateEquipmentSchema }),
  equipmentController.update,
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: idParamSchema }),
  equipmentController.remove,
);

export default router;