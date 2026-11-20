import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meta_connections', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.uuid('connected_by').references('id').inTable('users');
    t.string('page_id', 100).notNullable().unique();
    t.string('page_name', 255).notNullable();
    t.text('page_access_token').notNullable();
    t.boolean('enabled').notNullable().defaultTo(false);
    t.timestamps(true, true);
  });
  await knex.schema.alterTable('leads', (t) => {
    t.string('meta_lead_id', 100).unique();
    t.string('meta_page_id', 100);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('leads', (t) => { t.dropColumns('meta_lead_id', 'meta_page_id'); });
  await knex.schema.dropTableIfExists('meta_connections');
}
