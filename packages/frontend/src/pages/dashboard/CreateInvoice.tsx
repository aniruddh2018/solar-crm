import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/client';
import type { Customer } from '../../types';
import type { Product } from '../../types';

type GstSettings = { enabled: boolean; material_share: number; labour_share: number; material_gst_rate: number; labour_gst_rate: number };
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState([{ product_id: '', quantity: 1 }]);
  const [settings, setSettings] = useState<GstSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customer_id: searchParams.get('customer_id') || '', project_id: searchParams.get('project_id') || '', gross_total: '', plant_description: 'Solar power plant', due_date: '', gst_enabled: true, price_includes_gst: true });
  useEffect(() => {
    api.get('/customers').then(({ data }) => setCustomers(data.customers));
    api.get('/products').then(({ data }) => setProducts(data.products));
    api.get('/gst/settings').then(({ data }) => { setSettings(data.settings); setForm((current) => ({ ...current, gst_enabled: data.settings.enabled })); });
  }, []);
  const preview = useMemo(() => {
    if (!settings || !form.gst_enabled || !Number(form.gross_total)) return null;
    const multiplier = settings.material_share / 100 * (1 + settings.material_gst_rate / 100) + settings.labour_share / 100 * (1 + settings.labour_gst_rate / 100);
    const base = form.price_includes_gst ? Number(form.gross_total) / multiplier : Number(form.gross_total);
    const materialBase = base * settings.material_share / 100;
    const labourBase = base * settings.labour_share / 100;
    return { materialBase, materialGst: materialBase * settings.material_gst_rate / 100, labourBase, labourGst: labourBase * settings.labour_gst_rate / 100, total: form.price_includes_gst ? Number(form.gross_total) : base * multiplier };
  }, [form, settings]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const material_usage = materials.filter((m) => m.product_id && m.quantity > 0);
      const { data } = await api.post('/invoices', { ...form, gross_total: Number(form.gross_total), invoice_type: 'plant', material_usage });
      toast.success('GST invoice created'); navigate(`/dashboard/invoices/${data.invoice.id}`);
    } catch (error: any) { toast.error(error.response?.data?.error || 'Could not create invoice'); }
    finally { setSaving(false); }
  };
  return <div className="max-w-3xl"><button onClick={() => navigate('/dashboard/invoices')} className="text-sm text-gray-600 mb-4">← Back to invoices</button><h2 className="text-2xl font-bold mb-6">Create plant invoice</h2>
    <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card space-y-4">
        <label className="block text-sm font-medium">Customer<select className="input-field mt-1" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} required><option value="">Select customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}</select></label>
        <label className="block text-sm font-medium">Plant description<input className="input-field mt-1" value={form.plant_description} onChange={(e) => setForm({ ...form, plant_description: e.target.value })} required /></label>
        <label className="block text-sm font-medium">Amount charged to customer (₹)<input className="input-field mt-1" type="number" min="0.01" step="0.01" value={form.gross_total} onChange={(e) => setForm({ ...form, gross_total: e.target.value })} required /></label>
        <label className="block text-sm font-medium">Due date<input className="input-field mt-1" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></label>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.gst_enabled} onChange={(e) => setForm({ ...form, gst_enabled: e.target.checked })} />Apply solar GST breakup</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.price_includes_gst} onChange={(e) => setForm({ ...form, price_includes_gst: e.target.checked })} />Amount already includes GST</label>
        <div className="border-t pt-4"><p className="text-sm font-semibold mb-2">Material build (internal inventory only)</p><p className="text-xs text-gray-500 mb-2">These products are deducted from stock but are not shown on the customer plant invoice.</p>{materials.map((material, index) => <div className="flex gap-2 mb-2" key={index}><select className="input-field" value={material.product_id} onChange={(e) => setMaterials(materials.map((m, i) => i === index ? { ...m, product_id: e.target.value } : m))}><option value="">Select material</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock: {p.quantity_in_stock})</option>)}</select><input className="input-field w-24" type="number" min="1" value={material.quantity} onChange={(e) => setMaterials(materials.map((m, i) => i === index ? { ...m, quantity: Number(e.target.value) } : m))} /><button type="button" className="btn-secondary" onClick={() => setMaterials(materials.filter((_, i) => i !== index))}>×</button></div>)}<button type="button" className="text-sm text-solar-700 font-medium" onClick={() => setMaterials([...materials, { product_id: '', quantity: 1 }])}>+ Add material used</button></div>
        <button className="btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create invoice'}</button>
      </div>
      <div className="card"><h3 className="font-semibold mb-4">GST calculation</h3>{preview ? <div className="space-y-3 text-sm"><Break label={`Material base (${settings?.material_share}%)`} amount={preview.materialBase} /><Break label={`Material GST (${settings?.material_gst_rate}%)`} amount={preview.materialGst} /><Break label={`Labour base (${settings?.labour_share}%)`} amount={preview.labourBase} /><Break label={`Labour GST (${settings?.labour_gst_rate}%)`} amount={preview.labourGst} /><Break label="Customer total" amount={preview.total} strong /></div> : <p className="text-sm text-gray-500">Enter a price and enable GST to preview the split.</p>}</div>
    </form></div>;
}
function Break({ label, amount, strong = false }: { label: string; amount: number; strong?: boolean }) { return <div className={`flex justify-between ${strong ? 'border-t pt-3 font-bold text-base' : ''}`}><span>{label}</span><span>{inr.format(amount)}</span></div>; }
