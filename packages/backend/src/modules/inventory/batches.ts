import type { Knex } from 'knex';

export async function allocateBatches(trx: Knex.Transaction, data: { productId: string; quantity: number; transactionId: string; invoiceId?: string; projectId?: string | null }) {
  let needed = data.quantity;
  const batches = await trx('inventory_batches').where('product_id', data.productId).where('quantity_remaining', '>', 0).orderBy('received_date').orderBy('created_at');
  if (batches.reduce((sum: number, batch: any) => sum + Number(batch.quantity_remaining), 0) < needed) throw new Error('Insufficient batch stock for this product');
  for (const batch of batches) {
    if (needed <= 0) break;
    const quantity = Math.min(needed, Number(batch.quantity_remaining));
    await trx('inventory_batches').where('id', batch.id).update({ quantity_remaining: Number(batch.quantity_remaining) - quantity, updated_at: trx.fn.now() });
    await trx('inventory_batch_allocations').insert({ batch_id: batch.id, transaction_id: data.transactionId, invoice_id: data.invoiceId || null, project_id: data.projectId || null, quantity, unit_cost: batch.unit_cost });
    needed -= quantity;
  }
}
