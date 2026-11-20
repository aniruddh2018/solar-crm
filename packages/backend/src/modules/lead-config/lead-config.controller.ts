import { Request, Response } from 'express';
import db from '../../db/connection';
import { assignLead } from '../leads/assignment';

export async function getConfig(req: Request, res: Response) {
  const pipelines = await db('lead_pipelines').where({ company_id: req.companyId, is_active: true }).orderBy('created_at');
  const stages = pipelines.length ? await db('lead_pipeline_stages').whereIn('pipeline_id', pipelines.map((p: any) => p.id)).orderBy(['pipeline_id', 'sort_order']) : [];
  const salespeople = await db('users').join('user_companies', 'users.id', 'user_companies.user_id').where({ 'user_companies.company_id': req.companyId, 'users.role': 'sales', 'users.is_active': true }).select('users.id', 'users.full_name', 'users.email', 'users.salesperson_code', 'users.base_state', 'users.base_city', 'users.base_pincode', 'users.is_available_for_leads');
  const territories = await db('salesperson_territories').where({ company_id: req.companyId, is_active: true });
  const assignment = await db('lead_assignment_settings').where('company_id', req.companyId).first();
  res.json({ pipelines: pipelines.map((pipeline: any) => ({ ...pipeline, stages: stages.filter((stage: any) => stage.pipeline_id === pipeline.id) })), salespeople: salespeople.map((person: any) => ({ ...person, territories: territories.filter((territory: any) => territory.user_id === person.id) })), assignment });
}

