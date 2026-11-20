import { Request, Response } from 'express';
import db from '../../db/connection';
import { safeDocumentName, sendStoredDocument } from '../../utils/documentResponse';

export async function listProjects(req: Request, res: Response): Promise<void> {
  let query = db('projects')
    .leftJoin('customers', 'projects.customer_id', 'customers.id')
    .leftJoin('users as installer', 'projects.assigned_installer', 'installer.id')
    .where('projects.company_id', req.companyId).select(
      'projects.*',
      db.raw("customers.first_name || ' ' || customers.last_name as customer_name"),
      'installer.full_name as installer_name'
    );

  if (req.query.status) query = query.where('projects.status', req.query.status);
  if (req.query.customer_id) query = query.where('projects.customer_id', req.query.customer_id);
  if (req.query.assigned_installer) query = query.where('projects.assigned_installer', req.query.assigned_installer);

  // Customer portal: filter to own projects
  if ((req as any).customerId) {
    query = query.where('projects.customer_id', (req as any).customerId);
  }

  const projects = await query.orderBy('projects.created_at', 'desc');
  res.json({ projects });
}

export async function getProject(req: Request, res: Response): Promise<void> {
  const project = await db('projects')
    .leftJoin('customers', 'projects.customer_id', 'customers.id')
    .leftJoin('users as installer', 'projects.assigned_installer', 'installer.id')
    .select(
      'projects.*',
      db.raw("customers.first_name || ' ' || customers.last_name as customer_name"),
      'customers.email as customer_email',
      'customers.phone as customer_phone',
      'customers.address as customer_address',
      'installer.full_name as installer_name'
    )
    .where('projects.id', req.params.id).where('projects.company_id', req.companyId)
    .first();

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const milestones = await db('project_milestones').where('project_id', project.id).orderBy('sort_order', 'asc');
  const documents = await db('project_documents')
    .leftJoin('users', 'project_documents.uploaded_by', 'users.id')
    .select('project_documents.*', 'users.full_name as uploader_name')
    .where('project_id', project.id)
    .orderBy('created_at', 'desc');
  const products = await db('project_products')
    .leftJoin('products', 'project_products.product_id', 'products.id')
    .select('project_products.*', 'products.name as product_name', 'products.sku')
    .where('project_id', project.id);

  res.json({ project, milestones, documents, products });
}

export async function createProject(req: Request, res: Response): Promise<void> {
  const [project] = await db('projects').insert({ ...req.body, company_id: req.companyId }).returning('*');

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

  res.status(201).json({ project });
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  const [project] = await db('projects').where({ id: req.params.id, company_id: req.companyId }).update({
    ...req.body,
    updated_at: db.fn.now(),
  }).returning('*');

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json({ project });
}

export async function updateProjectStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body;
  const updates: any = { status, updated_at: db.fn.now() };
  if (status === 'completed') updates.completion_date = db.fn.now();

  const [project] = await db('projects').where({ id: req.params.id, company_id: req.companyId }).update(updates).returning('*');
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json({ project });
}

export async function updateMilestones(req: Request, res: Response): Promise<void> {
  const { milestones } = req.body; // Array of { id?, title, completed, sort_order }
  await db('project_milestones').where('project_id', req.params.id).del();

  if (milestones && milestones.length > 0) {
    const now = new Date();
    const inserts = milestones.map((m: any) => ({
      project_id: req.params.id,
      title: m.title,
      description: m.description,
      due_date: m.due_date,
      completed: m.completed || false,
      completed_at: m.completed ? now : null,
      sort_order: m.sort_order || 0,
    }));
    await db('project_milestones').insert(inserts);
  }

  const updated = await db('project_milestones').where('project_id', req.params.id).orderBy('sort_order', 'asc');
  res.json({ milestones: updated });
}

export async function uploadDocument(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const [doc] = await db('project_documents').insert({
    project_id: req.params.id,
    file_name: file.originalname,
    file_path: file.path,
    file_type: req.body.file_type || 'other',
    mime_type: file.mimetype,
    photo_stage: req.body.photo_stage || null,
    latitude: req.body.latitude || null,
    longitude: req.body.longitude || null,
    captured_at: req.body.captured_at || null,
    uploaded_by: req.user!.id,
  }).returning('*');

  res.status(201).json({ document: doc });
}

export async function serveProjectDocument(req: Request, res: Response): Promise<void> {
  const document = await db('project_documents').join('projects', 'project_documents.project_id', 'projects.id').join('customers', 'projects.customer_id', 'customers.id').select('project_documents.*', 'projects.name as project_name', 'customers.first_name', 'customers.last_name').where('project_documents.id', req.params.docId).where('project_documents.project_id', req.params.id).first();
  if (!document) { res.status(404).json({ error: 'Document not found' }); return; }
  const filename = safeDocumentName([document.first_name, document.last_name, document.project_name, document.photo_stage || document.file_type], document.file_name);
  sendStoredDocument(res, document.file_path, filename, req.query.download === '1' ? 'attachment' : 'inline', document.mime_type);
}

export async function deleteDocument(req: Request, res: Response): Promise<void> {
  await db('project_documents').where('id', req.params.docId).del();
  res.json({ message: 'Document deleted' });
}
