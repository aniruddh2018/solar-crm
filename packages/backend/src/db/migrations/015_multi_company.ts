import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('companies', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))')); t.string('name', 255).notNullable(); t.string('legal_name', 255);
    t.string('code', 20).notNullable().unique(); t.string('gstin', 30); t.string('pan', 20); t.text('address'); t.string('city', 100); t.string('state', 100); t.string('state_code', 5); t.string('pincode', 10);
    t.string('phone', 50); t.string('email', 255); t.string('bank_name', 150); t.string('bank_account_name', 150); t.string('bank_account_number', 50); t.string('bank_ifsc', 20);
    t.string('invoice_prefix', 10).notNullable().defaultTo('INV'); t.string('authorized_signatory', 150); t.text('invoice_terms'); t.boolean('is_active').notNullable().defaultTo(true); t.timestamps(true, true);
  });
  await knex.schema.createTable('user_companies', (t) => { t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE'); t.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE'); t.boolean('is_default').notNullable().defaultTo(false); t.primary(['user_id', 'company_id']); });
  const [company] = await knex('companies').insert({ name: 'My Solar Company', legal_name: 'My Solar Company', code: 'MAIN', invoice_prefix: 'INV' }).returning('*');
  const users = await knex('users').select('id'); if (users.length) await knex('user_companies').insert(users.map((user: any) => ({ user_id: user.id, company_id: company.id, is_default: true })));
  for (const table of ['leads', 'customers', 'products', 'projects', 'invoices', 'suppliers', 'purchase_invoices']) {
    await knex.schema.alterTable(table, (t) => t.uuid('company_id'));
    await knex(table).whereNull('company_id').update({ company_id: company.id });
  }
  await knex.schema.alterTable('customers', (t) => { t.uuid('linked_company_id'); t.string('gstin', 30); t.string('state_code', 5); });
  await knex.schema.alterTable('invoices', (t) => { t.date('invoice_date'); t.string('financial_year', 10); });
  await knex.schema.alterTable('suppliers', (t) => t.uuid('linked_company_id'));
  await knex.schema.alterTable('invoices', (t) => { t.uuid('buyer_company_id'); t.boolean('is_internal_transfer').notNullable().defaultTo(false); t.string('place_of_supply', 150); t.string('delivery_address', 500); t.boolean('reverse_charge').notNullable().defaultTo(false); t.string('supplier_name', 255); t.string('supplier_gstin', 30); t.text('supplier_address'); t.string('recipient_name', 255); t.string('recipient_gstin', 30); t.text('recipient_address'); t.decimal('cgst_amount', 12, 2).defaultTo(0); t.decimal('sgst_amount', 12, 2).defaultTo(0); t.decimal('igst_amount', 12, 2).defaultTo(0); t.string('authorized_signatory', 150); });
  await knex.schema.alterTable('purchase_invoices', (t) => { t.uuid('seller_company_id'); t.uuid('source_invoice_id'); t.boolean('is_internal_transfer').notNullable().defaultTo(false); });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('purchase_invoices', (t) => t.dropColumns('seller_company_id', 'source_invoice_id', 'is_internal_transfer'));
  await knex.schema.alterTable('invoices', (t) => t.dropColumns('buyer_company_id', 'is_internal_transfer', 'place_of_supply', 'delivery_address', 'reverse_charge', 'supplier_name', 'supplier_gstin', 'supplier_address', 'recipient_name', 'recipient_gstin', 'recipient_address', 'cgst_amount', 'sgst_amount', 'igst_amount', 'authorized_signatory'));
  await knex.schema.alterTable('suppliers', (t) => t.dropColumn('linked_company_id')); await knex.schema.alterTable('customers', (t) => t.dropColumn('linked_company_id'));
  for (const table of ['purchase_invoices', 'suppliers', 'invoices', 'projects', 'products', 'customers', 'leads']) await knex.schema.alterTable(table, (t) => t.dropColumn('company_id'));
  await knex.schema.dropTableIfExists('user_companies'); await knex.schema.dropTableIfExists('companies');
}
