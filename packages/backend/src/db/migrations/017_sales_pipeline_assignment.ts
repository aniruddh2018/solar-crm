import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('lead_pipelines', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    t.string('name', 120).notNullable(); t.text('description'); t.boolean('is_default').notNullable().defaultTo(false); t.boolean('is_active').notNullable().defaultTo(true); t.timestamps(true, true);
  });
  await knex.schema.createTable('lead_pipeline_stages', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.uuid('pipeline_id').notNullable().references('id').inTable('lead_pipelines').onDelete('CASCADE');
    t.string('name', 100).notNullable(); t.string('key', 60).notNullable(); t.string('color', 30).notNullable().defaultTo('blue'); t.integer('sort_order').notNullable().defaultTo(0); t.boolean('is_won').notNullable().defaultTo(false); t.boolean('is_lost').notNullable().defaultTo(false); t.unique(['pipeline_id', 'key']);
  });
  await knex.schema.createTable('lead_assignment_settings', (t) => {
    t.uuid('company_id').primary().references('id').inTable('companies').onDelete('CASCADE');
    t.string('online_assignment_method', 20).notNullable().defaultTo('location'); t.integer('round_robin_cursor').notNullable().defaultTo(0); t.timestamps(true, true);
  });
  await knex.schema.createTable('salesperson_territories', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE'); t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('state', 100); t.string('city', 100); t.string('pincode', 20); t.boolean('is_active').notNullable().defaultTo(true); t.timestamps(true, true);
  });
  await knex.schema.alterTable('users', (t) => { t.string('salesperson_code', 30); t.string('base_state', 100); t.string('base_city', 100); t.string('base_pincode', 20); t.boolean('is_available_for_leads').notNullable().defaultTo(true); });
  await knex.schema.alterTable('leads', (t) => { t.uuid('pipeline_id').references('id').inTable('lead_pipelines'); t.uuid('pipeline_stage_id').references('id').inTable('lead_pipeline_stages'); t.string('entry_mode', 20).notNullable().defaultTo('online'); t.string('assignment_method', 20); });
  await knex.schema.alterTable('meta_connections', (t) => t.uuid('company_id'));

  const companies = await knex('companies').select('id');
  for (const company of companies) {
    const [pipeline] = await knex('lead_pipelines').insert({ company_id: company.id, name: 'Field Sales', description: 'Offline salesperson visits and follow-ups', is_default: true }).returning('*');
    const stages = [
      ['new', 'New Visit Lead', 'blue'], ['visit_planned', 'Visit Planned', 'indigo'], ['site_visited', 'Site Visited', 'purple'], ['qualified', 'Qualified', 'violet'],
      ['quotation', 'Quotation Sent', 'orange'], ['follow_up', 'Follow-up', 'yellow'], ['negotiation', 'Negotiation', 'amber'], ['won', 'Won', 'green'], ['lost', 'Lost', 'red'],
    ];
    await knex('lead_pipeline_stages').insert(stages.map(([key, name, color], index) => ({ pipeline_id: pipeline.id, key, name, color, sort_order: index, is_won: key === 'won', is_lost: key === 'lost' })));
    await knex('lead_assignment_settings').insert({ company_id: company.id });
    const stageRows = await knex('lead_pipeline_stages').where('pipeline_id', pipeline.id);
    for (const lead of await knex('leads').where('company_id', company.id)) {
      const compatible: Record<string, string> = { contacted: 'visit_planned', proposal: 'quotation' };
      const key = compatible[lead.status] || (stageRows.some((s: any) => s.key === lead.status) ? lead.status : 'new');
      const stage = stageRows.find((s: any) => s.key === key);
      await knex('leads').where('id', lead.id).update({ pipeline_id: pipeline.id, pipeline_stage_id: stage?.id });
    }
  }
  for (const connection of await knex('meta_connections')) { const membership = await knex('user_companies').where('user_id', connection.connected_by).orderBy('is_default', 'desc').first(); if (membership) await knex('meta_connections').where('id', connection.id).update({ company_id: membership.company_id }); }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('meta_connections', (t) => t.dropColumn('company_id'));
  await knex.schema.alterTable('leads', (t) => t.dropColumns('pipeline_id', 'pipeline_stage_id', 'entry_mode', 'assignment_method'));
  await knex.schema.alterTable('users', (t) => t.dropColumns('salesperson_code', 'base_state', 'base_city', 'base_pincode', 'is_available_for_leads'));
  await knex.schema.dropTableIfExists('salesperson_territories'); await knex.schema.dropTableIfExists('lead_assignment_settings'); await knex.schema.dropTableIfExists('lead_pipeline_stages'); await knex.schema.dropTableIfExists('lead_pipelines');
}
