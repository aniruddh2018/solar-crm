import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import db from '../../db/connection';

const round = (value: number) => Math.round(value * 100) / 100;

async function calculateBreakup(total: number) {
  const settings = await db('gst_settings').where('id', 1).first();
  const materialShare = Number(settings.material_share) / 100;
  const labourShare = Number(settings.labour_share) / 100;
  const materialRate = Number(settings.material_gst_rate) / 100;
  const labourRate = Number(settings.labour_gst_rate) / 100;
  const base = total / (materialShare * (1 + materialRate) + labourShare * (1 + labourRate));
  const materialBase = round(base * materialShare);
  const labourBase = round(base - materialBase);
  return { material_base_amount: materialBase, material_gst_amount: round(materialBase * materialRate), labour_base_amount: labourBase, labour_gst_amount: round(labourBase * labourRate) };
}

export async function listProposals(req: Request, res: Response): Promise<void> {
  const query = db('proposals').leftJoin('customers', 'proposals.customer_id', 'customers.id').where('customers.company_id', req.companyId).select('proposals.*', db.raw("customers.first_name || ' ' || customers.last_name as customer_name"));
  if (req.query.project_id) query.where('proposals.project_id', req.query.project_id);
  res.json({ proposals: await query.orderBy('proposals.created_at', 'desc') });
}

export async function getProposalSettings(_req: Request, res: Response): Promise<void> { res.json({ settings: await db('proposal_settings').where('id', 1).first() }); }
export async function updateProposalSettings(req: Request, res: Response): Promise<void> { const allowed = ['base_price_per_kw', 'minimum_price', 'validity_days', 'default_scope']; const data = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key))); const [settings] = await db('proposal_settings').where('id', 1).update({ ...data, updated_at: db.fn.now() }).returning('*'); res.json({ settings }); }
export async function quoteSuggestion(req: Request, res: Response): Promise<void> { const settings = await db('proposal_settings').where('id', 1).first(); const size = Number(req.query.system_size_kw || 0); const price = Math.max(Number(settings.minimum_price), size * Number(settings.base_price_per_kw)); res.json({ suggested_price: price, default_scope: settings.default_scope, validity_days: settings.validity_days }); }

export async function getProposal(req: Request, res: Response): Promise<void> {
  const proposal = await db('proposals').leftJoin('customers', 'proposals.customer_id', 'customers.id').leftJoin('projects', 'proposals.project_id', 'projects.id').select('proposals.*', db.raw("customers.first_name || ' ' || customers.last_name as customer_name"), 'customers.address as customer_address', 'projects.name as project_name').where('proposals.id', req.params.id).where('customers.company_id', req.companyId).first();
  if (!proposal) { res.status(404).json({ error: 'Proposal not found' }); return; }
  res.json({ proposal });
}

export async function createProposal(req: Request, res: Response): Promise<void> {
  const project = await db('projects').where({ id: req.body.project_id, company_id: req.companyId }).first();
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
  const count = await db('proposals').count('* as count').first() as any;
  const proposal_number = `QTN-${new Date().getFullYear()}-${String(Number(count.count) + 1).padStart(4, '0')}`;
  const proposalSettings = await db('proposal_settings').where('id', 1).first();
  const companyPreferences = await db('company_preferences').where('company_id', req.companyId).first();
  const plantPrice = Number(req.body.plant_price || Math.max(Number(proposalSettings.minimum_price), Number(req.body.system_size_kw || project.system_size_kw || 0) * Number(proposalSettings.base_price_per_kw)));
  if (!Number.isFinite(plantPrice) || plantPrice <= 0) { res.status(400).json({ error: 'A positive plant price is required' }); return; }
  const gst_enabled = req.body.gst_enabled !== false;
  const [proposal] = await db('proposals').insert({
    ...req.body, proposal_number, customer_id: project.customer_id, plant_price: plantPrice, gst_enabled,
    valid_until: req.body.valid_until || new Date(Date.now() + Number(companyPreferences?.quotation_validity_days ?? proposalSettings.validity_days) * 86400000).toISOString().slice(0, 10), scope_of_work: req.body.scope_of_work || proposalSettings.default_scope, ...(gst_enabled ? await calculateBreakup(plantPrice) : {}), created_by: req.user!.id,
  }).returning('*');
  res.status(201).json({ proposal });
}

