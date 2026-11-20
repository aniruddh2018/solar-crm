import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('suppliers', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.string('name', 255).notNullable(); t.string('contact_name', 255); t.string('phone', 50); t.string('email', 255); t.text('address'); t.string('gstin', 30); t.text('notes'); t.timestamps(true, true);
  });
  await knex.schema.alterTable('products', (t) => t.decimal('gst_rate', 5, 2).defaultTo(18));
  await knex.schema.alterTable('invoices', (t) => t.string('invoice_type', 20).notNullable().defaultTo('plant'));
  await knex.schema.alterTable('inventory_transactions', (t) => { t.uuid('supplier_id').references('id').inTable('suppliers'); t.uuid('invoice_id').references('id').inTable('invoices'); t.uuid('project_id').references('id').inTable('projects'); });
  await knex.schema.createTable('invoice_material_usage', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))')); t.uuid('invoice_id').notNullable().references('id').inTable('invoices').onDelete('CASCADE'); t.uuid('product_id').notNullable().references('id').inTable('products'); t.integer('quantity').notNullable(); t.decimal('unit_cost', 12, 2); t.timestamp('created_at').defaultTo(knex.fn.now());
  });
  await knex.schema.createTable('customer_documents', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))')); t.uuid('customer_id').notNullable().references('id').inTable('customers').onDelete('CASCADE'); t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE'); t.string('document_type', 50).notNullable(); t.string('file_name', 255).notNullable(); t.text('file_path').notNullable(); t.text('notes'); t.uuid('uploaded_by').references('id').inTable('users'); t.timestamp('created_at').defaultTo(knex.fn.now());
  });
  await knex.schema.createTable('proposal_settings', (t) => { t.integer('id').primary().defaultTo(1); t.decimal('base_price_per_kw', 12, 2).notNullable().defaultTo(60000); t.decimal('minimum_price', 12, 2).notNullable().defaultTo(100000); t.integer('validity_days').notNullable().defaultTo(15); t.text('default_scope'); t.timestamps(true, true); });
  await knex('proposal_settings').insert({ id: 1, default_scope: 'Supply, installation, testing and commissioning of the solar power plant.' });
}
export async function down(knex: Knex): Promise<void> { await knex.schema.dropTableIfExists('proposal_settings'); await knex.schema.dropTableIfExists('customer_documents'); await knex.schema.dropTableIfExists('invoice_material_usage'); await knex.schema.alterTable('inventory_transactions', (t) => t.dropColumns('supplier_id', 'invoice_id', 'project_id')); await knex.schema.alterTable('invoices', (t) => t.dropColumn('invoice_type')); await knex.schema.alterTable('products', (t) => t.dropColumn('gst_rate')); await knex.schema.dropTableIfExists('suppliers'); }
