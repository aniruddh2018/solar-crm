import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('inventory_batches', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))')); t.string('batch_number', 60).notNullable().unique();
    t.uuid('product_id').notNullable().references('id').inTable('products'); t.uuid('purchase_invoice_item_id').references('id').inTable('purchase_invoice_items');
    t.uuid('supplier_id').references('id').inTable('suppliers'); t.date('received_date'); t.integer('quantity_received').notNullable(); t.integer('quantity_remaining').notNullable();
    t.decimal('unit_cost', 12, 2).notNullable(); t.string('hsn_code', 20); t.decimal('gst_rate', 5, 2).notNullable(); t.timestamps(true, true);
  });
  await knex.schema.createTable('inventory_batch_allocations', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))')); t.uuid('batch_id').notNullable().references('id').inTable('inventory_batches');
    t.uuid('transaction_id').references('id').inTable('inventory_transactions'); t.uuid('invoice_id').references('id').inTable('invoices'); t.uuid('project_id').references('id').inTable('projects');
    t.integer('quantity').notNullable(); t.decimal('unit_cost', 12, 2).notNullable(); t.timestamp('created_at').defaultTo(knex.fn.now());
  });
  await knex.schema.createTable('product_serial_numbers', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))')); t.uuid('product_id').notNullable().references('id').inTable('products');
    t.uuid('batch_id').references('id').inTable('inventory_batches'); t.string('serial_number', 150).notNullable().unique(); t.string('status', 30).notNullable().defaultTo('in_stock');
    t.uuid('project_id').references('id').inTable('projects'); t.uuid('invoice_id').references('id').inTable('invoices'); t.timestamp('assigned_at'); t.timestamps(true, true);
  });
  await knex.schema.createTable('project_reports', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))')); t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    t.string('report_type', 40).notNullable(); t.date('report_date').notNullable(); t.string('consumer_number', 100); t.string('meter_number', 100); t.string('inspector_name', 150);
    t.string('customer_signatory', 150); t.text('remarks'); t.text('inspection_results'); t.uuid('created_by').references('id').inTable('users'); t.timestamps(true, true);
  });
  const products = await knex('products').where('quantity_in_stock', '>', 0);
  for (const product of products) await knex('inventory_batches').insert({ batch_number: `OPEN-${String(product.sku).slice(0, 30)}`, product_id: product.id, received_date: knex.fn.now(), quantity_received: product.quantity_in_stock, quantity_remaining: product.quantity_in_stock, unit_cost: product.unit_cost || 0, hsn_code: product.hsn_code, gst_rate: product.gst_rate || 18 });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('project_reports'); await knex.schema.dropTableIfExists('product_serial_numbers'); await knex.schema.dropTableIfExists('inventory_batch_allocations'); await knex.schema.dropTableIfExists('inventory_batches');
}
