import { equipmentService } from '../services/equipment.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const equipmentController = {
  list: asyncHandler(async (req, res) => {
    const result = await equipmentService.list(req.query);
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
    const equipment = await equipmentService.getById(req.params.id);
    res.json({ data: equipment });
  }),

  create: asyncHandler(async (req, res) => {
    const equipment = await equipmentService.create(req.body);
    res
      .status(201)
      .location(`/api/equipment/${equipment.id}`)
      .json({ data: equipment });
  }),

  update: asyncHandler(async (req, res) => {
    const equipment = await equipmentService.update(req.params.id, req.body);
    res.json({ data: equipment });
  }),

  remove: asyncHandler(async (req, res) => {
    await equipmentService.remove(req.params.id);
    res.status(204).end();
  }),

  getRequests: asyncHandler(async (req, res) => {
    const requests = await equipmentService.getRequests(req.params.id);
    res.json({ data: requests });
  }),

  getWeather: asyncHandler(async (req, res) => {
    const forecast = await equipmentService.getWeather(req.params.id);
    res.json({ data: forecast });
  }),
};