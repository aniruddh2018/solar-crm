import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';

type Settings = {
  enabled: boolean; show_breakup_to_customer: boolean; material_share: number; labour_share: number;
  material_gst_rate: number; labour_gst_rate: number;
};

export default function GstSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.get('/gst/settings').then(({ data }) => setSettings(data.settings)); }, []);
  if (!settings) return <div className="p-8 text-center text-gray-500">Loading GST settings...</div>;
  const change = (key: keyof Settings, value: string | boolean) => setSettings({ ...settings, [key]: typeof value === 'string' ? Number(value) : value });
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try { const { data } = await api.patch('/gst/settings', settings); setSettings(data.settings); toast.success('GST settings saved'); }
    catch (error: any) { toast.error(error.response?.data?.error || 'Could not save GST settings'); }
    finally { setSaving(false); }
  };
  return <div className="max-w-2xl"><h2 className="text-2xl font-bold mb-2">GST Settings</h2>
    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">Use this commercial split only after confirming its applicability with your GST adviser. The standard government guidance for specified renewable-energy projects has historically used a different deemed valuation.</p>
    <form onSubmit={save} className="card space-y-5">
      <label className="flex items-center justify-between"><span><b>Enable solar GST breakup</b><small className="block text-gray-500">Apply the configured split to new plant invoices.</small></span><input type="checkbox" checked={settings.enabled} onChange={(e) => change('enabled', e.target.checked)} /></label>
      <label className="flex items-center justify-between"><span><b>Show breakup to customer</b><small className="block text-gray-500">Controls detailed material/labour lines on invoices.</small></span><input type="checkbox" checked={settings.show_breakup_to_customer} onChange={(e) => change('show_breakup_to_customer', e.target.checked)} /></label>
      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Material share %" value={settings.material_share} onChange={(v) => change('material_share', v)} />
        <NumberField label="Labour share %" value={settings.labour_share} onChange={(v) => change('labour_share', v)} />
        <NumberField label="Material GST %" value={settings.material_gst_rate} onChange={(v) => change('material_gst_rate', v)} />
        <NumberField label="Labour GST %" value={settings.labour_gst_rate} onChange={(v) => change('labour_gst_rate', v)} />
      </div>
      <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save GST Settings'}</button>
    </form>
  </div>;
}
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return <label className="text-sm font-medium text-gray-700">{label}<input className="input-field mt-1" type="number" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} required /></label>;
}
