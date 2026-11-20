import type { Knex } from 'knex';

/**
 * GST setup is deliberately kept as one row.  The rates and split are editable
 * because tax treatment must be confirmed by the business' tax adviser.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('gst_settings', (t) => {
    t.integer('id').primary().defaultTo(1);
    t.boolean('enabled').notNullable().defaultTo(true);
    t.boolean('show_breakup_to_customer').notNullable().defaultTo(true);
    t.decimal('material_share', 5, 2).notNullable().defaultTo(80);
    t.decimal('labour_share', 5, 2).notNullable().defaultTo(20);
    t.decimal('material_gst_rate', 5, 2).notNullable().defaultTo(5);
    t.decimal('labour_gst_rate', 5, 2).notNullable().defaultTo(18);
    t.timestamps(true, true);
  });
  await knex('gst_settings').insert({ id: 1 });

  await knex.schema.alterTable('products', (t) => {
    t.string('brand', 100);
    t.string('hsn_code', 20);
  });

  await knex.schema.alterTable('invoices', (t) => {
    t.boolean('gst_enabled').notNullable().defaultTo(false);
    t.boolean('price_includes_gst').notNullable().defaultTo(false);
    t.decimal('material_base_amount', 12, 2).defaultTo(0);
    t.decimal('material_gst_amount', 12, 2).defaultTo(0);
    t.decimal('labour_base_amount', 12, 2).defaultTo(0);
    t.decimal('labour_gst_amount', 12, 2).defaultTo(0);
  });

  await knex.schema.createTable('inventory_transactions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.enu('transaction_type', ['purchase', 'sale', 'adjustment']).notNullable();
    t.integer('quantity').notNullable();
    t.decimal('unit_cost', 12, 2);
    t.string('party_name', 255);
    t.string('reference', 100);
    t.uuid('created_by').references('id').inTable('users');
    t.text('notes');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('inventory_transactions');
  await knex.schema.alterTable('invoices', (t) => {
    t.dropColumns('gst_enabled', 'price_includes_gst', 'material_base_amount', 'material_gst_amount', 'labour_base_amount', 'labour_gst_amount');
  });
  await knex.schema.alterTable('products', (t) => t.dropColumns('brand', 'hsn_code'));
  await knex.schema.dropTableIfExists('gst_settings');
}
