import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import process from 'node:process';
import { User, Technician } from '../../models/index.js';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../errors/AppError.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TTL = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
const REFRESH_TTL = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error(
    'JWT_ACCESS_SECRET и JWT_REFRESH_SECRET должны быть заданы в .env',
  );
}

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      technicianId: user.technicianId ?? null,
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL },
  );
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user.id, type: 'refresh' }, REFRESH_SECRET, {
    expiresIn: REFRESH_TTL,
  });
}

function publicUser(user) {
  // User.toJSON уже удаляет passwordHash
  return user.toJSON();
}

export const authService = {
  async register({ email, password, role, technicianId }) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new ConflictError('Пользователь с таким email уже существует');
    }

    if (role === 'technician') {
      if (!technicianId) {
        throw new ValidationError(
          'Для роли technician нужно указать technicianId',
          [{ field: 'technicianId', message: 'Обязательное поле' }],
        );
      }
      const tech = await Technician.findByPk(technicianId);
      if (!tech) {
        throw new NotFoundError('Специалист не найден');
      }
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({
      email,
      passwordHash,
      role: role ?? 'viewer',
      technicianId: role === 'technician' ? technicianId : null,
    });

    return publicUser(user);
  },

  async login({ email, password }) {
    const user = await User.findOne({ where: { email } });

    // Одинаковое сообщение для несуществующего email и неверного пароля.
    const GENERIC = 'Неверный email или пароль';

    if (!user) {
      // Всё равно считаем bcrypt.hash, чтобы не отличать по времени ответа.
      await bcrypt.hash(password, BCRYPT_ROUNDS);
      throw new ValidationError(GENERIC);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new ValidationError(GENERIC);
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return {
      user: publicUser(user),
      accessToken,
      refreshToken,
    };
  },

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw new ValidationError('Отсутствует refresh-токен');
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch {
      throw new ValidationError('Недействительный refresh-токен');
    }

    if (payload.type !== 'refresh') {
      throw new ValidationError('Недействительный refresh-токен');
    }

    const user = await User.findByPk(payload.sub);
    if (!user) {
      throw new ValidationError('Пользователь не найден');
    }

    const accessToken = signAccessToken(user);
    return { accessToken, user: publicUser(user) };
  },

  // logout реализован на уровне контроллера — просто очистка cookie.
};