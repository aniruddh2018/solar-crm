import { Request, Response } from 'express';
import db from '../../db/connection';
import { extractDcrCertificate } from '../../utils/dcrExtraction';
import { safeDocumentName, sendStoredDocument } from '../../utils/documentResponse';

export async function listCustomers(req: Request, res: Response): Promise<void> {
  let query = db('customers').where('company_id', req.companyId).select('*');

  if (req.query.search) {
    query = query.where(function () {
      this.where('first_name', 'like', `%${req.query.search}%`)
        .orWhere('last_name', 'like', `%${req.query.search}%`)
        .orWhere('email', 'like', `%${req.query.search}%`)
        .orWhere('phone', 'like', `%${req.query.search}%`);
    });
  }

  const customers = await query.orderBy('created_at', 'desc');
  res.json({ customers });
}

export async function getCustomer(req: Request, res: Response): Promise<void> {
  const customer = await db('customers').where({ id: req.params.id, company_id: req.companyId }).first();
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  const projects = await db('projects').where('customer_id', customer.id).orderBy('created_at', 'desc');
  const invoices = await db('invoices').where('customer_id', customer.id).orderBy('created_at', 'desc');
  const documents = await db('customer_documents').where('customer_id', customer.id).orderBy('created_at', 'desc');

  res.json({ customer, projects, invoices, documents });
}

export async function uploadCustomerDocument(req: Request, res: Response): Promise<void> {
  if (!req.file) { res.status(400).json({ error: 'A file is required' }); return; }
  const documentType = req.body.document_type || 'other'; let extracted_text: string | null = null; let dcr_number: string | null = null;
  if (documentType === 'dcr_certificate') {
    try { const extracted = await extractDcrCertificate(req.file.path, req.file.mimetype); extracted_text = extracted.text || null; dcr_number = extracted.dcrNumber; }
    catch { /* Scanned/image PDFs remain available for manual DCR entry. */ }
  }
  const [document] = await db('customer_documents').insert({ customer_id: req.params.id, project_id: req.body.project_id || null, document_type: documentType, file_name: req.file.originalname, file_path: req.file.path, mime_type: req.file.mimetype, notes: req.body.notes || null, dcr_number, extracted_text, uploaded_by: req.user!.id }).returning('*');
  if (dcr_number) {
    const projectQuery = db('projects').where('customer_id', req.params.id); if (req.body.project_id) projectQuery.andWhere('id', req.body.project_id);
    else projectQuery.orderBy('created_at', 'desc').limit(1);
    await projectQuery.update({ dcr_number, dcr_document_id: document.id, updated_at: db.fn.now() });
  }
  res.status(201).json({ document });
}

export async function serveCustomerDocument(req: Request, res: Response): Promise<void> {
  const document = await db('customer_documents').join('customers', 'customer_documents.customer_id', 'customers.id').select('customer_documents.*', 'customers.first_name', 'customers.last_name').where('customer_documents.id', req.params.docId).where('customer_documents.customer_id', req.params.id).first();
  if (!document) { res.status(404).json({ error: 'Document not found' }); return; }
  const filename = safeDocumentName([document.first_name, document.last_name, document.document_type], document.file_name);
  sendStoredDocument(res, document.file_path, filename, req.query.download === '1' ? 'attachment' : 'inline', document.mime_type);
}

export async function createCustomer(req: Request, res: Response): Promise<void> {
  const { first_name, last_name, phone, email, address, city, state, state_code, zip, gstin, utility_company, avg_monthly_bill, annual_usage_kwh } = req.body;
  if (!first_name || !last_name || !phone) {
    res.status(400).json({ error: 'First name, last name, and phone are required' });
    return;
  }
  const [customer] = await db('customers').insert({
    company_id: req.companyId, first_name, last_name, phone, email, address: address || 'Address to be confirmed', city, state, state_code, zip, gstin,
    utility_company, avg_monthly_bill, annual_usage_kwh,
  }).returning('*');
  res.status(201).json({ customer });
}

export async function updateCustomer(req: Request, res: Response): Promise<void> {
  const [customer] = await db('customers').where({ id: req.params.id, company_id: req.companyId }).update({
    ...req.body,
    updated_at: db.fn.now(),
  }).returning('*');

  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }
  res.json({ customer });
}
