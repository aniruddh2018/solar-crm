import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Sun, Building2, FileText, DollarSign } from 'lucide-react';
import type { DashboardStats } from '../../types';

export default function PortalHome() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    api.get('/projects').then(({ data }) => setProjects(data.projects || []));
    api.get('/invoices').then(({ data }) => setInvoices(data.invoices || []));
  }, []);

  const activeProjects = projects.filter((p: any) => !['completed', 'cancelled'].includes(p.status));
  const pendingInvoices = invoices.filter((i: any) => !['paid', 'cancelled'].includes(i.status));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome, {user?.full_name}</h1>
      <p className="text-gray-500 mb-8">Here's an overview of your solar projects and account.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active Projects', value: activeProjects.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Invoices', value: pendingInvoices.length, icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Total Invested', value: `$${projects.reduce((s: number, p: any) => s + (p.contract_value || 0), 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`p-3 rounded-lg ${bg}`}><Icon className={`w-6 h-6 ${color}`} /></div>
            <div><p className="text-sm text-gray-500">{label}</p><p className="text-xl font-bold">{value}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Building2 className="w-5 h-5" /> Your Projects</h3>
          {projects.length === 0 ? (
            <p className="text-gray-400 text-sm">No projects yet.</p>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.system_size_kw} kW system</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>{p.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Recent Invoices</h3>
          {invoices.length === 0 ? (
            <p className="text-gray-400 text-sm">No invoices yet.</p>
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 5).map((i: any) => (
                <div key={i.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{i.invoice_number}</p>
                    <p className="text-xs text-gray-500">Due: {i.due_date ? new Date(i.due_date).toLocaleDateString() : '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">${i.total.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      i.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{i.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
