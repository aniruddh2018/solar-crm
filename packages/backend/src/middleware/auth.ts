import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import db from '../db/connection';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      companyId?: string;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  const token = header.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    const requestedCompany = String(req.headers['x-company-id'] || '');
    const membership = await db('user_companies').where('user_id', payload.sub).modify((query) => { if (requestedCompany) query.where('company_id', requestedCompany); }).orderBy('is_default', 'desc').first();
    if (requestedCompany && !membership) { res.status(403).json({ error: 'You do not have access to this company' }); return; }
    req.companyId = membership?.company_id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { next(); return; }
  try {
    const payload = verifyAccessToken(header.split(' ')[1]);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    const requestedCompany = String(req.headers['x-company-id'] || '');
    const membership = await db('user_companies').where('user_id', payload.sub).modify((query) => { if (requestedCompany) query.where('company_id', requestedCompany); }).orderBy('is_default', 'desc').first();
    req.companyId = membership?.company_id;
  } catch { /* Public lead capture continues without identity. */ }
  next();
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export async function checkCustomerOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user || req.user.role !== 'customer') {
    next();
    return;
  }

  const customer = await db('customers').where('user_id', req.user.id).first();
  if (!customer) {
    res.status(403).json({ error: 'No customer profile found' });
    return;
  }

  (req as any).customerId = customer.id;
  next();
}
