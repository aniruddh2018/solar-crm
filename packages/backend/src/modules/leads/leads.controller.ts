import { Request, Response } from 'express';
import db from '../../db/connection';
import { assignLead } from './assignment';

export async function listLeads(req: Request, res: Response): Promise<void> {
  let query = db('leads')
    .leftJoin('users as assigned', 'leads.assigned_to', 'assigned.id')
    .leftJoin('users as creator', 'leads.created_by', 'creator.id')
    .where('leads.company_id', req.companyId).select(
      'leads.*',
      'assigned.full_name as assigned_name',
      'creator.full_name as created_by_name'
    );

  if (req.query.status) query = query.where('leads.status', req.query.status);
  if (req.query.assigned_to) query = query.where('leads.assigned_to', req.query.assigned_to);
  if (req.query.source) query = query.where('leads.source', req.query.source);
  if (req.query.search) {
    query = query.where(function () {
      this.where('leads.first_name', 'like', `%${req.query.search}%`)
        .orWhere('leads.last_name', 'like', `%${req.query.search}%`)
        .orWhere('leads.email', 'like', `%${req.query.search}%`)
        .orWhere('leads.phone', 'like', `%${req.query.search}%`);
    });
  }

  const leads = await query.orderBy('leads.created_at', 'desc');
  res.json({ leads });
}

export async function getLead(req: Request, res: Response): Promise<void> {
  const lead = await db('leads')
    .leftJoin('users as assigned', 'leads.assigned_to', 'assigned.id')
    .leftJoin('users as creator', 'leads.created_by', 'creator.id')
    .select(
      'leads.*',
      'assigned.full_name as assigned_name',
      'creator.full_name as created_by_name'
    )
    .where('leads.id', req.params.id).where('leads.company_id', req.companyId)
    .first();

  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }

  const activities = await db('lead_activities')
    .leftJoin('users', 'lead_activities.user_id', 'users.id')
    .select('lead_activities.*', 'users.full_name as user_name')
    .where('lead_activities.lead_id', req.params.id)
    .orderBy('lead_activities.created_at', 'desc');

  res.json({ lead, activities });
}

export async function createLead(req: Request, res: Response): Promise<void> {
  const data = { ...req.body };
  if (data.source === 'field_visit') data.source = 'other';
  if (!data.first_name || !data.last_name || !data.phone) {
    res.status(400).json({ error: 'First name, last name, and phone are required' });
    return;
  }
  const companyId = req.companyId || (await db('companies').where('is_active', true).orderBy('created_at').first())?.id;
  if (!companyId) { res.status(400).json({ error: 'No active company is configured' }); return; }
  data.company_id = companyId; data.created_by = req.user?.id || null;
  data.entry_mode = data.entry_mode || (req.user?.role === 'sales' ? 'offline' : 'online');
  const pipeline = data.pipeline_id ? await db('lead_pipelines').where({ id: data.pipeline_id, company_id: companyId }).first() : await db('lead_pipelines').where({ company_id: companyId, is_default: true }).first();
  if (pipeline) { data.pipeline_id = pipeline.id; const stage = data.pipeline_stage_id ? await db('lead_pipeline_stages').where({ id: data.pipeline_stage_id, pipeline_id: pipeline.id }).first() : await db('lead_pipeline_stages').where('pipeline_id', pipeline.id).orderBy('sort_order').first(); if (stage) { data.pipeline_stage_id = stage.id; data.status = stage.is_won ? 'won' : stage.is_lost ? 'lost' : 'new'; } }
  const result = await db.transaction(async (trx) => {
    Object.assign(data, await assignLead(trx, { companyId, creator: req.user, requestedAssignee: data.assigned_to, entryMode: data.entry_mode, city: data.city, state: data.state, pincode: data.zip }));
    const [lead] = await trx('leads').insert(data).returning('*');
    if (data.notes) await trx('lead_activities').insert({ lead_id: lead.id, user_id: req.user?.id || null, activity_type: 'note', description: data.notes });
    return { lead };
  });
  res.status(201).json(result);
}

export async function updateLead(req: Request, res: Response): Promise<void> {
  const [lead] = await db('leads').where({ id: req.params.id, company_id: req.companyId }).update({
    ...req.body,
    updated_at: db.fn.now(),
  }).returning('*');

  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }
  res.json({ lead });
}

