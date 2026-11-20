import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('invoice_items', (t) => {
    t.string('hsn_code', 20); t.decimal('gst_rate', 5, 2).defaultTo(0);
    t.decimal('taxable_amount', 12, 2).defaultTo(0); t.decimal('gst_amount', 12, 2).defaultTo(0);
  });
  await knex.schema.alterTable('purchase_invoices', (t) => {
    t.decimal('subtotal', 12, 2).defaultTo(0); t.decimal('tax_amount', 12, 2).defaultTo(0);
  });
  await knex.schema.alterTable('purchase_invoice_items', (t) => {
    t.string('hsn_code', 20); t.decimal('gst_rate', 5, 2).defaultTo(0);
    t.decimal('taxable_amount', 12, 2).defaultTo(0); t.decimal('gst_amount', 12, 2).defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('purchase_invoice_items', (t) => t.dropColumns('hsn_code', 'gst_rate', 'taxable_amount', 'gst_amount'));
  await knex.schema.alterTable('purchase_invoices', (t) => t.dropColumns('subtotal', 'tax_amount'));
  await knex.schema.alterTable('invoice_items', (t) => t.dropColumns('hsn_code', 'gst_rate', 'taxable_amount', 'gst_amount'));
}
