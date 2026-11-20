import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn(), verify: vi.fn() },
}));

import { generateTokens, verifyAccessToken, verifyRefreshToken } from '../utils/jwt';

describe('generateTokens', () => {
  const mockUser = { id: 'user-123', email: 'test@test.com', role: 'admin' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates access + refresh tokens with correct payload', () => {
    (jwt.sign as any).mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

    const result = generateTokens(mockUser);

    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    expect(jwt.sign).toHaveBeenCalledTimes(2);

    const firstCall = (jwt.sign as any).mock.calls[0][0];
    expect(firstCall).toEqual({ sub: 'user-123', email: 'test@test.com', role: 'admin' });
  });
});

describe('verifyAccessToken', () => {
  it('returns decoded payload on success', () => {
    const payload = { sub: 'u1', email: 'a@a.com', role: 'sales' };
    (jwt.verify as any).mockReturnValue(payload);
    expect(verifyAccessToken('valid')).toEqual(payload);
  });

  it('throws on invalid token', () => {
    (jwt.verify as any).mockImplementation(() => { throw new Error('bad'); });
    expect(() => verifyAccessToken('bad')).toThrow('bad');
  });
});

describe('verifyRefreshToken', () => {
  it('verifies and returns payload', () => {
    const payload = { sub: 'u2', email: 'b@b.com', role: 'customer' };
    (jwt.verify as any).mockReturnValue(payload);
    expect(verifyRefreshToken('refresh-token')).toEqual(payload);
  });
});
