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

/**
 * @openapi
 * /equipment:
 *   get:
 *     tags: [Equipment]
 *     summary: Список оборудования
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [operational, maintenance, fault, decommissioned] }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [turbine, inverter, sensor, substation] }
 *       - in: query
 *         name: siteId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Список оборудования
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ListResponse' }
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get(
  '/',
  authenticate,
  validate({ query: listEquipmentQuerySchema }),
  equipmentController.list,
);

/**
 * @openapi
 * /equipment/{id}:
 *   get:
 *     tags: [Equipment]
 *     summary: Карточка оборудования
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Карточка с site и passport
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/Equipment' }
 *       404:
 *         description: Не найдено
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get(
  '/:id',
  authenticate,
  validate({ params: idParamSchema }),
  equipmentController.getById,
);

/**
 * @openapi
 * /equipment/{id}/requests:
 *   get:
 *     tags: [Equipment]
 *     summary: Заявки по конкретной единице оборудования
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Список заявок
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ListResponse' }
 *       404:
 *         description: Оборудование не найдено
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get(
  '/:id/requests',
  authenticate,
  validate({ params: idParamSchema }),
  equipmentController.getRequests,
);

/**
 * @openapi
 * /equipment/{id}/weather:
 *   get:
 *     tags: [Equipment]
 *     summary: Прогноз погоды и пригодность окна для наружных работ
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: hours
 *         schema: { type: integer, minimum: 1, maximum: 72 }
 *     responses:
 *       200:
 *         description: Прогноз и пригодность
 *       404:
 *         description: Оборудование не найдено
 *       502:
 *         description: Внешний сервис недоступен
 *       504:
 *         description: Таймаут внешнего сервиса
 */
router.get(
  '/:id/weather',
  authenticate,
  validate({ params: idParamSchema, query: weatherQuerySchema }),
  equipmentController.getWeather,
);

/**
 * @openapi
 * /equipment:
 *   post:
 *     tags: [Equipment]
 *     summary: Создание единицы оборудования
 *     description: Только admin.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, serialNumber, installedAt]
 *             properties:
 *               name: { type: string, minLength: 3, maxLength: 100 }
 *               type: { type: string, enum: [turbine, inverter, sensor, substation] }
 *               serialNumber: { type: string }
 *               installedAt: { type: string, format: date-time }
 *               location:
 *                 type: object
 *                 properties:
 *                   lat: { type: number }
 *                   lon: { type: number }
 *     responses:
 *       201:
 *         description: Создано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/Equipment' }
 *       403:
 *         description: Недостаточно прав
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: serialNumber уже занят
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       422:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate({ body: createEquipmentSchema }),
  equipmentController.create,
);

/**
 * @openapi
 * /equipment/{id}:
 *   patch:
 *     tags: [Equipment]
 *     summary: Частичное обновление оборудования
 *     description: Только admin.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               type: { type: string, enum: [turbine, inverter, sensor, substation] }
 *               status: { type: string, enum: [operational, maintenance, fault, decommissioned] }
 *     responses:
 *       200:
 *         description: Обновлено
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Не найдено
 *       422:
 *         description: Ошибка валидации
 */
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: idParamSchema, body: updateEquipmentSchema }),
  equipmentController.update,
);

/**
 * @openapi
 * /equipment/{id}:
 *   delete:
 *     tags: [Equipment]
 *     summary: Удаление оборудования
 *     description: Только admin. Запрещено при наличии незакрытых заявок (409).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Удалено
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Не найдено
 *       409:
 *         description: Есть связанные заявки
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: idParamSchema }),
  equipmentController.remove,
);

export default router;