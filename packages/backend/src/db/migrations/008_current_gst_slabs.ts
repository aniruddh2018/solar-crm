import { Knex } from 'knex';

/**
 * Renewable-energy devices moved from 12% to 5% on 22 September 2025.
 * This application supports the two slabs used by this solar business: 5% and 18%.
 */
export async function up(knex: Knex): Promise<void> {
  await knex('products').where('gst_rate', 12).update({ gst_rate: 5 });
  await knex('products').whereNotIn('gst_rate', [5, 18]).update({ gst_rate: 18 });
}

export async function down(knex: Knex): Promise<void> {
  // Historical product rates cannot be reconstructed safely.
}
