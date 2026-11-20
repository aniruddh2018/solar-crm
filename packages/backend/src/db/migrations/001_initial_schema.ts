import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Tables
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.string('email', 255).unique().notNullable();
    t.string('password_hash', 255).notNullable();
    t.string('full_name', 255).notNullable();
    t.string('phone', 50);
    t.enu('role', ['admin', 'sales', 'installer', 'customer']).notNullable();
    t.string('avatar_url');
    t.boolean('is_active').defaultTo(true);
    t.text('refresh_token');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('leads', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.string('first_name', 100).notNullable();
    t.string('last_name', 100).notNullable();
    t.string('email', 255);
    t.string('phone', 50).notNullable();
    t.text('address');
    t.string('city', 100);
    t.string('state', 50);
    t.string('zip', 20);
    t.enu('source', ['website', 'referral', 'cold_call', 'event', 'social_media', 'other']).defaultTo('website');
    t.enu('status', ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).defaultTo('new');
    t.text('notes');
    t.decimal('estimated_system_size_kw', 6, 2);
    t.decimal('estimated_value', 12, 2);
    t.uuid('assigned_to').references('id').inTable('users');
    t.uuid('created_by').references('id').inTable('users');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('lead_activities', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.uuid('lead_id').notNullable().references('id').inTable('leads').onDelete('CASCADE');
    t.uuid('user_id').references('id').inTable('users');
    t.string('activity_type', 50).notNullable();
    t.text('description');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('customers', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.uuid('user_id').references('id').inTable('users');
    t.uuid('lead_id').references('id').inTable('leads');
    t.string('first_name', 100).notNullable();
    t.string('last_name', 100).notNullable();
    t.string('email', 255);
    t.string('phone', 50).notNullable();
    t.text('address').notNullable();
    t.string('city', 100);
    t.string('state', 50);
    t.string('zip', 20);
    t.string('utility_company', 100);
    t.decimal('avg_monthly_bill', 8, 2);
    t.integer('annual_usage_kwh');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('products', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.string('name', 255).notNullable();
    t.string('sku', 50).unique().notNullable();
    t.enu('category', ['panel', 'inverter', 'battery', 'racking', 'electrical', 'other']).notNullable();
    t.string('manufacturer', 100);
    t.string('model', 100);
    t.integer('wattage');
    t.decimal('capacity_kwh', 8, 2);
    t.decimal('unit_price', 10, 2).notNullable();
    t.decimal('unit_cost', 10, 2);
    t.integer('quantity_in_stock').defaultTo(0);
    t.integer('reorder_point').defaultTo(10);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('projects', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.uuid('customer_id').notNullable().references('id').inTable('customers');
    t.uuid('lead_id').references('id').inTable('leads');
    t.string('name', 255).notNullable();
    t.enu('status', ['pending', 'permitting', 'scheduled', 'in_progress', 'inspection', 'completed', 'cancelled']).defaultTo('pending');
    t.decimal('system_size_kw', 6, 2);
    t.integer('panel_count');
    t.string('inverter_model', 100);
    t.string('battery_model', 100);
    t.decimal('contract_value', 12, 2);
    t.decimal('deposit_amount', 12, 2);
    t.boolean('deposit_paid').defaultTo(false);
    t.string('permit_number', 100);
    t.string('utility_interconnection_ref', 100);
    t.date('scheduled_date');
    t.date('completion_date');
    t.uuid('assigned_installer').references('id').inTable('users');
    t.text('notes');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('project_milestones', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    t.string('title', 255).notNullable();
    t.text('description');
    t.date('due_date');
    t.boolean('completed').defaultTo(false);
    t.timestamp('completed_at');
    t.integer('sort_order').defaultTo(0);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('project_products', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    t.uuid('product_id').references('id').inTable('products');
    t.integer('quantity').notNullable();
    t.decimal('unit_price', 10, 2);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('project_documents', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    t.string('file_name', 255).notNullable();
    t.text('file_path').notNullable();
    t.string('file_type', 50);
    t.uuid('uploaded_by').references('id').inTable('users');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('invoices', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.string('invoice_number', 50).unique().notNullable();
    t.uuid('project_id').references('id').inTable('projects');
    t.uuid('customer_id').notNullable().references('id').inTable('customers');
    t.enu('status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']).defaultTo('draft');
    t.decimal('subtotal', 12, 2).notNullable();
    t.decimal('tax_rate', 5, 3).defaultTo(0);
    t.decimal('tax_amount', 12, 2).defaultTo(0);
    t.decimal('discount_amount', 12, 2).defaultTo(0);
    t.decimal('total', 12, 2).notNullable();
    t.date('due_date');
    t.text('notes');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('invoice_items', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.uuid('invoice_id').notNullable().references('id').inTable('invoices').onDelete('CASCADE');
    t.string('description', 255).notNullable();
    t.integer('quantity').notNullable();
    t.decimal('unit_price', 10, 2).notNullable();
    t.decimal('total', 12, 2).notNullable();
    t.uuid('product_id').references('id').inTable('products');
    t.integer('sort_order').defaultTo(0);
  });

  await knex.schema.createTable('payments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.uuid('invoice_id').notNullable().references('id').inTable('invoices').onDelete('CASCADE');
    t.decimal('amount', 12, 2).notNullable();
    t.enu('method', ['cash', 'check', 'bank_transfer', 'credit_card', 'financing']).notNullable();
    t.string('reference', 100);
    t.text('notes');
    t.uuid('received_by').references('id').inTable('users');
    t.date('payment_date').defaultTo(knex.fn.now());
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('invoice_items');
  await knex.schema.dropTableIfExists('invoices');
  await knex.schema.dropTableIfExists('project_documents');
  await knex.schema.dropTableIfExists('project_products');
  await knex.schema.dropTableIfExists('project_milestones');
  await knex.schema.dropTableIfExists('projects');
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('customers');
  await knex.schema.dropTableIfExists('lead_activities');
  await knex.schema.dropTableIfExists('leads');
  await knex.schema.dropTableIfExists('users');

}
