import type { Knex } from 'knex';

export const config = { transaction: false };

const DEFAULT_CATEGORIES = [
  ['panel', 'Solar Panel / PV Module'], ['inverter', 'Solar Inverter'], ['battery', 'Battery / Energy Storage'],
  ['racking', 'Mounting Structure / Racking'], ['electrical', 'Electrical & Protection'], ['acdb', 'ACDB'],
  ['dcdb', 'DCDB'], ['cable', 'Solar Cable / Wire'], ['connector', 'MC4 & Connectors'],
  ['earthing', 'Earthing & Lightning Protection'], ['meter', 'Meters & Monitoring'], ['transformer', 'Transformer'],
  ['charger', 'EV / Battery Charger'], ['pump', 'Solar Pump'], ['lighting', 'Solar Lighting'],
  ['tools', 'Tools & Consumables'], ['service', 'Services'], ['other', 'Other'],
];

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('product_categories', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'));
    t.string('slug', 100).notNullable().unique(); t.string('name', 150).notNullable();
    t.boolean('is_system').notNullable().defaultTo(false); t.timestamp('created_at').defaultTo(knex.fn.now());
  });
  await knex('product_categories').insert(DEFAULT_CATEGORIES.map(([slug, name]) => ({ slug, name, is_system: true })));
  // Knex rebuilds the SQLite table to remove its enum check. Foreign keys must
  // be disabled outside a transaction while the referenced table is replaced.
  await knex.raw('PRAGMA foreign_keys = OFF');
  try { await knex.schema.alterTable('products', (t) => t.string('category', 100).notNullable().alter()); }
  finally { await knex.raw('PRAGMA foreign_keys = ON'); }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('product_categories');
}
