import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import type { Product } from '../../types';
import { Plus, Package, AlertTriangle } from 'lucide-react';
import ProductCreationForm from '../../components/products/ProductCreationForm';

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showProduct, setShowProduct] = useState(false);
  const [showSupplier, setShowSupplier] = useState(false);
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const loadProducts = () => api.get('/products').then(({ data }) => setProducts(data.products)).finally(() => setLoading(false));

  useEffect(() => { loadProducts(); api.get('/suppliers').then(({ data }) => setSuppliers(data.suppliers)); }, []);

  const filtered = products.filter((p) => {
    if (filter && p.category !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const categories = Array.from(new Set(products.map((product) => product.category))).sort();

  if (loading) return <div className="p-8 text-center text-gray-500">Loading inventory...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4"><h2 className="text-2xl font-bold">Inventory</h2><div className="flex gap-2"><button className="btn-secondary" onClick={() => setShowSupplier(!showSupplier)}>Add supplier</button><button className="btn-primary flex items-center gap-2" onClick={() => setShowProduct(!showProduct)}><Plus className="w-4 h-4" /> Add product</button></div></div>
      {showSupplier && <SupplierForm onComplete={(supplier) => { setSuppliers([...suppliers, supplier]); setShowSupplier(false); }} />}
      {showProduct && <ProductCreationForm onCreated={() => { setShowProduct(false); loadProducts(); }} />}
      <div className="flex gap-4 mb-6">
        <input className="input-field max-w-xs" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input-field max-w-[200px]" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium text-gray-500">Product</th>
              <th className="text-left p-3 font-medium text-gray-500">SKU</th>
              <th className="text-left p-3 font-medium text-gray-500">Category / HSN</th>
              <th className="text-right p-3 font-medium text-gray-500">Price</th>
              <th className="text-center p-3 font-medium text-gray-500">Stock</th>
              <th className="text-left p-3 font-medium text-gray-500">Active batches</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-3 font-medium flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" /> {p.name}
                </td>
                <td className="p-3 text-gray-500">{p.sku}</td>
                <td className="p-3"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{p.category}</span><span className="block text-xs text-gray-500 mt-1">{p.hsn_code || 'HSN not set'}</span></td>
                <td className="p-3 text-right">₹{p.unit_price.toLocaleString('en-IN')}</td>
                <td className="p-3 text-center">
                  <span className={`font-medium ${p.quantity_in_stock <= p.reorder_point ? 'text-red-600 flex items-center justify-center gap-1' : ''}`}>
                    {p.quantity_in_stock <= p.reorder_point && <AlertTriangle className="w-3 h-3" />}
                    {p.quantity_in_stock}
                  </span>
                </td>
                <td className="p-3 text-xs">{p.batches?.length ? p.batches.map((batch) => <div key={batch.id}>{batch.batch_number}: {batch.quantity_remaining} @ ₹{Number(batch.unit_cost).toLocaleString('en-IN')}</div>) : '—'}</td>
                <td className="p-3"><button className="text-solar-600 text-xs font-medium" onClick={() => setMovementProduct(p)}>Buy / Sell</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {movementProduct && <MovementForm product={movementProduct} suppliers={suppliers} onComplete={() => { setMovementProduct(null); loadProducts(); }} onClose={() => setMovementProduct(null)} />}
    </div>
  );
}

function SupplierForm({ onComplete }: { onComplete: (supplier: any) => void }) { const [form, setForm] = useState({ name: '', contact_name: '', phone: '', email: '', gstin: '' }); const submit = async (e: React.FormEvent) => { e.preventDefault(); try { const { data } = await api.post('/suppliers', form); toast.success('Supplier added'); onComplete(data.supplier); } catch (error: any) { toast.error(error.response?.data?.error || 'Could not add supplier'); } }; return <form onSubmit={submit} className="card mb-4 grid grid-cols-1 md:grid-cols-3 gap-2"><input className="input-field" placeholder="Supplier name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /><input className="input-field" placeholder="Contact person" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /><input className="input-field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><input className="input-field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><input className="input-field" placeholder="GSTIN" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /><button className="btn-primary">Save supplier</button></form>; }

function MovementForm({ product, suppliers, onComplete, onClose }: { product: Product; suppliers: any[]; onComplete: () => void; onClose: () => void }) {
  const [form, setForm] = useState({ transaction_type: 'purchase', quantity: '', unit_cost: String(product.unit_cost || ''), party_name: '', supplier_id: '', reference: '' });
  const submit = async (e: React.FormEvent) => { e.preventDefault(); try { await api.post(`/products/${product.id}/transactions`, { ...form, quantity: Number(form.quantity), unit_cost: Number(form.unit_cost || 0) }); toast.success('Stock updated'); onComplete(); } catch (error: any) { toast.error(error.response?.data?.error || 'Could not update stock'); } };
  return <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"><form onSubmit={submit} className="card w-full max-w-md space-y-3"><div className="flex justify-between"><h3 className="font-bold">Stock movement: {product.name}</h3><button type="button" onClick={onClose}>×</button></div><select className="input-field" value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}><option value="purchase">Purchase / receive stock</option><option value="sale">Sale / issue stock</option><option value="adjustment">Stock adjustment</option></select>{form.transaction_type === 'purchase' && <select className="input-field" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}><option value="">Select supplier</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}<input className="input-field" type="number" min="1" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /><input className="input-field" type="number" step="0.01" placeholder="Unit cost (₹)" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} /><input className="input-field" placeholder="Supplier / customer" value={form.party_name} onChange={(e) => setForm({ ...form, party_name: e.target.value })} /><input className="input-field" placeholder="Reference / PO / invoice" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /><button className="btn-primary w-full">Save movement</button></form></div>;
}
