import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../../db/connection';
import { generateTokens, verifyRefreshToken } from '../../utils/jwt';
import { excludePassword } from '../../utils/helpers';

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, full_name, phone } = req.body;

  const existing = await db('users').where('email', email).first();
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const [user] = await db('users')
    .insert({ email, password_hash, full_name, phone, role: 'customer' })
    .returning('*');

  const tokens = generateTokens(user);
  await db('users').where('id', user.id).update({ refresh_token: tokens.refreshToken });

  res.status(201).json({ user: excludePassword(user), ...tokens });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await db('users').where({ email, is_active: true }).first();
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const tokens = generateTokens(user);
  await db('users').where('id', user.id).update({ refresh_token: tokens.refreshToken });

  res.json({ user: excludePassword(user), ...tokens });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await db('users').where({ id: payload.sub, refresh_token: refreshToken, is_active: true }).first();
    if (!user) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const tokens = generateTokens(user);
    await db('users').where('id', user.id).update({ refresh_token: tokens.refreshToken });

    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.user) {
    await db('users').where('id', req.user.id).update({ refresh_token: null });
  }
  res.json({ message: 'Logged out' });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await db('users').where('id', req.user!.id).first();
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: excludePassword(user) });
}
