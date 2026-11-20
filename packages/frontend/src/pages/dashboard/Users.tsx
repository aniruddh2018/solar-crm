import { useEffect, useState } from 'react';
import api from '../../api/client';
import type { User } from '../../types';
import { Plus, Shield, Ban, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchUsers = () => {
    api.get('/users').then(({ data }) => setUsers(data.users)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading users...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Users</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {showCreate && <CreateUserForm onCreated={() => { setShowCreate(false); fetchUsers(); }} onCancel={() => setShowCreate(false)} />}

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium text-gray-500">Name</th>
              <th className="text-left p-3 font-medium text-gray-500">Email</th>
              <th className="text-left p-3 font-medium text-gray-500">Role</th>
              <th className="text-center p-3 font-medium text-gray-500">Active</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="p-3 font-medium">{u.full_name}</td>
                <td className="p-3 text-gray-600">{u.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    u.role === 'sales' ? 'bg-blue-100 text-blue-700' :
                    u.role === 'installer' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{u.role}</span>
                </td>
                <td className="p-3 text-center">
                  {u.is_active ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <Ban className="w-4 h-4 text-red-400 mx-auto" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateUserForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', role: 'sales', salesperson_code: '', base_state: '', base_city: '', base_pincode: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/users', form);
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-6">
      <h3 className="font-semibold mb-4">Create User</h3>
      {error && <div className="bg-red-50 text-red-600 p-2 rounded text-sm mb-3">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input className="input-field" placeholder="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          <input className="input-field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input-field" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <input className="input-field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          {form.role === 'sales' && <><input className="input-field" placeholder="Salesperson ID / code" value={form.salesperson_code} onChange={(e) => setForm({ ...form, salesperson_code: e.target.value })} /><input className="input-field" placeholder="Base state" value={form.base_state} onChange={(e) => setForm({ ...form, base_state: e.target.value })} /><input className="input-field" placeholder="Base city / district" value={form.base_city} onChange={(e) => setForm({ ...form, base_city: e.target.value })} /><input className="input-field" placeholder="Base PIN code" value={form.base_pincode} onChange={(e) => setForm({ ...form, base_pincode: e.target.value })} /></>}
          <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="admin">Admin</option>
            <option value="sales">Sales</option>
            <option value="installer">Installer</option>
            <option value="customer">Customer</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Creating...' : 'Create User'}</button>
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
