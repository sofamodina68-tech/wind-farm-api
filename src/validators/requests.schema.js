import Joi from 'joi';
import {
  REQUEST_STATUSES,
  REQUEST_PRIORITIES,
} from '../domain/requests.js';

export const createRequestSchema = Joi.object({
  equipmentId: Joi.string().uuid().required(),
  title: Joi.string().min(5).max(120).required(),
  description: Joi.string().max(2000).allow('').optional(),
  priority: Joi.string().valid(...REQUEST_PRIORITIES).required(),
  plannedAt: Joi.date().iso().allow(null).optional(),
});

export const updateRequestSchema = Joi.object({
  title: Joi.string().min(5).max(120),
  description: Joi.string().max(2000).allow(''),
  priority: Joi.string().valid(...REQUEST_PRIORITIES),
  plannedAt: Joi.date().iso().allow(null),
}).min(1);

export const changeStatusSchema = Joi.object({
  status: Joi.string().valid(...REQUEST_STATUSES).required(),
});

export const listRequestsQuerySchema = Joi.object({
  equipmentId: Joi.string().uuid(),
  status: Joi.string().valid(...REQUEST_STATUSES),
  priority: Joi.string().valid(...REQUEST_PRIORITIES),
  createdFrom: Joi.date().iso(),
  createdTo: Joi.date().iso(),
  plannedFrom: Joi.date().iso(),
  plannedTo: Joi.date().iso(),
  sort: Joi.string()
    .valid('createdAt', 'updatedAt', 'plannedAt', 'priority')
    .default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});