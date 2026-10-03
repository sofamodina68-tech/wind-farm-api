import Joi from 'joi';

const passwordSchema = Joi.string()
  .min(8)
  .max(72) // ограничение bcrypt
  .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  .message(
    'Пароль должен содержать минимум 8 символов, включая буквы и цифры',
  );

export const registerSchema = Joi.object({
  email: Joi.string().email().max(254).lowercase().trim().required(),
  password: passwordSchema.required(),
  role: Joi.string().valid('viewer', 'technician', 'admin').default('viewer'),
  technicianId: Joi.string().uuid().allow(null).optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().max(254).lowercase().trim().required(),
  password: Joi.string().required(),
});