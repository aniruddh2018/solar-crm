import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../../db/connection', () => {
  const dbQueue: any[] = [];
  function makeChain(): any {
    const c: any = {
      then: (resolve: any) => {
        const v = dbQueue.shift();
        return Promise.resolve(resolve(v === undefined ? [] : v));
      },
    };
    c.select = c.where = c.whereNotIn = c.whereIn = c.orWhere = c.andWhere = c.leftJoin =
    c.innerJoin = c.orderBy = c.groupBy = c.groupByRaw = c.limit = c.offset = c.insert =
    c.update = c.del = c.first = c.returning = c.count = c.sum = c.orderByRaw =
    c.onDelete = c.distinct = vi.fn(function(this: any, fn: any) {
      if (typeof fn === 'function') fn.call(c);
      return c;
    });
    return c;
  }
  const db = vi.fn(() => makeChain()) as any;
  db.raw = vi.fn((v: string) => v);
  db.fn = { now: () => new Date().toISOString() };
  db.__q = dbQueue;
  return { default: db };
});

vi.mock('../../utils/jwt', () => ({
  generateTokens: vi.fn(() => ({ accessToken: 'at', refreshToken: 'rt' })),
  verifyAccessToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn(), compare: vi.fn() } }));

import db from '../../db/connection';
import { register, login, logout, me } from './auth.controller';
import { generateTokens } from '../../utils/jwt';
import bcrypt from 'bcryptjs';

function req(body: any = {}, user?: any): Request {
  return { body, user, headers: {} } as any;
}
function makeRes(): Response {
  const r: any = {};
  r.status = vi.fn(() => r);
  r.json = vi.fn(() => r);
  return r;
}
function q(...vals: any[]) {
  (db as any).__q.push(...vals);
}

beforeEach(() => {
  vi.clearAllMocks();
  (db as any).__q.length = 0;
  (generateTokens as any).mockReturnValue({ accessToken: 'at', refreshToken: 'rt' });
});

describe('auth controller', () => {
  describe('register', () => {
    it('returns 409 when email exists', async () => {
      q({ id: 'exists' });
      const rs = makeRes();
      await register(req({ email: 'x@x.com', password: 'pw', full_name: 'X' }), rs);
      expect(rs.status).toHaveBeenCalledWith(409);
    });

    it('returns 201 on success', async () => {
      (bcrypt.hash as any).mockResolvedValue('hashed');
      q(null, [{ id: 'u1', email: 'new@t.com', full_name: 'New', role: 'customer' }], null);
      const rs = makeRes();
      await register(req({ email: 'new@t.com', password: 'Test123!', full_name: 'New' }), rs);
      expect(rs.status).toHaveBeenCalledWith(201);
    });
  });

  describe('login', () => {
    it('returns 401 for unknown user', async () => {
      q(null);
      const rs = makeRes();
      await login(req({ email: 'no@no.com', password: 'pw' }), rs);
      expect(rs.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 for wrong password', async () => {
      q({ id: 'u1', email: 'a@a.com', password_hash: 'hash', is_active: true });
      (bcrypt.compare as any).mockResolvedValue(false);
      const rs = makeRes();
      await login(req({ email: 'a@a.com', password: 'wrong' }), rs);
      expect(rs.status).toHaveBeenCalledWith(401);
    });

    it('returns tokens on success', async () => {
      q({ id: 'u1', email: 'a@a.com', password_hash: 'hash', full_name: 'T', role: 'admin', is_active: true }, null);
      (bcrypt.compare as any).mockResolvedValue(true);
      const rs = makeRes();
      await login(req({ email: 'a@a.com', password: 'correct' }), rs);
      expect((rs.json as any).mock.calls[0][0].accessToken).toBe('at');
    });
  });

  describe('logout', () => {
    it('clears refresh token', async () => {
      q(null);
      const rs = makeRes();
      await logout(req({}, { id: 'u1' }), rs);
      expect(rs.json).toHaveBeenCalledWith({ message: 'Logged out' });
    });
  });

  describe('me', () => {
    it('returns profile without sensitive fields', async () => {
      q({ id: 'u1', email: 'a@a.com', password_hash: 'pw', refresh_token: 'rt', full_name: 'Test', role: 'admin' });
      const rs = makeRes();
      await me(req({}, { id: 'u1' }), rs);
      const body = (rs.json as any).mock.calls[0][0].user;
      expect(body.password_hash).toBeUndefined();
      expect(body.refresh_token).toBeUndefined();
    });

    it('returns 404 when missing', async () => {
      q(null);
      const rs = makeRes();
      await me(req({}, { id: 'gone' }), rs);
      expect(rs.status).toHaveBeenCalledWith(404);
    });
  });
});
