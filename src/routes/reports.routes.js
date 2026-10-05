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

/**
 * @openapi
 * /reports/equipment-load:
 *   get:
 *     tags: [Reports]
 *     summary: Нагрузка на оборудование (raw SQL)
 *     description: |
 *       Возвращает по каждой единице оборудования: число заявок, число закрытых,
 *       суммарные плановые трудозатраты и дату последнего обслуживания.
 *       Поддерживает фильтрацию по периоду и минимальному числу заявок.
 *       Доступно только admin.
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: minRequests
 *         schema: { type: integer, minimum: 0, default: 0 }
 *     responses:
 *       200:
 *         description: Отчёт
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
 *                       equipmentId: { type: string, format: uuid }
 *                       equipmentName: { type: string }
 *                       totalRequests: { type: integer }
 *                       closedRequests: { type: integer }
 *                       totalPlannedHours: { type: number }
 *                       lastInspectionDate: { type: string, format: date, nullable: true }
 *       403:
 *         description: Недостаточно прав (нужен admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/equipment-load',
  authenticate,
  authorize('admin'),
  validate({ query: equipmentLoadQuerySchema }),
  reportsController.equipmentLoad,
);

export default router;