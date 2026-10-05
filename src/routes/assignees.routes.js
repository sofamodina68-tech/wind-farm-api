import { Router } from 'express';
import { assigneesController } from '../controllers/assignees.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  assignTeamSchema,
  assigneeParamsSchema,
  requestIdParamSchema,
} from '../validators/assignees.schema.js';

const router = Router({ mergeParams: true });

/**
 * @openapi
 * /requests/{id}/assignees:
 *   get:
 *     tags: [Assignees]
 *     summary: Состав бригады по заявке
 *     description: Только admin.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Список назначений с ролями и часами
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       technicianId: { type: string, format: uuid }
 *                       role: { type: string, enum: [lead, member] }
 *                       hours: { type: number }
 *                       technician:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           fullName: { type: string }
 *                           specialization: { type: string }
 *                           employeeNumber: { type: string }
 *       403:
 *         description: Недостаточно прав
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Заявка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/',
  validate({ params: requestIdParamSchema }),
  assigneesController.list,
);

/**
 * @openapi
 * /requests/{id}/assignees:
 *   post:
 *     tags: [Assignees]
 *     summary: Назначение бригады на заявку
 *     description: |
 *       Только admin. Выполняется в транзакции: старые назначения удаляются,
 *       новые добавляются. Требуется ровно один специалист с ролью lead.
 *       Нарушение — 422 и полный откат.
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
 *             required: [assignees]
 *             properties:
 *               assignees:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [technicianId, role, hours]
 *                   properties:
 *                     technicianId: { type: string, format: uuid }
 *                     role: { type: string, enum: [lead, member] }
 *                     hours: { type: number, minimum: 0 }
 *     responses:
 *       200:
 *         description: Бригада назначена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *       403:
 *         description: Недостаточно прав
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Заявка или специалист не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Конфликт (например, повторное назначение)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Нарушено правило «ровно один lead»
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  validate({ params: requestIdParamSchema, body: assignTeamSchema }),
  assigneesController.assign,
);

/**
 * @openapi
 * /requests/{id}/assignees/{userId}:
 *   delete:
 *     tags: [Assignees]
 *     summary: Снятие специалиста с заявки
 *     description: Только admin.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Снят
 *       403:
 *         description: Недостаточно прав
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Назначение не найдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Нельзя снять lead, пока есть member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:userId',
  validate({ params: assigneeParamsSchema }),
  assigneesController.remove,
);

export default router;