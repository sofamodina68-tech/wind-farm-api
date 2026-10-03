import { test, expect, describe, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { Site } from '../../models/index.js';
import { truncateAll } from '../helpers/db.js';

const app = createApp();

async function registerAndLogin(app, { email, password, role, technicianId }) {
  await request(app)
    .post('/api/auth/register')
    .send({ email, password, role, technicianId });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.data.accessToken;
}

describe('integration: /api/equipment', () => {
  let adminToken;
  let viewerToken;
  const siteId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    // 1. Очищаем таблицы
    await truncateAll();

    // 2. Создаём Site
    await Site.create({
      id: siteId,
      name: 'Test Site',
      code: 'TEST-01',
      region: 'Test Region',
      latitude: 55.75,
      longitude: 37.61,
    });

    // 3. Регистрируем admin и viewer
    adminToken = await registerAndLogin(app, {
      email: 'admin-eq@test.com',
      password: 'admin1234',
      role: 'admin',
    });

    viewerToken = await registerAndLogin(app, {
      email: 'viewer-eq@test.com',
      password: 'viewer1234',
      role: 'viewer',
    });
  });

  test('GET /api/equipment без токена → 401', async () => {
    const res = await request(app).get('/api/equipment');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/equipment с viewer → 200', async () => {
    const res = await request(app)
      .get('/api/equipment')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
  });

  test('POST /api/equipment с viewer → 403', async () => {
    const res = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        name: 'Turbine X',
        type: 'turbine',
        serialNumber: 'SN-VIEWER',
        location: { lat: 55.75, lon: 37.61 },
        installedAt: '2024-01-01T00:00:00.000Z',
      });
    expect(res.statusCode).toBe(403);
  });

  test('POST /api/equipment с admin → 201', async () => {
    const res = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Turbine Admin',
        type: 'turbine',
        serialNumber: 'SN-ADMIN-001',
        location: { lat: 55.75, lon: 37.61 },
        installedAt: '2024-01-01T00:00:00.000Z',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.serialNumber).toBe('SN-ADMIN-001');
  });

  test('POST дубль serialNumber → 409', async () => {
    const body = {
      name: 'Turbine Dup',
      type: 'turbine',
      serialNumber: 'SN-DUP',
      location: { lat: 55.75, lon: 37.61 },
      installedAt: '2024-01-01T00:00:00.000Z',
    };

    const first = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body);
    expect(first.statusCode).toBe(201);

    const res = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body);
    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('POST /api/equipment с невалидным телом → 422', async () => {
    const res = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '' });
    expect(res.statusCode).toBe(422);
  });
});