import Joi from 'joi';

const locationSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lon: Joi.number().min(-180).max(180).required(),
});

export const createEquipmentSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  type: Joi.string().valid('turbine', 'inverter', 'sensor', 'substation').required(),
  serialNumber: Joi.string().min(1).required(),
  location: locationSchema.required(),
  status: Joi.string().valid('operational', 'maintenance', 'fault', 'decommissioned'),
  installedAt: Joi.date().iso().max('now').required(),
});

export const updateEquipmentSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  type: Joi.string().valid('turbine', 'inverter', 'sensor', 'substation'),
  serialNumber: Joi.string().min(1),
  location: locationSchema,
  status: Joi.string().valid('operational', 'maintenance', 'fault', 'decommissioned'),
  installedAt: Joi.date().iso().max('now'),
}).min(1);

export const listEquipmentQuerySchema = Joi.object({
  status: Joi.string().valid('operational', 'maintenance', 'fault', 'decommissioned'),
  type: Joi.string().valid('turbine', 'inverter', 'sensor', 'substation'),
  sort: Joi.string().valid('name', 'installedAt', 'status').default('name'),
  order: Joi.string().valid('asc', 'desc').default('asc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

export const weatherQuerySchema = Joi.object({
  hours: Joi.number().integer().min(1).max(72).default(24),
});