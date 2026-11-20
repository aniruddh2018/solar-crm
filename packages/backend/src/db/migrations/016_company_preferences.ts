import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('company_preferences', (t) => {
    t.uuid('company_id').primary().references('id').inTable('companies').onDelete('CASCADE');
    t.string('invoice_title', 100).notNullable().defaultTo('TAX INVOICE'); t.string('invoice_accent_color', 20).notNullable().defaultTo('#d97706'); t.text('invoice_footer');
    t.boolean('invoice_show_bank').notNullable().defaultTo(true); t.boolean('invoice_show_hsn').notNullable().defaultTo(true); t.boolean('invoice_show_signature').notNullable().defaultTo(true);
    t.string('quotation_title', 100).notNullable().defaultTo('SOLAR PROPOSAL'); t.string('quotation_accent_color', 20).notNullable().defaultTo('#d97706'); t.text('quotation_footer');
    t.integer('default_invoice_due_days').notNullable().defaultTo(15); t.integer('quotation_validity_days').notNullable().defaultTo(15);
    t.boolean('auto_customer_on_lead_won').notNullable().defaultTo(true); t.boolean('require_project_bom').notNullable().defaultTo(true); t.boolean('prevent_negative_stock').notNullable().defaultTo(true);
    t.string('stock_issue_method', 20).notNullable().defaultTo('FIFO'); t.integer('default_reorder_point').notNullable().defaultTo(10); t.timestamps(true, true);
  });
  const companies = await knex('companies').select('id'); if (companies.length) await knex('company_preferences').insert(companies.map((company: any) => ({ company_id: company.id })));
}

export async function down(knex: Knex): Promise<void> { await knex.schema.dropTableIfExists('company_preferences'); }
