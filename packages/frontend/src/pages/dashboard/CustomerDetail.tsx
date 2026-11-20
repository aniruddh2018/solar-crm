import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import type { Customer, Project, Invoice } from '../../types';
import { ArrowLeft, Phone, Mail, MapPin, Zap, Building2, FileText } from 'lucide-react';
import DocumentActions from '../../components/documents/DocumentActions';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/customers/${id}`).then(({ data }) => {
      setCustomer(data.customer);
      setProjects(data.projects || []);
      setInvoices(data.invoices || []);
      setDocuments(data.documents || []);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!customer) return <div className="p-8 text-center text-gray-500">Customer not found</div>;

  return (
    <div>
      <button onClick={() => navigate('/dashboard/customers')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-2xl font-bold">{customer.first_name} {customer.last_name}</h2>
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4" /> {customer.phone}</div>
              {customer.email && <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" /> {customer.email}</div>}
              <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4" /> {customer.address}</div>
              {customer.utility_company && <div className="flex items-center gap-2 text-gray-600"><Zap className="w-4 h-4" /> {customer.utility_company}</div>}
            </div>
          </div>
          <div className="card"><h3 className="font-semibold mb-3">Agreements, certificates & warranties</h3><CustomerDocumentUpload customerId={customer.id} onUploaded={(document) => setDocuments([document, ...documents])} />{documents.map((document) => <div key={document.id} className="text-sm border-t py-2 flex items-center justify-between gap-3"><div><span>{document.file_name}</span><span className="block text-gray-500 text-xs">{document.document_type.replaceAll('_', ' ')}</span></div><DocumentActions endpoint={`/customers/${customer.id}/documents/${document.id}/file`} filename={`${customer.first_name}-${customer.last_name}-${document.document_type}-${document.file_name}`} /></div>)}</div>

          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Building2 className="w-5 h-5" /> Projects</h3>
            {projects.map((p) => (
              <div key={p.id} className="border-b border-gray-100 py-3 last:border-0 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded" onClick={() => navigate(`/dashboard/projects/${p.id}`)}>
                <div className="flex justify-between">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-gray-500">{p.status.replace('_', ' ')}</span>
                </div>
                <p className="text-sm text-gray-500">${p.contract_value?.toLocaleString() || '-'} | {p.system_size_kw || '-'} kW</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText className="w-5 h-5" /> Invoices</h3>
            {invoices.map((inv) => (
              <div key={inv.id} className="border-b border-gray-100 py-2 last:border-0">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{inv.invoice_number}</span>
                  <span className="text-sm">${inv.total.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400">{inv.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerDocumentUpload({ customerId, onUploaded }: { customerId: string; onUploaded: (document: any) => void }) { const [type, setType] = useState('agreement'); const upload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const data = new FormData(); data.append('file', file); data.append('document_type', type); const result = await api.post(`/customers/${customerId}/documents`, data, { headers: { 'Content-Type': 'multipart/form-data' } }); onUploaded(result.data.document); }; return <div className="flex gap-2 mb-3"><select className="input-field text-sm" value={type} onChange={(e) => setType(e.target.value)}><option value="agreement">Customer agreement</option><option value="dcr_certificate">DCR certificate</option><option value="module_warranty">Module warranty</option><option value="inverter_warranty">Inverter warranty</option><option value="other">Other</option></select><label className="btn-secondary cursor-pointer text-sm">Upload<input className="hidden" type="file" onChange={upload} /></label></div>; }
