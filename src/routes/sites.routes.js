import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller.js';
import { validate } from '../middlewares/validate.js';
import { siteIdParamSchema } from '../validators/assignees.schema.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

/**
 * @openapi
 * /sites/{id}/summary:
 *   get:
 *     tags: [Sites]
 *     summary: Сводка по площадке
 *     description: Возвращает количество заявок по статусам и приоритетам, а также среднее время закрытия.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Сводка
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRequests: { type: integer }
 *                     byStatus:
 *                       type: object
 *                       properties:
 *                         new: { type: integer }
 *                         in_progress: { type: integer }
 *                         done: { type: integer }
 *                         rejected: { type: integer }
 *                     byPriority:
 *                       type: object
 *                       properties:
 *                         low: { type: integer }
 *                         medium: { type: integer }
 *                         high: { type: integer }
 *                         critical: { type: integer }
 *                     avgCloseHours: { type: number, nullable: true }
 *       404:
 *         description: Площадка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:id/summary',
  authenticate,
  validate({ params: siteIdParamSchema }),
  reportsController.siteSummary,
);

export default router;