export async function updateLeadStatus(req: Request, res: Response): Promise<void> {
  const { status, pipeline_stage_id } = req.body;
  const lead = await db('leads').where({ id: req.params.id, company_id: req.companyId }).first();
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }

  const stage = pipeline_stage_id ? await db('lead_pipeline_stages').where({ id: pipeline_stage_id, pipeline_id: lead.pipeline_id }).first() : null;
  if (pipeline_stage_id && !stage) { res.status(400).json({ error: 'Stage does not belong to this lead pipeline' }); return; }
  const nextStatus = stage ? (stage.is_won ? 'won' : stage.is_lost ? 'lost' : stage.key === 'qualified' ? 'qualified' : stage.key === 'quotation' ? 'proposal' : lead.status) : status;
  const [updated] = await db('leads').where('id', req.params.id).update({
    status: nextStatus, ...(stage ? { pipeline_stage_id: stage.id } : {}),
    updated_at: db.fn.now(),
  }).returning('*');

  await db('lead_activities').insert({
    lead_id: lead.id,
    user_id: req.user!.id,
    activity_type: 'status_change',
    description: stage ? `Pipeline moved to ${stage.name}` : `Status changed from ${lead.status} to ${nextStatus}`,
  });

  // Leads remain contacts. A customer record is created only when the lead reaches a won stage.
  if (nextStatus === 'won') {
    const existingCustomer = await db('customers').where({ lead_id: lead.id, company_id: req.companyId }).first();
    if (!existingCustomer) await db('customers').insert({ company_id: req.companyId, lead_id: lead.id, first_name: lead.first_name, last_name: lead.last_name, email: lead.email, phone: lead.phone, address: lead.address || 'Address to be confirmed', city: lead.city, state: lead.state, zip: lead.zip });
  }

  res.json({ lead: updated });
}

export async function addActivity(req: Request, res: Response): Promise<void> {
  const lead = await db('leads').where({ id: req.params.id, company_id: req.companyId }).first();
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }

  const [activity] = await db('lead_activities').insert({
    lead_id: lead.id,
    user_id: req.user!.id,
    activity_type: req.body.activity_type || 'note',
    description: req.body.description,
  }).returning('*');

  res.status(201).json({ activity });
}

export async function convertLead(req: Request, res: Response): Promise<void> {
  const lead = await db('leads').where({ id: req.params.id, company_id: req.companyId }).first();
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }

  // A customer profile is created with the lead. Older records are backfilled here.
  let customer = await db('customers').where({ lead_id: lead.id, company_id: req.companyId }).first();
  if (!customer) {
    [customer] = await db('customers').insert({ company_id: req.companyId, lead_id: lead.id, first_name: lead.first_name, last_name: lead.last_name, email: lead.email, phone: lead.phone, address: lead.address || req.body.address || 'Address to be confirmed', city: lead.city, state: lead.state, zip: lead.zip }).returning('*');
  }

  // Create project
  const [project] = await db('projects').insert({
    company_id: req.companyId, customer_id: customer.id,
    lead_id: lead.id,
    name: req.body.project_name || `${lead.first_name} ${lead.last_name} Solar Installation`,
    system_size_kw: lead.estimated_system_size_kw,
    contract_value: lead.estimated_value,
    notes: lead.notes,
  }).returning('*');

  // Add default milestones
  const milestones = [
    { title: 'Contract Signed', sort_order: 0 },
    { title: 'Site Survey', sort_order: 1 },
    { title: 'Permit Submitted', sort_order: 2 },
    { title: 'Permit Approved', sort_order: 3 },
    { title: 'Equipment Ordered', sort_order: 4 },
    { title: 'Installation Scheduled', sort_order: 5 },
    { title: 'Installation Complete', sort_order: 6 },
    { title: 'Inspection Passed', sort_order: 7 },
    { title: 'Utility Approval (PTO)', sort_order: 8 },
  ];

  await db('project_milestones').insert(
    milestones.map((m) => ({ ...m, project_id: project.id }))
  );

  // Mark lead as won
  await db('leads').where('id', lead.id).update({
    status: 'won',
    updated_at: db.fn.now(),
  });

  res.status(201).json({ customer, project });
}
