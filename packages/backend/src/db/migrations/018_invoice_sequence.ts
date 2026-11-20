import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_preferences', (t) => {
    t.integer('next_invoice_number').notNullable().defaultTo(1);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_preferences', (t) => t.dropColumn('next_invoice_number'));
}
