import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../../db/connection';
import { excludePassword } from '../../utils/helpers';

export async function listUsers(req: Request, res: Response): Promise<void> {
  const users = await db('users').join('user_companies', 'users.id', 'user_companies.user_id').where('user_companies.company_id', req.companyId).select('users.*').orderBy('users.created_at', 'desc');
  res.json({ users: users.map(excludePassword) });
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const user = await db('users').where('id', req.params.id).first();
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: excludePassword(user) });
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const { email, password, full_name, phone, role, salesperson_code, base_state, base_city, base_pincode } = req.body;

  const existing = await db('users').where('email', email).first();
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = await db.transaction(async (trx) => { const [created] = await trx('users').insert({ email, password_hash, full_name, phone, role, salesperson_code, base_state, base_city, base_pincode }).returning('*'); if (req.companyId) await trx('user_companies').insert({ user_id: created.id, company_id: req.companyId, is_default: true }); return created; });

  res.status(201).json({ user: excludePassword(user) });
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const { email, full_name, phone, role, is_active, password } = req.body;
  const updates: any = {};
  if (email) updates.email = email;
  if (full_name) updates.full_name = full_name;
  if (phone !== undefined) updates.phone = phone;
  if (role) updates.role = role;
  if (is_active !== undefined) updates.is_active = is_active;
  if (password) updates.password_hash = await bcrypt.hash(password, 10);
  updates.updated_at = db.fn.now();

  const [user] = await db('users').where('id', req.params.id).update(updates).returning('*');
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: excludePassword(user) });
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  await db('users').where('id', req.params.id).update({ is_active: false, updated_at: db.fn.now() });
  res.json({ message: 'User deactivated' });
}
