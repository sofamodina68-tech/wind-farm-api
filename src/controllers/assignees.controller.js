import { assigneesService } from '../services/assignees.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const assigneesController = {
  list: asyncHandler(async (req, res) => {
    const assignees = await assigneesService.getAssignees(req.validated.params.id);
    res.json({ data: assignees });
  }),

  assign: asyncHandler(async (req, res) => {
    const assignees = await assigneesService.assignTeam(
      req.validated.params.id,
      req.validated.body.technicians,
    );
    res.status(200).json({ data: assignees });
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await assigneesService.removeAssignee(
      req.validated.params.id,
      req.validated.params.userId,
    );
    res.json({ data: result });
  }),
};