export async function updateProposalStatus(req: Request, res: Response): Promise<void> {
  const [proposal] = await db('proposals').where('id', req.params.id).update({ status: req.body.status, updated_at: db.fn.now() }).returning('*');
  if (!proposal) { res.status(404).json({ error: 'Proposal not found' }); return; }
  res.json({ proposal });
}

export async function proposalPdf(req: Request, res: Response): Promise<void> {
  const proposal = await db('proposals').leftJoin('customers', 'proposals.customer_id', 'customers.id').leftJoin('projects', 'proposals.project_id', 'projects.id').select('proposals.*', db.raw("customers.first_name || ' ' || customers.last_name as customer_name"), 'customers.address as customer_address', 'projects.name as project_name').where('proposals.id', req.params.id).where('customers.company_id', req.companyId).first();
  if (!proposal) { res.status(404).json({ error: 'Proposal not found' }); return; }
  const company = await db('companies').where('id', req.companyId).first();
  const preferences = await db('company_preferences').where('company_id', req.companyId).first() || {};
  const accent = /^#[0-9a-f]{6}$/i.test(preferences.quotation_accent_color || '') ? preferences.quotation_accent_color : '#d97706';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=${proposal.proposal_number}.pdf`);
  const pdf = new PDFDocument({ margin: 48 }); pdf.pipe(res);
  pdf.rect(48, 48, 499, 5).fill(accent); pdf.moveDown(0.5).fontSize(22).fillColor(accent).text(company?.legal_name || company?.name || 'SolarCRM', { continued: true }).fillColor('#111827').text(`  |  ${preferences.quotation_title || 'SOLAR PROPOSAL'}`);
  pdf.moveDown().fontSize(11).fillColor('#374151').text(`Proposal: ${proposal.proposal_number}`).text(`Date: ${new Date(proposal.created_at).toLocaleDateString('en-IN')}`).text(`Valid until: ${proposal.valid_until || 'Not specified'}`);
  pdf.moveDown().fontSize(14).fillColor('#111827').text('Prepared for'); pdf.fontSize(11).text(proposal.customer_name).text(proposal.customer_address || 'Address to be confirmed');
  pdf.moveDown().fontSize(14).text(proposal.title); pdf.fontSize(11).text(`Project: ${proposal.project_name}`).text(`System size: ${proposal.system_size_kw || 'TBD'} kW`);
  if (proposal.scope_of_work) { pdf.moveDown().fontSize(12).text('Scope of work').fontSize(10).text(proposal.scope_of_work); }
  pdf.moveDown().fontSize(14).text('Investment summary'); pdf.fontSize(11);
  if (proposal.gst_enabled) { pdf.text(`Material base: ₹${Number(proposal.material_base_amount).toLocaleString('en-IN')}`).text(`GST on material: ₹${Number(proposal.material_gst_amount).toLocaleString('en-IN')}`).text(`Labour base: ₹${Number(proposal.labour_base_amount).toLocaleString('en-IN')}`).text(`GST on labour: ₹${Number(proposal.labour_gst_amount).toLocaleString('en-IN')}`); }
  pdf.moveDown(0.5).fontSize(16).fillColor('#111827').text(`Total proposal value: ₹${Number(proposal.plant_price).toLocaleString('en-IN')}`);
  pdf.moveDown(2).fontSize(10).fillColor('#6b7280').text(preferences.quotation_footer || 'This proposal is subject to final site assessment and applicable tax rules.'); pdf.end();
}
