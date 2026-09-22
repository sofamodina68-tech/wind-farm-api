import { Router } from 'express';
import { requestsController } from '../controllers/requests.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  createRequestSchema,
  updateRequestSchema,
  changeStatusSchema,
  listRequestsQuerySchema,
  idParamSchema,
} from '../validators/requests.schema.js';

const router = Router();

router.get(
  '/',
  validate({ query: listRequestsQuerySchema }),
  requestsController.list,
);
router.post(
  '/',
  validate({ body: createRequestSchema }),
  requestsController.create,
);
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  requestsController.getById,
);
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateRequestSchema }),
  requestsController.update,
);
router.patch(
  '/:id/status',
  validate({ params: idParamSchema, body: changeStatusSchema }),
  requestsController.changeStatus,
);
router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  requestsController.remove,
);

export default router;