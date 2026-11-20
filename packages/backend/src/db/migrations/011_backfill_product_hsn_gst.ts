import type { Knex } from 'knex';

const CATEGORY_DEFAULTS: Record<string, [string, number]> = {
  panel: ['85414300', 5], inverter: ['85044010', 18], battery: ['85076000', 18],
  racking: ['73089090', 18], electrical: ['85371000', 18], acdb: ['85371000', 18],
  dcdb: ['85371000', 18], cable: ['85444999', 18], connector: ['85369090', 18],
  earthing: ['73269099', 18], meter: ['90283010', 18], transformer: ['85043300', 18],
  charger: ['85044030', 18], pump: ['84137010', 18], lighting: ['94055040', 5],
  tools: ['82060090', 18], service: ['995461', 18],
};

export async function up(knex: Knex): Promise<void> {
  for (const [category, [hsnCode, gstRate]] of Object.entries(CATEGORY_DEFAULTS)) {
    await knex('products').where({ category }).where((query) => query.whereNull('hsn_code').orWhere('hsn_code', '')).update({ hsn_code: hsnCode });
    await knex('products').where({ category }).update({ gst_rate: gstRate });
  }
}

export async function down(): Promise<void> {
  // Existing values cannot be distinguished from backfilled values safely.
}
