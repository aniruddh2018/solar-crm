import type { Knex } from 'knex';

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('customer_documents', (t) => { t.string('dcr_number', 150); t.text('extracted_text'); });
  await knex.raw('PRAGMA foreign_keys = OFF');
  try { await knex.schema.alterTable('projects', (t) => { t.string('dcr_number', 150); t.uuid('dcr_document_id'); }); }
  finally { await knex.raw('PRAGMA foreign_keys = ON'); }
  await knex.schema.alterTable('project_reports', (t) => t.string('dcr_number', 150));
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('project_reports', (t) => t.dropColumn('dcr_number'));
  await knex.schema.alterTable('projects', (t) => t.dropColumns('dcr_number', 'dcr_document_id'));
  await knex.schema.alterTable('customer_documents', (t) => t.dropColumns('dcr_number', 'extracted_text'));
}
