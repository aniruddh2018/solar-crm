import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import db from '../../db/connection';
import { config } from '../../config';
import { assignLead } from '../leads/assignment';

const graphUrl = (path: string) => `https://graph.facebook.com/${config.meta.graphVersion}/${path}`;
const configured = () => Boolean(config.meta.appId && config.meta.appSecret && config.meta.webhookVerifyToken);

function formValue(fields: any[], ...names: string[]) {
  const field = fields.find((item) => names.includes(String(item.name).toLowerCase()));
  return field?.values?.[0] || null;
}

async function importMetaLead(metaLeadId: string, pageId: string) {
  if (await db('leads').where('meta_lead_id', metaLeadId).first()) return;
  const connection = await db('meta_connections').where({ page_id: pageId, enabled: true }).first();
  if (!connection) return;
  const response = await fetch(`${graphUrl(metaLeadId)}?fields=field_data,created_time,form_id,ad_id&access_token=${encodeURIComponent(connection.page_access_token)}`);
  if (!response.ok) throw new Error(`Meta lead retrieval failed (${response.status})`);
  const payload: any = await response.json(); const fields = payload.field_data || [];
  const fullName = formValue(fields, 'full_name');
  const [firstFromFull = 'Meta', ...lastParts] = String(fullName || '').trim().split(/\s+/);
  const first_name = formValue(fields, 'first_name') || firstFromFull;
  const last_name = formValue(fields, 'last_name') || lastParts.join(' ') || 'Lead';
  const phone = formValue(fields, 'phone_number', 'phone') || 'Not provided';
  const data = {
    first_name, last_name, phone, email: formValue(fields, 'email'), address: formValue(fields, 'street_address', 'address'),
    city: formValue(fields, 'city'), state: formValue(fields, 'state'), zip: formValue(fields, 'zip_code', 'postal_code'),
    source: 'social_media', status: 'new', notes: `Imported from Meta Lead Ad. Form: ${payload.form_id || 'unknown'}, Ad: ${payload.ad_id || 'unknown'}`,
    meta_lead_id: metaLeadId, meta_page_id: pageId,
  };
  const companyId = connection.company_id || (await db('user_companies').where('user_id', connection.connected_by).orderBy('is_default', 'desc').first())?.company_id;
  if (!companyId) return;
  await db.transaction(async (trx) => {
    const pipeline = await trx('lead_pipelines').where({ company_id: companyId, is_default: true }).first(); const stage = pipeline ? await trx('lead_pipeline_stages').where('pipeline_id', pipeline.id).orderBy('sort_order').first() : null;
    Object.assign(data, { company_id: companyId, pipeline_id: pipeline?.id, pipeline_stage_id: stage?.id, entry_mode: 'online' }, await assignLead(trx, { companyId, entryMode: 'online', city: data.city, state: data.state, pincode: data.zip }));
    const [lead] = await trx('leads').insert(data).returning('*');
    await trx('lead_activities').insert({ lead_id: lead.id, activity_type: 'meta_import', description: data.notes });
  });
}

export async function metaStatus(_req: Request, res: Response): Promise<void> {
  const connections = await db('meta_connections').select('id', 'page_id', 'page_name', 'enabled', 'created_at');
  res.json({ configured: configured(), redirectUri: config.meta.redirectUri, webhookUrl: `${config.publicApiUrl}/api/v1/meta/webhook`, connections });
}

export function beginMetaConnect(req: Request, res: Response): void {
  if (!configured()) { res.status(400).json({ error: 'Meta credentials are not configured on this server' }); return; }
  const state = jwt.sign({ userId: req.user!.id }, config.jwt.accessSecret, { expiresIn: '10m' });
  const scopes = 'pages_show_list,pages_read_engagement,pages_manage_metadata,leads_retrieval,pages_manage_ads,ads_management';
  res.json({ url: `https://www.facebook.com/${config.meta.graphVersion}/dialog/oauth?client_id=${encodeURIComponent(config.meta.appId)}&redirect_uri=${encodeURIComponent(config.meta.redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scopes)}` });
}

export async function metaCallback(req: Request, res: Response): Promise<void> {
  try {
    const decoded: any = jwt.verify(String(req.query.state || ''), config.jwt.accessSecret);
    const tokenResponse = await fetch(`${graphUrl('oauth/access_token')}?client_id=${encodeURIComponent(config.meta.appId)}&client_secret=${encodeURIComponent(config.meta.appSecret)}&redirect_uri=${encodeURIComponent(config.meta.redirectUri)}&code=${encodeURIComponent(String(req.query.code || ''))}`);
    const tokenData: any = await tokenResponse.json(); if (!tokenResponse.ok) throw new Error(tokenData.error?.message || 'Token exchange failed');
    const pagesResponse = await fetch(`${graphUrl('me/accounts')}?fields=id,name,access_token&access_token=${encodeURIComponent(tokenData.access_token)}`);
    const pagesData: any = await pagesResponse.json(); if (!pagesResponse.ok) throw new Error(pagesData.error?.message || 'Could not load Meta Pages');
    for (const page of pagesData.data || []) {
      const existing = await db('meta_connections').where('page_id', page.id).first();
      const membership = await db('user_companies').where('user_id', decoded.userId).orderBy('is_default', 'desc').first();
      const data = { connected_by: decoded.userId, company_id: membership?.company_id, page_id: page.id, page_name: page.name, page_access_token: page.access_token, updated_at: db.fn.now() };
      if (existing) await db('meta_connections').where('id', existing.id).update(data); else await db('meta_connections').insert(data);
    }
    res.redirect(`${config.frontendUrl}/dashboard/settings/meta?connected=1`);
  } catch (error: any) { res.redirect(`${config.frontendUrl}/dashboard/settings/meta?error=${encodeURIComponent(error.message || 'Connection failed')}`); }
}

export async function setPageEnabled(req: Request, res: Response): Promise<void> {
  const existing = await db('meta_connections').where('id', req.params.id).first();
  if (!existing) { res.status(404).json({ error: 'Meta Page connection not found' }); return; }
  const enabled = Boolean(req.body.enabled);
  if (enabled) {
    const subscribe = await fetch(`${graphUrl(`${existing.page_id}/subscribed_apps`)}?subscribed_fields=leadgen&access_token=${encodeURIComponent(existing.page_access_token)}`, { method: 'POST' });
    if (!subscribe.ok) { const error: any = await subscribe.json(); res.status(400).json({ error: error.error?.message || 'Meta Page webhook subscription failed' }); return; }
  }
  const [connection] = await db('meta_connections').where('id', req.params.id).update({ enabled, updated_at: db.fn.now() }).returning(['id', 'page_id', 'page_name', 'enabled']);
  res.json({ connection });
}

export function verifyWebhook(req: Request, res: Response): void {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === config.meta.webhookVerifyToken) { res.status(200).send(req.query['hub.challenge']); return; }
  res.sendStatus(403);
}

export async function receiveWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.header('x-hub-signature-256'); const rawBody = (req as any).rawBody as Buffer | undefined;
  if (!signature || !rawBody || !config.meta.appSecret) { res.sendStatus(403); return; }
  const expected = `sha256=${crypto.createHmac('sha256', config.meta.appSecret).update(rawBody).digest('hex')}`;
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) { res.sendStatus(403); return; }
  res.sendStatus(200);
  for (const entry of req.body.entry || []) for (const change of entry.changes || []) if (change.field === 'leadgen' && change.value?.leadgen_id) importMetaLead(String(change.value.leadgen_id), String(change.value.page_id || entry.id)).catch(console.error);
}
