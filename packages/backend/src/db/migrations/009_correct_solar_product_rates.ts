import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('products')
    .where('category', 'panel')
    .orWhereIn('hsn_code', ['85414200', '85414300', '94055040'])
    .update({ gst_rate: 5 });
}

export async function down(knex: Knex): Promise<void> {
  // Previous rates may have been user-entered, so this data correction is not reversible.
}
