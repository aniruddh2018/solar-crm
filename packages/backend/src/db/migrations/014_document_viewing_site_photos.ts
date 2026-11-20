import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('customer_documents', (t) => t.string('mime_type', 120));
  await knex.schema.alterTable('project_documents', (t) => {
    t.string('mime_type', 120); t.string('photo_stage', 20); t.decimal('latitude', 10, 7); t.decimal('longitude', 10, 7); t.timestamp('captured_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('project_documents', (t) => t.dropColumns('mime_type', 'photo_stage', 'latitude', 'longitude', 'captured_at'));
  await knex.schema.alterTable('customer_documents', (t) => t.dropColumn('mime_type'));
}
