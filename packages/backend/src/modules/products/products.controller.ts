import { Request, Response } from 'express';
import db from '../../db/connection';
import { allocateBatches } from '../inventory/batches';

function hasSupportedGstRate(body: Record<string, unknown>): boolean {
  return body.gst_rate === undefined || [5, 18].includes(Number(body.gst_rate));
}

export async function listProducts(req: Request, res: Response): Promise<void> {
  let query = db('products').where('company_id', req.companyId).select('*');

  if (req.query.category) query = query.where('category', req.query.category);
  if (req.query.low_stock === 'true') query = query.where('quantity_in_stock', '<=', db.raw('reorder_point'));
  if (req.query.search) {
    query = query.where(function () {
      this.where('name', 'like', `%${req.query.search}%`)
        .orWhere('sku', 'like', `%${req.query.search}%`)
        .orWhere('manufacturer', 'like', `%${req.query.search}%`);
    });
  }

  const products = await query.orderBy('name', 'asc');
  const batches = await db('inventory_batches').where('quantity_remaining', '>', 0).orderBy('received_date');
  for (const product of products as any[]) product.batches = batches.filter((batch: any) => batch.product_id === product.id);
  res.json({ products });
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  const product = await db('products').where({ id: req.params.id, company_id: req.companyId }).first();
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json({ product });
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  if (!hasSupportedGstRate(req.body)) {
    res.status(400).json({ error: 'GST rate must be either 5% or 18%' });
    return;
  }
  const [product] = await db('products').insert({ ...req.body, company_id: req.companyId }).returning('*');
  res.status(201).json({ product });
}

export async function listCategories(_req: Request, res: Response): Promise<void> {
  res.json({ categories: await db('product_categories').orderBy('name') });
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const name = String(req.body.name || '').trim();
  if (!name) { res.status(400).json({ error: 'Category name is required' }); return; }
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'category';
  let slug = base; let suffix = 2;
  while (await db('product_categories').where('slug', slug).first()) slug = `${base}_${suffix++}`;
  const [category] = await db('product_categories').insert({ name, slug, is_system: false }).returning('*');
  res.status(201).json({ category });
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  if (!hasSupportedGstRate(req.body)) {
    res.status(400).json({ error: 'GST rate must be either 5% or 18%' });
    return;
  }
  const [product] = await db('products').where({ id: req.params.id, company_id: req.companyId }).update({
    ...req.body,
    updated_at: db.fn.now(),
  }).returning('*');

  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json({ product });
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  await db('products').where({ id: req.params.id, company_id: req.companyId }).del();
  res.json({ message: 'Product deleted' });
}

export async function listTransactions(req: Request, res: Response): Promise<void> {
  const product = await db('products').where({ id: req.params.id, company_id: req.companyId }).first(); if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
  const transactions = await db('inventory_transactions')
    .where('product_id', req.params.id)
    .orderBy('created_at', 'desc');
  res.json({ transactions });
}

export async function createTransaction(req: Request, res: Response): Promise<void> {
  const product = await db('products').where({ id: req.params.id, company_id: req.companyId }).first();
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  const { transaction_type, quantity, unit_cost, party_name, reference, notes, supplier_id } = req.body;
  const amount = Number(quantity);
  if (!['purchase', 'sale', 'adjustment'].includes(transaction_type) || !Number.isFinite(amount) || amount === 0) {
    res.status(400).json({ error: 'Valid transaction type and non-zero quantity are required' });
    return;
  }
  const stockChange = transaction_type === 'sale' ? -Math.abs(amount) : amount;
  if (Number(product.quantity_in_stock) + stockChange < 0) {
    res.status(400).json({ error: 'Sale quantity exceeds stock on hand' });
    return;
  }
  const [transaction] = await db.transaction(async (trx) => {
    const [created] = await trx('inventory_transactions').insert({
      product_id: product.id, transaction_type, quantity: stockChange, unit_cost, party_name, reference, notes, supplier_id,
      created_by: req.user!.id,
    }).returning('*');
    const update: Record<string, unknown> = {
      quantity_in_stock: trx.raw('quantity_in_stock + ?', [stockChange]), updated_at: trx.fn.now(),
    };
    if (transaction_type === 'purchase' && unit_cost !== undefined) update.unit_cost = unit_cost;
    await trx('products').where('id', product.id).update(update);
    if (transaction_type === 'sale') await allocateBatches(trx, { productId: product.id, quantity: Math.abs(amount), transactionId: created.id });
    if (transaction_type === 'purchase') {
      const count: any = await trx('inventory_batches').count('* as count').first();
      await trx('inventory_batches').insert({ batch_number: `MAN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Number(count.count) + 1).padStart(4, '0')}`, product_id: product.id, supplier_id: supplier_id || null, received_date: new Date().toISOString().slice(0, 10), quantity_received: amount, quantity_remaining: amount, unit_cost: Number(unit_cost || 0), hsn_code: product.hsn_code, gst_rate: product.gst_rate });
    }
    return [created];
  });
  res.status(201).json({ transaction });
}
