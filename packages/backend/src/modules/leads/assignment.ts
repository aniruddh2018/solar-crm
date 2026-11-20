import type { Knex } from 'knex';

export async function assignLead(trx: Knex | Knex.Transaction, input: { companyId: string; creator?: any; requestedAssignee?: string | null; entryMode: string; city?: string; state?: string; pincode?: string }) {
  if (input.requestedAssignee) return { assigned_to: input.requestedAssignee, assignment_method: 'manual' };
  if (input.entryMode === 'offline' && input.creator?.role === 'sales') return { assigned_to: input.creator.id, assignment_method: 'self' };
  const setting = await trx('lead_assignment_settings').where('company_id', input.companyId).first();
  const method = setting?.online_assignment_method || 'location';
  const salespeople = await trx('users').join('user_companies', 'users.id', 'user_companies.user_id').where({ 'user_companies.company_id': input.companyId, 'users.role': 'sales', 'users.is_active': true, 'users.is_available_for_leads': true }).select('users.*');
  if (!salespeople.length) return { assigned_to: null, assignment_method: 'unassigned' };
  if (method === 'round_robin') {
    const index = Number(setting?.round_robin_cursor || 0) % salespeople.length;
    await trx('lead_assignment_settings').where('company_id', input.companyId).update({ round_robin_cursor: index + 1, updated_at: trx.fn.now() });
    return { assigned_to: salespeople[index].id, assignment_method: 'round_robin' };
  }
  const ids = salespeople.map((user: any) => user.id);
  const territories = await trx('salesperson_territories').whereIn('user_id', ids).where({ company_id: input.companyId, is_active: true });
  const normalize = (value: any) => String(value || '').trim().toLowerCase();
  const score = (user: any) => {
    const matches = territories.filter((territory: any) => territory.user_id === user.id);
    let best = 0;
    for (const territory of matches) {
      if (territory.pincode && normalize(territory.pincode) === normalize(input.pincode)) best = Math.max(best, 30);
      else if (territory.city && normalize(territory.city) === normalize(input.city) && (!territory.state || normalize(territory.state) === normalize(input.state))) best = Math.max(best, 20);
      else if (territory.state && normalize(territory.state) === normalize(input.state)) best = Math.max(best, 10);
    }
    if (normalize(user.base_pincode) === normalize(input.pincode) && input.pincode) best = Math.max(best, 30);
    else if (normalize(user.base_city) === normalize(input.city) && input.city) best = Math.max(best, 20);
    else if (normalize(user.base_state) === normalize(input.state) && input.state) best = Math.max(best, 10);
    return best;
  };
  const ranked = salespeople.map((user: any) => ({ user, score: score(user) })).sort((a: any, b: any) => b.score - a.score);
  return ranked[0].score > 0 ? { assigned_to: ranked[0].user.id, assignment_method: 'location' } : { assigned_to: null, assignment_method: 'unassigned' };
}
