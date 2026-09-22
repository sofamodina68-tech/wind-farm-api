import { requestsService } from '../services/requests.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requestsController = {
  list: asyncHandler(async (req, res) => {
    const result = await requestsService.list(req.query);
    res.json({
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const request = await requestsService.getById(req.params.id);
    res.json({ data: request });
  }),

  create: asyncHandler(async (req, res) => {
    const request = await requestsService.create(req.body);
    res
      .status(201)
      .location(`/api/requests/${request.id}`)
      .json({ data: request });
  }),

  update: asyncHandler(async (req, res) => {
    const request = await requestsService.update(req.params.id, req.body);
    res.json({ data: request });
  }),

  changeStatus: asyncHandler(async (req, res) => {
    const request = await requestsService.changeStatus(
      req.params.id,
      req.body.status,
    );
    res.json({ data: request });
  }),

  remove: asyncHandler(async (req, res) => {
    await requestsService.remove(req.params.id);
    res.status(204).end();
  }),
};