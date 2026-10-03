import { test, expect, describe } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authenticate, authorize } from '../../../src/middlewares/auth.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('middleware/authenticate', () => {
  test('нет Authorization → 401', () => {
    const req = { headers: {}, id: 'test-id' };
    const res = mockRes();
    let nextCalled = false;
    authenticate(req, res, () => {
      nextCalled = true;
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(nextCalled).toBe(false);
  });

  test('некорректный заголовок (не Bearer) → 401', () => {
    const req = { headers: { authorization: 'Basic abc' }, id: 'test-id' };
    const res = mockRes();
    authenticate(req, res, () => {});
    expect(res.statusCode).toBe(401);
  });

  test('просроченный токен → 401', () => {
    const token = jwt.sign(
      { sub: 'u1', email: 'a@b.c', role: 'viewer' },
      ACCESS_SECRET,
      { expiresIn: '-1s' },
    );
    const req = {
      headers: { authorization: `Bearer ${token}` },
      id: 'test-id',
    };
    const res = mockRes();
    authenticate(req, res, () => {});
    expect(res.statusCode).toBe(401);
  });

  test('валидный токен → next и req.user', () => {
    const token = jwt.sign(
      { sub: 'u1', email: 'a@b.c', role: 'admin', technicianId: null },
      ACCESS_SECRET,
      { expiresIn: '1h' },
    );
    const req = {
      headers: { authorization: `Bearer ${token}` },
      id: 'test-id',
    };
    const res = mockRes();
    let nextCalled = false;
    authenticate(req, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
    expect(req.user).toEqual({
      id: 'u1',
      email: 'a@b.c',
      role: 'admin',
      technicianId: null,
    });
  });
});

describe('middleware/authorize', () => {
  test('нет req.user → 401', () => {
    const req = { id: 'test-id' };
    const res = mockRes();
    authorize('admin')(req, res, () => {});
    expect(res.statusCode).toBe(401);
  });

  test('роль не в списке → 403', () => {
    const req = { user: { role: 'viewer' }, id: 'test-id' };
    const res = mockRes();
    authorize('admin')(req, res, () => {});
    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('роль в списке → next', () => {
    const req = { user: { role: 'admin' }, id: 'test-id' };
    const res = mockRes();
    let nextCalled = false;
    authorize('admin', 'technician')(req, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
  });
});