import { Request, Response } from 'express';
import db from '../../db/connection';
import { generateInvoiceNumber } from '../../utils/helpers';
import { allocateBatches } from '../inventory/batches';
import PDFDocument from 'pdfkit';

type GsTBreakup = {
  subtotal: number; tax_amount: number; total: number;
  material_base_amount: number; material_gst_amount: number;
  labour_base_amount: number; labour_gst_amount: number;
};

function round(value: number): number { return Math.round(value * 100) / 100; }

function calculateSolarGst(grossAmount: number, settings: any, priceIncludesGst: boolean): GsTBreakup {
  const materialShare = Number(settings.material_share) / 100;
  const labourShare = Number(settings.labour_share) / 100;
  const materialRate = Number(settings.material_gst_rate) / 100;
  const labourRate = Number(settings.labour_gst_rate) / 100;
  const multiplier = materialShare * (1 + materialRate) + labourShare * (1 + labourRate);
  const base = priceIncludesGst ? grossAmount / multiplier : grossAmount;
  const materialBase = round(base * materialShare);
  const labourBase = round(base - materialBase);
  const materialGst = round(materialBase * materialRate);
  const labourGst = round(labourBase * labourRate);
  const subtotal = round(materialBase + labourBase);
  const tax = round(materialGst + labourGst);
  return {
    subtotal, tax_amount: tax, total: priceIncludesGst ? round(grossAmount) : round(subtotal + tax),
    material_base_amount: materialBase, material_gst_amount: materialGst,
    labour_base_amount: labourBase, labour_gst_amount: labourGst,
  };
}

export async function listInvoices(req: Request, res: Response): Promise<void> {
  let query = db('invoices')
    .leftJoin('customers', 'invoices.customer_id', 'customers.id')
    .where('invoices.company_id', req.companyId).select(
      'invoices.*',
      db.raw("customers.first_name || ' ' || customers.last_name as customer_name")
    );

  if (req.query.status) query = query.where('invoices.status', req.query.status);
  if (req.query.customer_id) query = query.where('invoices.customer_id', req.query.customer_id);
  if (req.query.project_id) query = query.where('invoices.project_id', req.query.project_id);

  if ((req as any).customerId) {
    query = query.where('invoices.customer_id', (req as any).customerId);
  }

  const invoices = await query.orderBy('invoices.created_at', 'desc');
  res.json({ invoices });
}

export async function getInvoice(req: Request, res: Response): Promise<void> {
  const invoice = await db('invoices')
    .leftJoin('customers', 'invoices.customer_id', 'customers.id')
    .leftJoin('projects', 'invoices.project_id', 'projects.id')
    .select(
      'invoices.*',
      db.raw("customers.first_name || ' ' || customers.last_name as customer_name"),
      'customers.email as customer_email',
      'customers.phone as customer_phone',
      'customers.address as customer_address',
      'projects.name as project_name'
    )
    .where('invoices.id', req.params.id).where('invoices.company_id', req.companyId)
    .first();

  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  const items = await db('invoice_items')
    .leftJoin('products', 'invoice_items.product_id', 'products.id')
    .select('invoice_items.*', 'products.name as product_name')
    .where('invoice_id', invoice.id)
    .orderBy('sort_order', 'asc');

  const payments = await db('payments')
    .leftJoin('users', 'payments.received_by', 'users.id')
    .select('payments.*', 'users.full_name as received_by_name')
    .where('invoice_id', invoice.id)
    .orderBy('payment_date', 'desc');

  res.json({ invoice, items, payments });
}

