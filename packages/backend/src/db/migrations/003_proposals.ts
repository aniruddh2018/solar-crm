import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('proposals', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.string('proposal_number', 50).notNullable().unique();
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    t.uuid('customer_id').notNullable().references('id').inTable('customers');
    t.string('title', 255).notNullable();
    t.text('scope_of_work');
    t.decimal('system_size_kw', 8, 2);
    t.decimal('plant_price', 12, 2).notNullable();
    t.boolean('gst_enabled').notNullable().defaultTo(true);
    t.decimal('material_base_amount', 12, 2).defaultTo(0);
    t.decimal('material_gst_amount', 12, 2).defaultTo(0);
    t.decimal('labour_base_amount', 12, 2).defaultTo(0);
    t.decimal('labour_gst_amount', 12, 2).defaultTo(0);
    t.enu('status', ['draft', 'sent', 'accepted', 'rejected']).notNullable().defaultTo('draft');
    t.date('valid_until');
    t.uuid('created_by').references('id').inTable('users');
    t.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('proposals');
}
