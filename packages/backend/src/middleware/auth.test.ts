import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

vi.mock('../utils/jwt', () => ({ verifyAccessToken: vi.fn() }));

import { verifyAccessToken } from '../utils/jwt';
import { authenticate, authorize } from '../middleware/auth';

function makeReq(overrides: any = {}): Request {
  return { headers: {}, user: undefined, ...overrides } as any;
}
function makeRes(): Response {
  const r: any = {};
  r.status = vi.fn(() => r);
  r.json = vi.fn(() => r);
  return r;
}

describe('authenticate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('401 without authorization header', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn();
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('401 with non-Bearer header', async () => {
    const req = makeReq({ headers: { authorization: 'Basic xyz' } });
    const res = makeRes();
    const next = vi.fn();
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('401 on invalid token', async () => {
    const req = makeReq({ headers: { authorization: 'Bearer bad' } });
    const res = makeRes();
    const next = vi.fn();
    (verifyAccessToken as any).mockImplementation(() => { throw new Error('nope'); });
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('sets req.user and calls next on valid token', async () => {
    const req = makeReq({ headers: { authorization: 'Bearer good' } });
    const res = makeRes();
    const next = vi.fn();
    (verifyAccessToken as any).mockReturnValue({ sub: 'u1', email: 'a@a.com', role: 'admin' });
    await authenticate(req, res, next);
    expect(req.user).toEqual({ id: 'u1', email: 'a@a.com', role: 'admin' });
    expect(next).toHaveBeenCalled();
  });
});

describe('authorize', () => {
  it('401 without user', () => {
    const res = makeRes();
    authorize('admin')(makeReq(), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('403 when role not in allowed list', () => {
    const res = makeRes();
    authorize('admin')(makeReq({ user: { role: 'sales' } }), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('calls next when role is allowed', () => {
    const next = vi.fn();
    authorize('admin', 'sales')(makeReq({ user: { role: 'sales' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});
