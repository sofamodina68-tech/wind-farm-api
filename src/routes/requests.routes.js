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

/**
 * @openapi
 * /requests:
 *   get:
 *     tags: [Requests]
 *     summary: Список заявок
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [new, in_progress, done, rejected] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high, critical] }
 *       - in: query
 *         name: equipmentId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Список заявок
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
  validate({ query: listRequestsQuerySchema }),
  requestsController.list,
);

/**
 * @openapi
 * /requests/{id}:
 *   get:
 *     tags: [Requests]
 *     summary: Карточка заявки
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Карточка заявки
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/MaintenanceRequest' }
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
  requestsController.getById,
);

/**
 * @openapi
 * /requests/{id}/history:
 *   get:
 *     tags: [Requests]
 *     summary: История изменения статусов заявки
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Список записей журнала
 *       404:
 *         description: Заявка не найдена
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get(
  '/:id/history',
  authenticate,
  validate({ params: idParamSchema }),
  requestsController.history,
);

/**
 * @openapi
 * /requests:
 *   post:
 *     tags: [Requests]
 *     summary: Создание заявки
 *     description: Доступно technician и admin.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [equipmentId, title]
 *             properties:
 *               equipmentId: { type: string, format: uuid }
 *               title: { type: string, minLength: 5, maxLength: 120 }
 *               description: { type: string, maxLength: 2000 }
 *               priority: { type: string, enum: [low, medium, high, critical], default: medium }
 *               plannedAt: { type: string, format: date-time, nullable: true }
 *     responses:
 *       201:
 *         description: Создано
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Оборудование не найдено
 *       422:
 *         description: Ошибка валидации
 */
router.post(
  '/',
  authenticate,
  authorize('technician', 'admin'),
  validate({ body: createRequestSchema }),
  requestsController.create,
);

/**
 * @openapi
 * /requests/{id}:
 *   patch:
 *     tags: [Requests]
 *     summary: Редактирование полей заявки
 *     description: Доступно technician и admin.
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
 *               title: { type: string }
 *               description: { type: string }
 *               priority: { type: string, enum: [low, medium, high, critical] }
 *               plannedAt: { type: string, format: date-time, nullable: true }
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
  authorize('technician', 'admin'),
  validate({ params: idParamSchema, body: updateRequestSchema }),
  requestsController.update,
);

/**
 * @openapi
 * /requests/{id}/status:
 *   patch:
 *     tags: [Requests]
 *     summary: Смена статуса заявки
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [in_progress, done, rejected] }
 *               comment: { type: string }
 *     responses:
 *       200:
 *         description: Статус изменён
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Не найдено
 *       409:
 *         description: Недопустимый переход или нет бригады
 *       422:
 *         description: Ошибка валидации
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('technician', 'admin'),
  validate({ params: idParamSchema, body: changeStatusSchema }),
  requestsController.changeStatus,
);

/**
 * @openapi
 * /requests/{id}:
 *   delete:
 *     tags: [Requests]
 *     summary: Удаление заявки
 *     description: Только admin.
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
 */
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