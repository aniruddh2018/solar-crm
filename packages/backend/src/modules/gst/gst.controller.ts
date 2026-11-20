import { Request, Response } from 'express';
import db from '../../db/connection';

const SOLAR_HSN: Record<string, { code: string; label: string; gst_rate: number; keywords: string[] }[]> = {
  panel: [
    { code: '85414300', label: 'Photovoltaic cells assembled in modules or made up into panels', gst_rate: 5, keywords: ['module', 'panel', 'pv', 'mono', 'bifacial'] },
    { code: '85414200', label: 'Photovoltaic cells not assembled in modules or made up into panels', gst_rate: 5, keywords: ['cell', 'solar cell'] },
  ],
  inverter: [{ code: '85044010', label: 'Electric inverter / static converter', gst_rate: 18, keywords: ['inverter', 'string inverter', 'microinverter'] }, { code: '85044090', label: 'Other static converters / solar controller', gst_rate: 18, keywords: ['controller', 'optimizer', 'converter'] }],
  battery: [
    { code: '85076000', label: 'Lithium-ion accumulators', gst_rate: 18, keywords: ['lithium', 'li-ion', 'lifepo4', 'storage'] },
    { code: '85072000', label: 'Other lead-acid accumulators', gst_rate: 18, keywords: ['lead acid', 'tubular'] },
  ],
  racking: [
    { code: '73089090', label: 'Iron or steel mounting structures', gst_rate: 18, keywords: ['steel', 'gi', 'mount', 'structure'] },
    { code: '76109090', label: 'Aluminium mounting structures', gst_rate: 18, keywords: ['aluminium', 'aluminum', 'rail', 'mount'] },
  ],
  electrical: [
    { code: '85444999', label: 'Insulated electric conductors / solar cable', gst_rate: 18, keywords: ['cable', 'wire', 'dc cable', 'ac cable'] },
    { code: '85371000', label: 'Electrical control panels', gst_rate: 18, keywords: ['acdb', 'dcdb', 'panel', 'distribution'] },
    { code: '85365090', label: 'Electrical switches, isolators and protection', gst_rate: 18, keywords: ['mcb', 'mccb', 'isolator', 'switch', 'spd'] },
  ],
  acdb: [{ code: '85371000', label: 'AC distribution/control board, voltage not exceeding 1,000 V', gst_rate: 18, keywords: ['acdb', 'ac box', 'distribution board'] }],
  dcdb: [{ code: '85371000', label: 'DC distribution/control board, voltage not exceeding 1,000 V', gst_rate: 18, keywords: ['dcdb', 'dc box', 'combiner box'] }],
  cable: [
    { code: '85444999', label: 'Other insulated electric conductor, voltage not exceeding 1,000 V', gst_rate: 18, keywords: ['solar cable', 'dc cable', 'ac cable', 'wire'] },
    { code: '85446090', label: 'Other insulated electric conductor, voltage exceeding 1,000 V', gst_rate: 18, keywords: ['ht cable', 'high voltage'] },
  ],
  connector: [{ code: '85369090', label: 'Other electrical apparatus for making connections, not exceeding 1,000 V (including MC4)', gst_rate: 18, keywords: ['mc4', 'connector', 'terminal', 'junction'] }],
  earthing: [
    { code: '85363000', label: 'Electrical circuit protection apparatus, not exceeding 1,000 V', gst_rate: 18, keywords: ['surge protection', 'spd', 'lightning protection'] },
    { code: '73269099', label: 'Other articles of iron or steel (including earthing hardware)', gst_rate: 18, keywords: ['earthing electrode', 'earth rod', 'earthing'] },
  ],
  meter: [
    { code: '90283010', label: 'Electricity meters for alternating current', gst_rate: 18, keywords: ['energy meter', 'net meter', 'electricity meter'] },
    { code: '90328990', label: 'Other automatic regulating or controlling instruments', gst_rate: 18, keywords: ['monitoring', 'logger', 'controller'] },
  ],
  transformer: [{ code: '85043300', label: 'Other transformers, power handling capacity 16–500 kVA', gst_rate: 18, keywords: ['transformer'] }, { code: '85043400', label: 'Other transformers, power handling capacity above 500 kVA', gst_rate: 18, keywords: ['transformer'] }],
  charger: [{ code: '85044030', label: 'Battery chargers / static converters', gst_rate: 18, keywords: ['charger', 'battery charger', 'ev charger'] }],
  pump: [{ code: '84137010', label: 'Standalone centrifugal/water pump', gst_rate: 18, keywords: ['water pump', 'centrifugal pump', 'pump only'] }, { code: '8413', label: 'Complete solar water pumping system (classification depends on supplied system)', gst_rate: 5, keywords: ['solar pumping system', 'complete system'] }],
  lighting: [{ code: '94055040', label: 'Solar home lighting system', gst_rate: 5, keywords: ['solar light', 'solar lamp', 'lantern'] }],
  tools: [{ code: '82060090', label: 'Sets of two or more hand tools', gst_rate: 18, keywords: ['tool kit', 'tools'] }],
  service: [{ code: '995461', label: 'Electrical installation services (SAC)', gst_rate: 18, keywords: ['installation', 'commissioning', 'service', 'labour'] }],
};

export async function getGstSettings(_req: Request, res: Response): Promise<void> {
  const settings = await db('gst_settings').where('id', 1).first();
  res.json({ settings });
}

export async function updateGstSettings(req: Request, res: Response): Promise<void> {
  const allowed = ['enabled', 'show_breakup_to_customer', 'material_share', 'labour_share', 'material_gst_rate', 'labour_gst_rate'];
  const data = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const material = Number(data.material_share ?? (await db('gst_settings').where('id', 1).first()).material_share);
  const labour = Number(data.labour_share ?? (await db('gst_settings').where('id', 1).first()).labour_share);
  if (Math.round((material + labour) * 100) !== 10000) {
    res.status(400).json({ error: 'Material and labour shares must add up to 100%' });
    return;
  }
  const [settings] = await db('gst_settings').where('id', 1).update({ ...data, updated_at: db.fn.now() }).returning('*');
  res.json({ settings });
}

export function listSolarHsn(req: Request, res: Response): void {
  const category = String(req.query.category || '');
  const query = `${req.query.brand || ''} ${req.query.product_name || ''}`.toLowerCase();
  // Never fall back to a different product category: that previously allowed a
  // cable or custom item to inherit the first panel HSN and its 5% rate.
  const options = category ? (SOLAR_HSN[category] || []) : Object.values(SOLAR_HSN).flat();
  const hsnCodes = query ? [...options].sort((a, b) => Number(b.keywords.some((word) => query.includes(word))) - Number(a.keywords.some((word) => query.includes(word)))) : options;
  res.json({ hsnCodes, brand: req.query.brand || null });
}
