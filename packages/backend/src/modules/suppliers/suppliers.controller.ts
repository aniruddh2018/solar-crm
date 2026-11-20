import { Request, Response } from 'express'; import db from '../../db/connection';
export async function listSuppliers(req: Request, res: Response) { res.json({ suppliers: await db('suppliers').where('company_id', req.companyId).orderBy('name') }); }
export async function createSupplier(req: Request, res: Response) { if (!req.body.name) { res.status(400).json({ error: 'Supplier name is required' }); return; } const [supplier] = await db('suppliers').insert({ ...req.body, company_id: req.companyId }).returning('*'); res.status(201).json({ supplier }); }
