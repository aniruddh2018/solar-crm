import { Request, Response } from 'express';
import db from '../../db/connection';

export async function dashboard(req: Request, res: Response): Promise<void> {
  const [
    totalRevenue,
    activeProjects,
    pipelineValue,
    totalLeads,
    recentProjects,
    leadsByStatus,
    monthlyRevenue,
  ] = await Promise.all([
    db('payments').join('invoices', 'payments.invoice_id', 'invoices.id').where('invoices.company_id', req.companyId).sum('payments.amount as total').first(),
    db('projects').where('company_id', req.companyId).whereNotIn('status', ['completed', 'cancelled']).count('* as count').first(),
    db('leads').where('company_id', req.companyId).whereNotIn('status', ['won', 'lost']).sum('estimated_value as total').first(),
    db('leads').where('company_id', req.companyId).count('* as count').first(),
    db('projects')
      .leftJoin('customers', 'projects.customer_id', 'customers.id')
      .where('projects.company_id', req.companyId)
      .select('projects.*', db.raw("customers.first_name || ' ' || customers.last_name as customer_name"))
      .orderBy('projects.updated_at', 'desc')
      .limit(5),
    db('leads')
      .where('company_id', req.companyId)
      .select('status')
      .count('* as count')
      .groupBy('status'),
    db('payments')
      .join('invoices', 'payments.invoice_id', 'invoices.id').where('invoices.company_id', req.companyId)
      .select(db.raw("strftime('%Y-%m-01', payment_date) as month"))
      .sum('amount as total')
      .groupByRaw("strftime('%Y-%m-01', payment_date)")
      .orderBy('month', 'desc')
      .limit(12),
  ]);

  res.json({
    totalRevenue: parseFloat((totalRevenue as any).total) || 0,
    activeProjects: parseInt((activeProjects as any).count, 10) || 0,
    pipelineValue: parseFloat((pipelineValue as any).total) || 0,
    totalLeads: parseInt((totalLeads as any).count, 10) || 0,
    recentProjects,
    leadsByStatus,
    monthlyRevenue,
  });
}

export async function salesReport(req: Request, res: Response): Promise<void> {
  const salesByRep = await db('leads')
    .leftJoin('users', 'leads.assigned_to', 'users.id')
    .where('leads.company_id', req.companyId).select('users.full_name')
    .count('leads.id as total_leads')
    .select(db.raw("SUM(CASE WHEN leads.status = 'won' THEN 1 ELSE 0 END) as won_leads"))
    .select(db.raw("SUM(CASE WHEN leads.status = 'won' THEN leads.estimated_value ELSE 0 END) as revenue"))
    .groupBy('users.full_name', 'leads.assigned_to')
    .orderBy('revenue', 'desc');

  res.json({ salesByRep });
}

export async function pipelineReport(req: Request, res: Response): Promise<void> {
  const pipeline = await db('leads')
    .where('company_id', req.companyId)
    .select('status')
    .count('* as count')
    .sum('estimated_value as value')
    .groupBy('status')
    .orderByRaw(`
      CASE status
        WHEN 'new' THEN 1
        WHEN 'contacted' THEN 2
        WHEN 'qualified' THEN 3
        WHEN 'proposal' THEN 4
        WHEN 'negotiation' THEN 5
        WHEN 'won' THEN 6
        WHEN 'lost' THEN 7
      END
    `);

  res.json({ pipeline });
}
