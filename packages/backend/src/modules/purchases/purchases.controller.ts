import { Request, Response } from 'express'; import db from '../../db/connection';
export async function listPurchases(req: Request, res: Response) { const purchases = await db('purchase_invoices').leftJoin('suppliers', 'purchase_invoices.supplier_id', 'suppliers.id').where('purchase_invoices.company_id', req.companyId).select('purchase_invoices.*', 'suppliers.name as supplier_name').orderBy('purchase_invoices.created_at', 'desc'); res.json({ purchases }); }
export async function createPurchase(req: Request, res: Response) {
  const { supplier_id, supplier_invoice_number, purchase_date, notes, items = [] } = req.body;
  if (!supplier_id || !purchase_date || !items.length) { res.status(400).json({ error: 'Supplier, purchase date, and at least one item are required' }); return; }
  const productRows = await db('products').where('company_id', req.companyId).whereIn('id', items.map((item: any) => item.product_id));
  const products = new Map(productRows.map((product: any) => [product.id, product]));
  const lines = items.map((item: any) => {
    const product: any = products.get(item.product_id); const quantity = Number(item.quantity); const unitCost = Number(item.unit_cost);
    if (!product || quantity <= 0 || unitCost < 0 || ![5, 18].includes(Number(product.gst_rate))) throw new Error('Invalid purchase item or product GST rate');
    const taxable = Math.round(quantity * unitCost * 100) / 100; const gst = Math.round(taxable * Number(product.gst_rate)) / 100;
    return { product, quantity, unitCost, taxable, gst, total: taxable + gst };
  });
  const subtotal = lines.reduce((sum: number, line: any) => sum + line.taxable, 0);
  const tax_amount = lines.reduce((sum: number, line: any) => sum + line.gst, 0); const total = subtotal + tax_amount;
  const count: any = await db('purchase_invoices').count('* as count').first(); const purchase_number = `PUR-${new Date().getFullYear()}-${String(Number(count.count) + 1).padStart(4, '0')}`;
  const purchase = await db.transaction(async (trx) => {
    const [created] = await trx('purchase_invoices').insert({ company_id: req.companyId, supplier_id, supplier_invoice_number, purchase_date, notes, subtotal, tax_amount, total, purchase_number, created_by: req.user!.id }).returning('*');
    for (const [index, line] of lines.entries()) {
      const [purchaseItem] = await trx('purchase_invoice_items').insert({ purchase_invoice_id: created.id, product_id: line.product.id, quantity: line.quantity, unit_cost: line.unitCost, hsn_code: line.product.hsn_code, gst_rate: line.product.gst_rate, taxable_amount: line.taxable, gst_amount: line.gst, total: line.total }).returning('*');
      await trx('inventory_batches').insert({ batch_number: `${purchase_number}-${String(index + 1).padStart(2, '0')}`, product_id: line.product.id, purchase_invoice_item_id: purchaseItem.id, supplier_id, received_date: purchase_date, quantity_received: line.quantity, quantity_remaining: line.quantity, unit_cost: line.unitCost, hsn_code: line.product.hsn_code, gst_rate: line.product.gst_rate });
      await trx('inventory_transactions').insert({ product_id: line.product.id, transaction_type: 'purchase', quantity: line.quantity, unit_cost: line.unitCost, supplier_id, reference: purchase_number, notes: supplier_invoice_number || 'Purchase invoice', created_by: req.user!.id });
      await trx('products').where('id', line.product.id).update({ quantity_in_stock: trx.raw('quantity_in_stock + ?', [line.quantity]), unit_cost: line.unitCost, updated_at: trx.fn.now() });
    }
    return created;
  });
  res.status(201).json({ purchase });
}
