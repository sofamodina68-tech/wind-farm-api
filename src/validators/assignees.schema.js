import Joi from 'joi';
import { ASSIGNEE_ROLES } from '../domain/assignees.js';

const technicianEntrySchema = Joi.object({
  technicianId: Joi.string().uuid().required(),
  role: Joi.string()
    .valid(...ASSIGNEE_ROLES)
    .required(),
  hours: Joi.number().min(0).max(1000).precision(2).required(),
});

export const assignTeamSchema = Joi.object({
  technicians: Joi.array()
    .items(technicianEntrySchema)
    .min(1)
    .max(20)
    .required(),
});

export const assigneeParamsSchema = Joi.object({
  id: Joi.string().uuid().required(),
  userId: Joi.string().uuid().required(),
});

export const requestIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

export const siteIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});