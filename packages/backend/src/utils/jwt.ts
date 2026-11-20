import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { AuthTokens, UserPublic } from '../types';

export function generateTokens(user: UserPublic): AuthTokens {
  const payload = { sub: user.id, email: user.email, role: user.role };

  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry as any,
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry as any,
  });

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): { sub: string; email: string; role: string } {
  return jwt.verify(token, config.jwt.accessSecret) as { sub: string; email: string; role: string };
}

export function verifyRefreshToken(token: string): { sub: string; email: string; role: string } {
  return jwt.verify(token, config.jwt.refreshSecret) as { sub: string; email: string; role: string };
}
