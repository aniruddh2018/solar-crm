import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import type { Customer } from '../../types';
import { Phone, Mail, MapPin } from 'lucide-react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const load = () => api.get('/customers').then(({ data }) => setCustomers(data.customers)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = customers.filter((c) =>
    search === '' || c.first_name.toLowerCase().includes(search.toLowerCase()) ||
    c.last_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4"><h2 className="text-2xl font-bold">Customers</h2><button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add customer</button></div>
      {showCreate && <CustomerForm onCreated={() => { setShowCreate(false); load(); }} />}
      <input className="input-field mb-6 max-w-md" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="card hover:shadow-md cursor-pointer transition-shadow" onClick={() => navigate(`/dashboard/customers/${c.id}`)}>
            <div className="w-10 h-10 bg-solar-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-solar-700 font-bold">{c.first_name[0]}{c.last_name[0]}</span>
            </div>
            <h3 className="font-semibold">{c.first_name} {c.last_name}</h3>
            {c.email && <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Mail className="w-3 h-3" /> {c.email}</p>}
            <p className="text-sm text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.city}, {c.state}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-gray-400 col-span-full text-center py-8">No customers found</p>}
      </div>
    </div>
  );
}

function CustomerForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '', address: '', city: '', state: '', state_code: '', zip: '', gstin: '', utility_company: '', avg_monthly_bill: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setSaving(true); try { await api.post('/customers', { ...form, avg_monthly_bill: form.avg_monthly_bill ? Number(form.avg_monthly_bill) : null }); toast.success('Customer created'); onCreated(); } catch (error: any) { toast.error(error.response?.data?.error || 'Could not create customer'); } finally { setSaving(false); } };
  return <form onSubmit={submit} className="card grid grid-cols-1 md:grid-cols-3 gap-3 mb-6"><input className="input-field" placeholder="First name *" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required /><input className="input-field" placeholder="Last name *" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required /><input className="input-field" placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /><input className="input-field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><input className="input-field" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /><input className="input-field" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /><input className="input-field" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /><input className="input-field" placeholder="State code (e.g. 29)" value={form.state_code} onChange={(e) => setForm({ ...form, state_code: e.target.value })} /><input className="input-field" placeholder="PIN / ZIP" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} /><input className="input-field" placeholder="GSTIN (if registered)" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} /><input className="input-field" placeholder="Utility company" value={form.utility_company} onChange={(e) => setForm({ ...form, utility_company: e.target.value })} /><input className="input-field" type="number" placeholder="Average monthly bill" value={form.avg_monthly_bill} onChange={(e) => setForm({ ...form, avg_monthly_bill: e.target.value })} /><button className="btn-primary">{saving ? 'Creating...' : 'Create customer'}</button></form>;
}
