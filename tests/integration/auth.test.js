import { test, expect, describe, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { truncateAll } from '../helpers/db.js';

const app = createApp();

describe('integration: /api/auth', () => {
  const validUser = {
    email: 'viewer@test.com',
    password: 'password123',
    role: 'viewer',
  };

  beforeEach(async () => {
    await truncateAll();
  });

  test('POST /register → 201, нет passwordHash', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.email).toBe('viewer@test.com');
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  test('POST /register повторно → 409', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('POST /register с пустым телом → 422', async () => {
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.statusCode).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeInstanceOf(Array);
  });

  test('POST /login → 200 + accessToken', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  test('POST /login с неверным паролем → 422', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'wrong' });

    expect(res.statusCode).toBe(422);
    expect(res.body.error.message).toContain('Неверный email или пароль');
  });

  test('POST /login с неизвестным email → 422 (то же сообщение)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unknown@test.com', password: 'password123' });

    expect(res.statusCode).toBe(422);
    expect(res.body.error.message).toContain('Неверный email или пароль');
  });

  test('GET /me без токена → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('GET /me с токеном → 200', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    const token = loginRes.body.data.accessToken;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe(validUser.email);
  });
});