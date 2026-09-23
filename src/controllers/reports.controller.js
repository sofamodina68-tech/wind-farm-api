import { reportsService } from '../services/reports.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const reportsController = {
  siteSummary: asyncHandler(async (req, res) => {
    const summary = await reportsService.getSiteSummary(req.validated.params.id);
    res.json({ data: summary });
  }),

  equipmentLoad: asyncHandler(async (req, res) => {
    const rows = await reportsService.getEquipmentLoad(req.validated.query);
    res.json({ data: rows });
  }),
};