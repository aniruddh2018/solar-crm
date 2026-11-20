import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import type { Project } from '../../types';
import type { Customer } from '../../types';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  permitting: 'bg-yellow-100 text-yellow-700',
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  inspection: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const load = () => api.get('/projects').then(({ data }) => setProjects(data.projects)).finally(() => setLoading(false));
  useEffect(() => { load(); api.get('/customers').then(({ data }) => setCustomers(data.customers)); }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading projects...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold">Projects</h2><button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(!showCreate)}><Plus className="w-4 h-4" /> Add project</button></div>
      {showCreate && <ProjectForm customers={customers} onCreated={(project) => { setShowCreate(false); load(); navigate(`/dashboard/projects/${project.id}`); }} />}
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium text-gray-500">Project</th>
              <th className="text-left p-3 font-medium text-gray-500">Customer</th>
              <th className="text-left p-3 font-medium text-gray-500">Status</th>
              <th className="text-left p-3 font-medium text-gray-500">Size</th>
              <th className="text-right p-3 font-medium text-gray-500">Value</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/dashboard/projects/${p.id}`)}>
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-gray-600">{p.customer_name}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-3 text-gray-600">{p.system_size_kw ? `${p.system_size_kw} kW` : '-'}</td>
                <td className="p-3 text-right font-medium">${p.contract_value?.toLocaleString() || '-'}</td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">No projects found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectForm({ customers, onCreated }: { customers: Customer[]; onCreated: (project: Project) => void }) {
  const [form, setForm] = useState({ customer_id: '', name: '', system_size_kw: '', panel_count: '', contract_value: '', scheduled_date: '', notes: '' });
  const submit = async (e: React.FormEvent) => { e.preventDefault(); try { const { data } = await api.post('/projects', { ...form, system_size_kw: form.system_size_kw ? Number(form.system_size_kw) : null, panel_count: form.panel_count ? Number(form.panel_count) : null, contract_value: form.contract_value ? Number(form.contract_value) : null }); toast.success('Project created with default milestones'); onCreated(data.project); } catch (error: any) { toast.error(error.response?.data?.error || 'Could not create project'); } };
  return <form onSubmit={submit} className="card mb-6 grid grid-cols-1 md:grid-cols-3 gap-3"><select className="input-field" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} required><option value="">Customer *</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}</select><input className="input-field" placeholder="Project name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /><input className="input-field" type="number" placeholder="System size (kW)" value={form.system_size_kw} onChange={(e) => setForm({ ...form, system_size_kw: e.target.value })} /><input className="input-field" type="number" placeholder="Panel count" value={form.panel_count} onChange={(e) => setForm({ ...form, panel_count: e.target.value })} /><input className="input-field" type="number" placeholder="Contract value (₹)" value={form.contract_value} onChange={(e) => setForm({ ...form, contract_value: e.target.value })} /><input className="input-field" type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} /><input className="input-field md:col-span-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /><button className="btn-primary">Create project</button></form>;
}
