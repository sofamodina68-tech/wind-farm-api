import process from 'node:process';
import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const REFRESH_COOKIE = 'refreshToken';

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: process.env.COOKIE_SAME_SITE ?? 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
  path: '/api/auth',
});

export const authController = {
  register: asyncHandler(async (req, res) => {
    const user = await authService.register(req.validated.body);
    res.status(201).json({ data: user });
  }),

  login: asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.login(
      req.validated.body,
    );

    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

    res.json({
      data: {
        user,
        accessToken,
      },
    });
  }),

  refresh: asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    const { accessToken, user } = await authService.refresh(token);
    res.json({ data: { user, accessToken } });
  }),

  logout: asyncHandler(async (req, res) => {
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAME_SITE ?? 'lax',
      path: '/api/auth',
    });
    res.status(204).end();
  }),

  me: asyncHandler(async (req, res) => {
    res.json({ data: req.user });
  }),
};