export async function createPipeline(req: Request, res: Response) {
  if (!req.body.name) { res.status(400).json({ error: 'Pipeline name is required' }); return; }
  const result = await db.transaction(async (trx) => {
    if (req.body.is_default) await trx('lead_pipelines').where('company_id', req.companyId).update({ is_default: false });
    const [pipeline] = await trx('lead_pipelines').insert({ company_id: req.companyId, name: req.body.name, description: req.body.description, is_default: Boolean(req.body.is_default) }).returning('*');
    const supplied = Array.isArray(req.body.stages) && req.body.stages.length ? req.body.stages : ['New', 'Contacted', 'Qualified', 'Quotation', 'Won', 'Lost'].map((name) => ({ name }));
    const stages = supplied.map((stage: any, index: number) => ({ pipeline_id: pipeline.id, name: stage.name, key: String(stage.key || stage.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'), color: stage.color || 'blue', sort_order: index, is_won: Boolean(stage.is_won || String(stage.name).toLowerCase() === 'won'), is_lost: Boolean(stage.is_lost || String(stage.name).toLowerCase() === 'lost') }));
    await trx('lead_pipeline_stages').insert(stages); return pipeline;
  });
  res.status(201).json({ pipeline: result });
}

export async function addStage(req: Request, res: Response) {
  const pipeline = await db('lead_pipelines').where({ id: req.params.id, company_id: req.companyId }).first(); if (!pipeline) { res.status(404).json({ error: 'Pipeline not found' }); return; }
  const count: any = await db('lead_pipeline_stages').where('pipeline_id', pipeline.id).count('* as count').first();
  const [stage] = await db('lead_pipeline_stages').insert({ pipeline_id: pipeline.id, name: req.body.name, key: String(req.body.key || req.body.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'), color: req.body.color || 'blue', sort_order: Number(count.count), is_won: Boolean(req.body.is_won), is_lost: Boolean(req.body.is_lost) }).returning('*'); res.status(201).json({ stage });
}

export async function updateAssignment(req: Request, res: Response) {
  const method = req.body.online_assignment_method; if (!['manual', 'location', 'round_robin'].includes(method)) { res.status(400).json({ error: 'Invalid assignment method' }); return; }
  const [assignment] = await db('lead_assignment_settings').where('company_id', req.companyId).update({ online_assignment_method: method, updated_at: db.fn.now() }).returning('*'); res.json({ assignment });
}

export async function updateSalesperson(req: Request, res: Response) {
  const linked = await db('user_companies').where({ user_id: req.params.id, company_id: req.companyId }).first(); if (!linked) { res.status(404).json({ error: 'Salesperson not found in this company' }); return; }
  const fields = ['salesperson_code', 'base_state', 'base_city', 'base_pincode', 'is_available_for_leads']; const data = Object.fromEntries(Object.entries(req.body).filter(([key]) => fields.includes(key)));
  const [user] = await db('users').where({ id: req.params.id, role: 'sales' }).update({ ...data, updated_at: db.fn.now() }).returning('*');
  if (Array.isArray(req.body.territories)) { await db('salesperson_territories').where({ company_id: req.companyId, user_id: req.params.id }).del(); const rows = req.body.territories.filter((x: any) => x.state || x.city || x.pincode).map((x: any) => ({ company_id: req.companyId, user_id: req.params.id, state: x.state, city: x.city, pincode: x.pincode })); if (rows.length) await db('salesperson_territories').insert(rows); }
  if (user) delete user.password_hash; if (user) delete user.refresh_token; res.json({ user });
}

export async function createDemoWorkflow(req: Request, res: Response) {
  const pipeline = await db('lead_pipelines').where({ company_id: req.companyId, is_default: true }).first(); const stages = pipeline ? await db('lead_pipeline_stages').where('pipeline_id', pipeline.id).orderBy('sort_order') : [];
  if (!pipeline || !stages.length) { res.status(400).json({ error: 'Create a default pipeline first' }); return; }
  const salesperson = await db('users').join('user_companies', 'users.id', 'user_companies.user_id').where({ 'user_companies.company_id': req.companyId, 'users.role': 'sales', 'users.is_active': true }).select('users.*').first();
  if (!salesperson) { res.status(400).json({ error: 'Create at least one salesperson first' }); return; }
  if (!salesperson.base_state && !salesperson.base_city && !salesperson.base_pincode) {
    await db('users').where('id', salesperson.id).update({ base_state: 'Gujarat', base_city: 'Ahmedabad', base_pincode: '380001', salesperson_code: salesperson.salesperson_code || 'SALE-001' });
    await db('salesperson_territories').insert({ company_id: req.companyId, user_id: salesperson.id, state: 'Gujarat', city: 'Ahmedabad', pincode: '380001' });
    Object.assign(salesperson, { base_state: 'Gujarat', base_city: 'Ahmedabad', base_pincode: '380001' });
  }
  const existing = await db('leads').where({ company_id: req.companyId, notes: '[DEMO] Offline visit workflow' }).first(); if (existing) { res.json({ created: 0, message: 'Demo workflow already exists' }); return; }
  const samples: any[] = [
    { first_name: 'Ramesh', last_name: 'Patel', phone: '9000001001', city: salesperson.base_city || 'Ahmedabad', state: salesperson.base_state || 'Gujarat', zip: salesperson.base_pincode || '380001', entry_mode: 'offline', source: 'other', notes: '[DEMO] Offline visit workflow', assigned_to: salesperson.id, assignment_method: 'self', pipeline_stage_id: stages[Math.min(2, stages.length - 1)].id },
    { first_name: 'Anita', last_name: 'Sharma', phone: '9000001002', city: salesperson.base_city || 'Ahmedabad', state: salesperson.base_state || 'Gujarat', zip: salesperson.base_pincode || '380001', entry_mode: 'online', source: 'website', notes: '[DEMO] Online location assignment', pipeline_stage_id: stages[0].id },
    { first_name: 'Suresh', last_name: 'Kumar', phone: '9000001003', city: 'Surat', state: 'Gujarat', zip: '395003', entry_mode: 'offline', source: 'referral', notes: '[DEMO] Manually assigned referral', assigned_to: salesperson.id, assignment_method: 'manual', pipeline_stage_id: stages[Math.min(4, stages.length - 1)].id },
  ];
  await db.transaction(async (trx) => { for (const sample of samples) { if (!sample.assigned_to) Object.assign(sample, await assignLead(trx, { companyId: req.companyId!, entryMode: sample.entry_mode, city: sample.city, state: sample.state, pincode: sample.zip })); await trx('leads').insert({ ...sample, company_id: req.companyId, pipeline_id: pipeline.id, status: 'new', created_by: req.user!.id, estimated_value: 500000 }); } });
  res.status(201).json({ created: samples.length });
}
