import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';

const router = Router();

/**
 * @openapi
 * /health/live:
 *   get:
 *     tags: [Health]
 *     summary: Проверка жизнеспособности процесса
 *     description: Возвращает 200, если процесс Node.js жив. Не проверяет БД.
 *     security: []
 *     responses:
 *       200:
 *         description: Процесс жив
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
router.get('/live', healthController.live);

/**
 * @openapi
 * /health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Проверка готовности (включая доступность БД)
 *     security: []
 *     responses:
 *       200:
 *         description: Сервис готов
 *       503:
 *         description: БД недоступна
 */
router.get('/ready', healthController.ready);

export default router;