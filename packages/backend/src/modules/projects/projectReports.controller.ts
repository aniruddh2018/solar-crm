import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import db from '../../db/connection';
import { extractDcrCertificate } from '../../utils/dcrExtraction';

async function closeoutData(projectId: string) {
  const project = await db('projects').leftJoin('customers', 'projects.customer_id', 'customers.id').select('projects.*', db.raw("customers.first_name || ' ' || customers.last_name as customer_name"), 'customers.address as customer_address', 'customers.phone as customer_phone').where('projects.id', projectId).first();
  const materials = await db('invoice_material_usage').join('invoices', 'invoice_material_usage.invoice_id', 'invoices.id').join('products', 'invoice_material_usage.product_id', 'products.id').select('products.id as product_id', 'products.name', 'products.brand', 'products.hsn_code', db.raw('sum(invoice_material_usage.quantity) as quantity'), db.raw('max(invoice_material_usage.unit_cost) as unit_cost')).where('invoices.project_id', projectId).groupBy('products.id', 'products.name', 'products.brand', 'products.hsn_code');
  const serials = await db('product_serial_numbers').join('products', 'product_serial_numbers.product_id', 'products.id').select('product_serial_numbers.*', 'products.name as product_name', 'products.category').where('project_id', projectId).orderBy('products.category').orderBy('serial_number');
  const reports = await db('project_reports').where('project_id', projectId).orderBy('created_at', 'desc');
  const dcrDocument = project ? await db('customer_documents').where('customer_id', project.customer_id).where('document_type', 'dcr_certificate').where((query) => query.where('project_id', projectId).orWhereNull('project_id')).orderByRaw('project_id IS NULL').orderBy('created_at', 'desc').first() : null;
  let dcr_number = project?.dcr_number || dcrDocument?.dcr_number || null;
  if (!dcr_number && dcrDocument) {
    try {
      const extracted = await extractDcrCertificate(dcrDocument.file_path, dcrDocument.file_name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
      dcr_number = extracted.dcrNumber;
      await db('customer_documents').where('id', dcrDocument.id).update({ dcr_number, extracted_text: extracted.text || null });
      if (dcr_number) await db('projects').where('id', projectId).update({ dcr_number, dcr_document_id: dcrDocument.id, updated_at: db.fn.now() });
    } catch { /* Manual entry remains available for image-only certificates. */ }
  }
  return { project, materials, serials, reports, dcr_number, dcr_document: dcrDocument || null };
}

export async function getCloseout(req: Request, res: Response) { const data = await closeoutData(req.params.id); if (!data.project) { res.status(404).json({ error: 'Project not found' }); return; } res.json(data); }

export async function saveSerials(req: Request, res: Response) {
  const groups = [{ productId: req.body.panel_product_id, serials: req.body.panel_serials || [] }, { productId: req.body.inverter_product_id, serials: req.body.inverter_serials || [] }];
  await db.transaction(async (trx) => {
    for (const group of groups) for (const raw of group.serials) {
      const serial = String(raw).trim(); if (!serial || !group.productId) continue;
      const existing = await trx('product_serial_numbers').where('serial_number', serial).first();
      if (existing && existing.project_id && existing.project_id !== req.params.id) throw new Error(`Serial ${serial} is already assigned to another project`);
      if (existing) await trx('product_serial_numbers').where('id', existing.id).update({ product_id: group.productId, project_id: req.params.id, status: 'installed', assigned_at: trx.fn.now(), updated_at: trx.fn.now() });
      else await trx('product_serial_numbers').insert({ product_id: group.productId, serial_number: serial, project_id: req.params.id, status: 'installed', assigned_at: trx.fn.now() });
    }
  });
  res.json({ serials: (await closeoutData(req.params.id)).serials });
}

export async function createReport(req: Request, res: Response) {
  if (!['work_completion', 'joint_inspection'].includes(req.body.report_type)) { res.status(400).json({ error: 'Invalid report type' }); return; }
  const closeout = await closeoutData(req.params.id); const dcrNumber = req.body.dcr_number || closeout.dcr_number || null;
  if (dcrNumber) await db('projects').where('id', req.params.id).update({ dcr_number: dcrNumber, updated_at: db.fn.now() });
  const [report] = await db('project_reports').insert({ project_id: req.params.id, report_type: req.body.report_type, report_date: req.body.report_date || new Date().toISOString().slice(0, 10), consumer_number: req.body.consumer_number || null, meter_number: req.body.meter_number || null, dcr_number: dcrNumber, inspector_name: req.body.inspector_name || null, customer_signatory: req.body.customer_signatory || null, remarks: req.body.remarks || null, inspection_results: req.body.inspection_results || null, created_by: req.user!.id }).returning('*');
  res.status(201).json({ report });
}

export async function reportPdf(req: Request, res: Response) {
  const report = await db('project_reports').where({ id: req.params.reportId, project_id: req.params.id }).first(); const data = await closeoutData(req.params.id);
  if (!report || !data.project) { res.status(404).json({ error: 'Report not found' }); return; }
  const title = report.report_type === 'work_completion' ? 'WORK COMPLETION REPORT' : 'JOINT INSPECTION REPORT';
  res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `inline; filename="${report.report_type}-${data.project.name}.pdf"`);
  const pdf = new PDFDocument({ margin: 45, size: 'A4' }); pdf.pipe(res);
  const row = (label: string, value: unknown) => { pdf.font('Helvetica-Bold').text(`${label}:`, { continued: true }).font('Helvetica').text(` ${value || '-'}`); };
  pdf.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' }).moveDown(); pdf.fontSize(10);
  row('Project', data.project.name); row('Customer', data.project.customer_name); row('Site address', data.project.customer_address); row('System size', data.project.system_size_kw ? `${data.project.system_size_kw} kW` : '-'); row('Report date', report.report_date); row('Consumer number', report.consumer_number); row('Meter number', report.meter_number); if (report.report_type === 'work_completion') row('DCR number', report.dcr_number || data.dcr_number); pdf.moveDown();
  pdf.fontSize(12).font('Helvetica-Bold').text('Materials Installed').moveDown(0.4); pdf.fontSize(9);
  if (!data.materials.length) pdf.font('Helvetica').text('No material usage has been recorded.');
  for (const material of data.materials) pdf.font('Helvetica').text(`${material.name} | HSN ${material.hsn_code || '-'} | Qty ${material.quantity}`);
  pdf.moveDown().fontSize(12).font('Helvetica-Bold').text('Panel and Inverter Serial Numbers').moveDown(0.4).fontSize(9);
  if (!data.serials.length) pdf.font('Helvetica').text('No serial numbers have been assigned.');
  for (const serial of data.serials) pdf.font('Helvetica').text(`${serial.category.toUpperCase()} | ${serial.product_name} | ${serial.serial_number}`);
  pdf.moveDown().fontSize(12).font('Helvetica-Bold').text(report.report_type === 'joint_inspection' ? 'Inspection Findings' : 'Completion Notes').moveDown(0.4).fontSize(10).font('Helvetica').text(report.inspection_results || report.remarks || 'The above system and listed materials have been installed and checked.');
  pdf.moveDown(3); const y = pdf.y; pdf.text('____________________________', 45, y).text('____________________________', 330, y); pdf.text(`Customer: ${report.customer_signatory || data.project.customer_name || ''}`, 45, y + 16).text(`${report.report_type === 'joint_inspection' ? 'Inspector' : 'Installer'}: ${report.inspector_name || ''}`, 330, y + 16);
  pdf.fontSize(8).fillColor('#666666').text(`Generated by Solar CRM | ${new Date().toLocaleString('en-IN')}`, 45, 755, { align: 'center', width: 505, lineBreak: false }); pdf.end();
}