export async function createInvoice(req: Request, res: Response): Promise<void> {
  const { items = [], material_usage = [], gross_total, plant_description, ...invoiceData } = req.body;
  // HTML forms submit an optional select as an empty string; SQLite correctly
  // rejects that as a foreign key, so persist it as null instead.
  if (invoiceData.project_id === '') invoiceData.project_id = null;
  const invoiceType = invoiceData.invoice_type || (items.length ? 'item' : 'plant');

  const company = await db('companies').where('id', req.companyId).first();
  const customer = await db('customers').where({ id: invoiceData.customer_id, company_id: req.companyId }).first();
  if (!company || !customer) { res.status(400).json({ error: 'Valid company and customer are required' }); return; }
  const invoiceDate = invoiceData.invoice_date || new Date().toISOString().slice(0, 10); const date = new Date(`${invoiceDate}T00:00:00`); const startYear = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1; const financialYear = `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
  const count: any = await db('invoices').where({ company_id: req.companyId, financial_year: financialYear }).count('* as count').first();
  const sequence = await db('company_preferences').where('company_id', req.companyId).first();
  const serial = Math.max(Number(sequence?.next_invoice_number || 1), Number(count.count) + 1);
  const series = `${String(company.invoice_prefix || 'I').slice(0, 2)}${String(company.code).slice(0, 3)}`.toUpperCase(); invoiceData.invoice_number = `${series}/${financialYear}/${String(serial).padStart(4, '0')}`;
  invoiceData.company_id = req.companyId; invoiceData.invoice_date = invoiceDate; invoiceData.financial_year = financialYear;
  if (!invoiceData.due_date) {
    const preferences = await db('company_preferences').where('company_id', req.companyId).first();
    const dueDate = new Date(`${invoiceDate}T00:00:00`);
    dueDate.setDate(dueDate.getDate() + Number(preferences?.default_invoice_due_days ?? 15));
    invoiceData.due_date = dueDate.toISOString().slice(0, 10);
  }
  invoiceData.supplier_name = company.legal_name || company.name; invoiceData.supplier_gstin = company.gstin; invoiceData.supplier_address = [company.address, company.city, company.state, company.pincode].filter(Boolean).join(', ');
  invoiceData.recipient_name = `${customer.first_name} ${customer.last_name}`; invoiceData.recipient_gstin = customer.gstin; invoiceData.recipient_address = [customer.address, customer.city, customer.state, customer.zip].filter(Boolean).join(', '); invoiceData.delivery_address ||= invoiceData.recipient_address; invoiceData.place_of_supply ||= [customer.state, customer.state_code].filter(Boolean).join(' - '); invoiceData.authorized_signatory = company.authorized_signatory;

  const settings = await db('gst_settings').where('id', 1).first();
  const gstEnabled = invoiceType === 'plant' && (invoiceData.gst_enabled ?? Boolean(settings?.enabled));
  let itemLines: any[] = [];
  if (invoiceType === 'item') {
    const productRows = await db('products').whereIn('id', items.map((item: any) => item.product_id).filter(Boolean));
    const products = new Map(productRows.map((product: any) => [product.id, product]));
    itemLines = items.map((item: any) => {
      const product: any = products.get(item.product_id); const quantity = Number(item.quantity); const unitPrice = Number(item.unit_price);
      if (!product || quantity <= 0 || unitPrice < 0 || !product.hsn_code || ![5, 18].includes(Number(product.gst_rate))) throw new Error('Every invoice product needs a valid HSN and a 5% or 18% GST rate');
      const taxable = round(quantity * unitPrice); const gst = round(taxable * Number(product.gst_rate) / 100);
      return { ...item, description: item.description || product.name, product, quantity, unit_price: unitPrice, taxable_amount: taxable, gst_amount: gst, total: round(taxable + gst) };
    });
  }
  const lineAmount = itemLines.reduce((sum: number, line: any) => sum + line.taxable_amount, 0);
  const enteredAmount = Number(gross_total ?? lineAmount);
  if (!Number.isFinite(enteredAmount) || enteredAmount <= 0) {
    res.status(400).json({ error: 'A positive plant price or invoice line total is required' });
    return;
  }

  invoiceData.gst_enabled = gstEnabled;
  invoiceData.price_includes_gst = invoiceData.price_includes_gst ?? true;
  if (gstEnabled) {
    Object.assign(invoiceData, calculateSolarGst(enteredAmount, settings, invoiceData.price_includes_gst));
    invoiceData.tax_rate = 0;
  } else {
    const subtotal = lineAmount || enteredAmount;
    const taxAmount = itemLines.reduce((sum: number, line: any) => sum + line.gst_amount, 0);
    Object.assign(invoiceData, {
      subtotal, tax_amount: taxAmount,
      total: subtotal + taxAmount - Number(invoiceData.discount_amount || 0),
      material_base_amount: 0, material_gst_amount: 0, labour_base_amount: 0, labour_gst_amount: 0,
    });
  }

  invoiceData.invoice_type = invoiceType;
  const intraState = Boolean(company.state_code && customer.state_code && String(company.state_code) === String(customer.state_code));
  invoiceData.cgst_amount = intraState ? round(Number(invoiceData.tax_amount) / 2) : 0; invoiceData.sgst_amount = intraState ? round(Number(invoiceData.tax_amount) - Number(invoiceData.cgst_amount)) : 0; invoiceData.igst_amount = intraState ? 0 : Number(invoiceData.tax_amount);
  const [invoice] = await db('invoices').insert(invoiceData).returning('*');
  await db('company_preferences').where('company_id', req.companyId).update({ next_invoice_number: serial + 1, updated_at: db.fn.now() });

  const invoiceItems = invoiceType === 'plant'
    ? [
      { description: 'Solar materials', quantity: 1, unit_price: Number(invoiceData.material_base_amount || 0), hsn_code: '8541', gst_rate: Number(settings.material_gst_rate), taxable_amount: Number(invoiceData.material_base_amount || 0), gst_amount: Number(invoiceData.material_gst_amount || 0), total: Number(invoiceData.material_base_amount || 0) + Number(invoiceData.material_gst_amount || 0) },
      { description: 'Installation and commissioning', quantity: 1, unit_price: Number(invoiceData.labour_base_amount || 0), hsn_code: '995461', gst_rate: Number(settings.labour_gst_rate), taxable_amount: Number(invoiceData.labour_base_amount || 0), gst_amount: Number(invoiceData.labour_gst_amount || 0), total: Number(invoiceData.labour_base_amount || 0) + Number(invoiceData.labour_gst_amount || 0) },
    ]
    : itemLines;
  if (invoiceItems.length > 0) {
    await db('invoice_items').insert(
      invoiceItems.map((item: any, idx: number) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        hsn_code: item.hsn_code || item.product?.hsn_code,
        gst_rate: item.gst_rate ?? item.product?.gst_rate ?? 0,
        taxable_amount: item.taxable_amount ?? item.quantity * item.unit_price,
        gst_amount: item.gst_amount ?? 0,
        total: item.total ?? item.quantity * item.unit_price,
        product_id: item.product_id,
        sort_order: idx,
      }))
    );
  }

  // The build-of-materials is an internal stock record; it never appears on a plant invoice.
  if (invoiceType === 'plant' && material_usage.length) {
    await db.transaction(async (trx) => {
      for (const usage of material_usage) {
        const product = await trx('products').where('id', usage.product_id).first(); const quantity = Number(usage.quantity);
        if (!product || !Number.isFinite(quantity) || quantity <= 0) throw new Error('Invalid material usage');
        if (Number(product.quantity_in_stock) < quantity) throw new Error(`${product.name} does not have sufficient stock`);
        await trx('invoice_material_usage').insert({ invoice_id: invoice.id, product_id: product.id, quantity, unit_cost: product.unit_cost });
        const [transaction] = await trx('inventory_transactions').insert({ product_id: product.id, transaction_type: 'sale', quantity: -quantity, unit_cost: product.unit_cost, invoice_id: invoice.id, project_id: invoice.project_id, reference: invoice.invoice_number, notes: 'Consumed by plant build', created_by: req.user!.id }).returning('*');
        await allocateBatches(trx, { productId: product.id, quantity, transactionId: transaction.id, invoiceId: invoice.id, projectId: invoice.project_id });
        await trx('products').where('id', product.id).update({ quantity_in_stock: trx.raw('quantity_in_stock - ?', [quantity]), updated_at: trx.fn.now() });
      }
    });
  }
  if (invoiceType === 'item' && items.length) {
    await db.transaction(async (trx) => {
      for (const item of itemLines) {
        if (!item.product_id) continue;
        const product = await trx('products').where('id', item.product_id).first(); const quantity = Number(item.quantity);
        if (!product || !Number.isFinite(quantity) || quantity <= 0) throw new Error('Invalid item invoice product');
        if (Number(product.quantity_in_stock) < quantity) throw new Error(`${product.name} does not have sufficient stock`);
        const [transaction] = await trx('inventory_transactions').insert({ product_id: product.id, transaction_type: 'sale', quantity: -quantity, unit_cost: product.unit_cost, invoice_id: invoice.id, reference: invoice.invoice_number, notes: 'Sold on item invoice', created_by: req.user!.id }).returning('*');
        await allocateBatches(trx, { productId: product.id, quantity, transactionId: transaction.id, invoiceId: invoice.id, projectId: invoice.project_id });
        await trx('products').where('id', product.id).update({ quantity_in_stock: trx.raw('quantity_in_stock - ?', [quantity]), updated_at: trx.fn.now() });
      }
    });
  }

  const createdItems = await db('invoice_items').where('invoice_id', invoice.id).orderBy('sort_order', 'asc');
  res.status(201).json({ invoice, items: createdItems });
}

export async function updateInvoice(req: Request, res: Response): Promise<void> {
  const { items, ...invoiceData } = req.body;

  if (items) {
    const subtotal = items.reduce((sum: number, i: any) => sum + i.quantity * i.unit_price, 0);
    const taxRate = invoiceData.tax_rate !== undefined ? invoiceData.tax_rate : 0;
    const taxAmount = subtotal * taxRate;
    const discount = invoiceData.discount_amount || 0;
    const total = subtotal + taxAmount - discount;

    invoiceData.subtotal = subtotal;
    invoiceData.tax_amount = taxAmount;
    invoiceData.total = total;

    await db('invoice_items').where('invoice_id', req.params.id).del();
    await db('invoice_items').insert(
      items.map((item: any, idx: number) => ({
        invoice_id: req.params.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
        product_id: item.product_id,
        sort_order: idx,
      }))
    );
  }

  const [invoice] = await db('invoices').where({ id: req.params.id, company_id: req.companyId }).update({
    ...invoiceData,
    updated_at: db.fn.now(),
  }).returning('*');

  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  res.json({ invoice });
}

export async function addPayment(req: Request, res: Response): Promise<void> {
  const invoice = await db('invoices').where({ id: req.params.id, company_id: req.companyId }).first();
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  const [payment] = await db('payments').insert({
    invoice_id: invoice.id,
    amount: req.body.amount,
    method: req.body.method,
    reference: req.body.reference,
    notes: req.body.notes,
    received_by: req.user!.id,
    payment_date: req.body.payment_date || db.fn.now(),
  }).returning('*');

  // Check if fully paid
  const payments = await db('payments').where('invoice_id', invoice.id).sum('amount as total_paid');
  const totalPaid = parseFloat(payments[0].total_paid) || 0;

  if (totalPaid >= parseFloat(String(invoice.total))) {
    await db('invoices').where('id', invoice.id).update({ status: 'paid', updated_at: db.fn.now() });
  }

  res.status(201).json({ payment });
}

export async function getInvoicePdf(req: Request, res: Response): Promise<void> {
  const invoice = await db('invoices').where({ id: req.params.id, company_id: req.companyId }).first(); if (!invoice) { res.status(404).json({ error: 'Invoice not found' }); return; }
  const items = await db('invoice_items').where('invoice_id', invoice.id).orderBy('sort_order');
  const company = await db('companies').where('id', invoice.company_id).first();
  const preferences = await db('company_preferences').where('company_id', invoice.company_id).first() || {};
  const accent = /^#[0-9a-f]{6}$/i.test(preferences.invoice_accent_color || '') ? preferences.invoice_accent_color : '#d97706';
  res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `inline; filename="tax-invoice-${invoice.invoice_number.replace(/\//g, '-')}.pdf"`);
  const pdf = new PDFDocument({ size: 'A4', margin: 38 }); pdf.pipe(res); const money = (value: any) => `Rs. ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  pdf.rect(38, 38, 519, 5).fill(accent); pdf.fillColor('#111827').font('Helvetica-Bold').fontSize(18).text(preferences.invoice_title || 'TAX INVOICE', { align: 'center' }).moveDown(0.5); pdf.fontSize(11).text(invoice.supplier_name || '-'); pdf.font('Helvetica').fontSize(9).text(invoice.supplier_address || '-').text(`GSTIN: ${invoice.supplier_gstin || '-'}`);
  pdf.moveDown(0.6); const infoY = pdf.y; pdf.font('Helvetica-Bold').text('Invoice No:', 38, infoY).font('Helvetica').text(invoice.invoice_number, 105, infoY).font('Helvetica-Bold').text('Date:', 330, infoY).font('Helvetica').text(String(invoice.invoice_date || invoice.created_at).slice(0, 10), 370, infoY); pdf.x = 38; pdf.y = infoY + 30;
  pdf.font('Helvetica-Bold').text('Bill To').font('Helvetica').text(invoice.recipient_name || '-').text(invoice.recipient_address || '-').text(`GSTIN: ${invoice.recipient_gstin || '-'}`).text(`Place of supply: ${invoice.place_of_supply || '-'}`).text(`Delivery address: ${invoice.delivery_address || invoice.recipient_address || '-'}`).text(`Reverse charge: ${invoice.reverse_charge ? 'Yes' : 'No'}`).moveDown();
  const columns = [38, 62, 255, 315, 365, 430, 500]; const headers = ['#', preferences.invoice_show_hsn === 0 ? 'Description' : 'Description / HSN', 'Qty', 'Rate', 'Taxable', 'GST', 'Total']; const widths = [24, 193, 60, 50, 65, 70, 55]; const tableTop = pdf.y; pdf.rect(38, tableTop, 519, 22).fill(accent).fillColor('#ffffff').font('Helvetica-Bold').fontSize(8); headers.forEach((header, i) => pdf.text(header, columns[i] + 3, tableTop + 7, { width: widths[i] - 6, align: i > 1 ? 'right' : 'left' })); let y = tableTop + 22;
  items.forEach((item: any, index: number) => { const h = 34; pdf.rect(38, y, 519, h).strokeColor('#dddddd').stroke(); pdf.font('Helvetica').fontSize(8).fillColor('#000000'); const description = preferences.invoice_show_hsn === 0 ? item.description : `${item.description}\nHSN/SAC: ${item.hsn_code || '-'}`; const values = [String(index + 1), description, String(item.quantity), money(item.unit_price), money(item.taxable_amount), `${Number(item.gst_rate || 0)}%\n${money(item.gst_amount)}`, money(item.total)]; values.forEach((value, i) => pdf.text(value, columns[i] + 3, y + 6, { width: widths[i] - 6, align: i > 1 ? 'right' : 'left' })); y += h; }); pdf.y = y + 10;
  let totalsY = pdf.y; const totalRow = (label: string, value: any) => { pdf.font('Helvetica').fontSize(9).text(label, 355, totalsY, { width: 105, align: 'right', lineBreak: false }).font('Helvetica-Bold').text(money(value), 465, totalsY, { width: 92, align: 'right', lineBreak: false }); totalsY += 15; }; totalRow('Taxable value:', invoice.subtotal); if (Number(invoice.cgst_amount)) totalRow('CGST:', invoice.cgst_amount); if (Number(invoice.sgst_amount)) totalRow('SGST:', invoice.sgst_amount); if (Number(invoice.igst_amount)) totalRow('IGST:', invoice.igst_amount); totalRow('Invoice total:', invoice.total); pdf.x = 38; pdf.y = totalsY + 10;
  if (preferences.invoice_show_bank !== 0 && company?.bank_name) pdf.font('Helvetica').fontSize(8).fillColor('#111827').text(`Bank: ${company.bank_name} | A/c: ${company.bank_account_number || '-'} | IFSC: ${company.bank_ifsc || '-'}`, 38, pdf.y, { width: 310 });
  pdf.moveDown(1).font('Helvetica').fontSize(8).text(preferences.invoice_footer || 'Certified that the particulars given above are true and correct.');
  if (preferences.invoice_show_signature !== 0) pdf.moveDown(1).font('Helvetica-Bold').text(`For ${invoice.supplier_name || ''}`, { align: 'right' }).moveDown(2).text(invoice.authorized_signatory || 'Authorised Signatory', { align: 'right' });
  pdf.font('Helvetica').fontSize(7).fillColor('#666666').text('Computer-generated tax invoice. Subject to applicable GST law and e-invoicing requirements.', 38, 755, { width: 519, align: 'center', lineBreak: false }); pdf.end();
}
