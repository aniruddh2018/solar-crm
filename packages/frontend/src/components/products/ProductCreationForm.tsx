import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import type { Product } from '../../types';

type Category = { id: string; slug: string; name: string };
type HsnOption = { code: string; label: string; gst_rate: number };

export default function ProductCreationForm({ onCreated, compact = false }: { onCreated: (product: Product) => void; compact?: boolean }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hsnCodes, setHsnCodes] = useState<HsnOption[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', brand: '', sku: '', category: 'panel', hsn_code: '', gst_rate: 5, unit_price: '', unit_cost: '', reorder_point: '10' });

  const loadCategories = () => api.get('/products/categories/list').then(({ data }) => setCategories(data.categories));
  useEffect(() => { loadCategories(); }, []);
  useEffect(() => {
    api.get(`/gst/hsn?category=${encodeURIComponent(form.category)}&brand=${encodeURIComponent(form.brand)}&product_name=${encodeURIComponent(form.name)}`).then(({ data }) => {
      setHsnCodes(data.hsnCodes || []);
      if (data.hsnCodes?.[0]) setForm((current) => ({ ...current, hsn_code: data.hsnCodes[0].code, gst_rate: data.hsnCodes[0].gst_rate }));
    });
  }, [form.category]);

  const addCategory = async () => {
    if (!customCategory.trim()) return;
    try { const { data } = await api.post('/products/categories', { name: customCategory }); setCategories((current) => [...current, data.category].sort((a, b) => a.name.localeCompare(b.name))); setForm({ ...form, category: data.category.slug, hsn_code: '' }); setCustomCategory(''); setShowCustomCategory(false); toast.success('Category added'); }
    catch (error: any) { toast.error(error.response?.data?.error || 'Could not add category'); }
  };
  const setHsn = (value: string) => { const match = hsnCodes.find((option) => option.code === value); setForm({ ...form, hsn_code: value, gst_rate: match?.gst_rate ?? form.gst_rate }); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const sku = form.sku.trim() || `${form.category.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
      const { data } = await api.post('/products', { ...form, sku, manufacturer: form.brand, unit_price: Number(form.unit_price || 0), unit_cost: Number(form.unit_cost || 0), reorder_point: Number(form.reorder_point || 0), quantity_in_stock: 0 });
      toast.success('Product created'); onCreated(data.product);
    } catch (error: any) { toast.error(error.response?.data?.error || 'Could not create product'); }
    finally { setSaving(false); }
  };

  return <form onSubmit={submit} className={`${compact ? 'border rounded-lg p-3' : 'card mb-6'} grid grid-cols-1 md:grid-cols-3 gap-3`}>
    <input className="input-field" placeholder="Product name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
    <input className="input-field" placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
    <input className="input-field" placeholder="SKU (auto if blank)" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
    <div className="flex gap-2"><select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, hsn_code: '' })}>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select><button className="btn-secondary whitespace-nowrap" type="button" onClick={() => setShowCustomCategory(!showCustomCategory)}>+ Category</button></div>
    {showCustomCategory && <div className="flex gap-2"><input className="input-field" autoFocus placeholder="New category name" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }} /><button type="button" className="btn-secondary" onClick={addCategory}>Add</button></div>}
    <input className="input-field" list="shared-hsn-options" placeholder="HSN code" value={form.hsn_code} onChange={(e) => setHsn(e.target.value)} required />
    <datalist id="shared-hsn-options">{hsnCodes.map((option) => <option key={option.code} value={option.code}>{option.label} — {option.gst_rate}% GST</option>)}</datalist>
    <select className="input-field" aria-label="GST rate" value={form.gst_rate} onChange={(e) => setForm({ ...form, gst_rate: Number(e.target.value) })}>
      <option value={5}>5% GST</option>
      <option value={18}>18% GST</option>
    </select>
    <input className="input-field" type="number" min="0" step="0.01" placeholder="Selling price (₹)" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} required />
    <input className="input-field" type="number" min="0" step="0.01" placeholder="Purchase cost (₹)" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} />
    <input className="input-field" type="number" min="0" placeholder="Reorder point" value={form.reorder_point} onChange={(e) => setForm({ ...form, reorder_point: e.target.value })} />
    <button className="btn-primary w-fit" disabled={saving}>{saving ? 'Creating...' : 'Create product'}</button>
  </form>;
}
