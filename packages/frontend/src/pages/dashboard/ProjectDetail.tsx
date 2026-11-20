import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import type { Project, ProjectMilestone, ProjectDocument, Product } from '../../types';
import { ArrowLeft, CheckCircle, Circle, Calendar, DollarSign, User, FileText, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { downloadBlob } from '../../utils/download';
import DocumentActions from '../../components/documents/DocumentActions';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProposal, setShowProposal] = useState(false);

  const fetchProject = () => {
    api.get(`/projects/${id}`).then(({ data }) => {
      setProject(data.project);
      setMilestones(data.milestones);
      setDocuments(data.documents);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProject(); }, [id]);

  const toggleMilestone = async (m: ProjectMilestone) => {
    const updated = milestones.map((ms) =>
      ms.id === m.id ? { ...ms, completed: !ms.completed } : ms
    );
    setMilestones(updated);
    await api.put(`/projects/${id}/milestones`, { milestones: updated });
    fetchProject();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', 'other');
    await api.post(`/projects/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    fetchProject();
  };

  const updateStatus = async (status: string) => {
    await api.patch(`/projects/${id}/status`, { status });
    fetchProject();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!project) return <div className="p-8 text-center text-gray-500">Project not found</div>;

  const progress = milestones.length > 0
    ? Math.round((milestones.filter((m) => m.completed).length / milestones.length) * 100)
    : 0;

  return (
    <div>
      <button onClick={() => navigate('/dashboard/projects')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{project.name}</h2>
                <p className="text-gray-500 mt-1">{project.customer_name}</p>
              </div>
              <select
                className="input-field w-auto"
                value={project.status}
                onChange={(e) => updateStatus(e.target.value)}
              >
                {['pending', 'permitting', 'scheduled', 'in_progress', 'inspection', 'completed', 'cancelled'].map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-4"><button className="btn-primary text-sm" onClick={() => navigate(`/dashboard/invoices/new?customer_id=${project.customer_id}&project_id=${project.id}`)}>Create GST invoice</button><button className="btn-secondary text-sm" onClick={() => setShowProposal(!showProposal)}>Create quotation</button></div>
            {showProposal && <ProposalForm project={project} onCreated={() => setShowProposal(false)} />}

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-solar-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Milestones</h3>
            <div className="space-y-2">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleMilestone(m)}
                >
                  {m.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300" />
                  )}
                  <span className={m.completed ? 'line-through text-gray-400' : ''}>{m.title}</span>
                  {m.due_date && <Calendar className="w-4 h-4 text-gray-400 ml-auto" />}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Documents</h3>
              <label className="cursor-pointer btn-secondary text-sm flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            {documents.length === 0 ? (
              <p className="text-sm text-gray-400">No documents uploaded</p>
            ) : (
              <div className="space-y-2">
                {documents.filter((d: any) => !d.photo_stage).map((d) => (
                  <div key={d.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm flex-1">{d.file_name}</span>
                    <DocumentActions endpoint={`/projects/${project.id}/documents/${d.id}/file`} filename={`${project.customer_name}-${project.name}-${d.file_type || 'document'}-${d.file_name}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card"><h3 className="font-semibold mb-3">Site photos - before & after installation</h3><SitePhotoUpload projectId={project.id} onUploaded={fetchProject} /><div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">{documents.filter((d: any) => d.photo_stage).map((photo: any) => <div key={photo.id} className="border rounded-lg p-2"><div className="aspect-video bg-gray-100 rounded overflow-hidden"><AuthenticatedImage endpoint={`/projects/${project.id}/documents/${photo.id}/file`} alt={`${photo.photo_stage} installation`} /></div><div className="mt-2 text-xs"><b className="capitalize">{photo.photo_stage} installation</b><div>{photo.latitude && photo.longitude ? `GPS: ${photo.latitude}, ${photo.longitude}` : 'GPS not recorded'}</div><div>{photo.captured_at ? new Date(photo.captured_at).toLocaleString('en-IN') : ''}</div><DocumentActions endpoint={`/projects/${project.id}/documents/${photo.id}/file`} filename={`${project.customer_name}-${project.name}-site-${photo.photo_stage}-${photo.file_name}`} /></div></div>)}</div></div>

          <CloseoutPanel projectId={project.id} customerName={project.customer_name || ''} />
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-3">Details</h3>
            <dl className="space-y-3 text-sm">
              {project.system_size_kw && (
                <div><dt className="text-gray-500">System Size</dt><dd className="font-medium">{project.system_size_kw} kW</dd></div>
              )}
              {project.panel_count && (
                <div><dt className="text-gray-500">Panels</dt><dd className="font-medium">{project.panel_count}</dd></div>
              )}
              {project.contract_value && (
                <div><dt className="text-gray-500">Contract Value</dt><dd className="font-medium text-solar-600">${project.contract_value.toLocaleString()}</dd></div>
              )}
              {project.deposit_amount && (
                <div><dt className="text-gray-500">Deposit</dt><dd className="font-medium">${project.deposit_amount.toLocaleString()} {project.deposit_paid ? '(Paid)' : '(Pending)'}</dd></div>
              )}
              {project.installer_name && (
                <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><dd className="font-medium">{project.installer_name}</dd></div>
              )}
              {project.permit_number && (
                <div><dt className="text-gray-500">Permit #</dt><dd className="font-medium">{project.permit_number}</dd></div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthenticatedImage({ endpoint, alt }: { endpoint: string; alt: string }) { const [url, setUrl] = useState(''); useEffect(() => { let objectUrl = ''; api.get(endpoint, { responseType: 'blob' }).then(({ data }) => { objectUrl = URL.createObjectURL(data); setUrl(objectUrl); }); return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }; }, [endpoint]); return url ? <img src={url} alt={alt} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Loading photo...</div>; }

function SitePhotoUpload({ projectId, onUploaded }: { projectId: string; onUploaded: () => void }) {
  const [stage, setStage] = useState('before'); const [location, setLocation] = useState({ latitude: '', longitude: '' }); const [locating, setLocating] = useState(false);
  const captureGps = () => { if (!navigator.geolocation) { toast.error('GPS is not available in this browser'); return; } setLocating(true); navigator.geolocation.getCurrentPosition((position) => { setLocation({ latitude: position.coords.latitude.toFixed(7), longitude: position.coords.longitude.toFixed(7) }); setLocating(false); toast.success('GPS location captured'); }, () => { setLocating(false); toast.error('Location permission was denied; coordinates can be entered manually'); }, { enableHighAccuracy: true, timeout: 15000 }); };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const body = new FormData(); body.append('file', file); body.append('file_type', `site_photo_${stage}`); body.append('photo_stage', stage); body.append('latitude', location.latitude); body.append('longitude', location.longitude); body.append('captured_at', new Date().toISOString()); try { await api.post(`/projects/${projectId}/documents`, body, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success(`${stage} installation photo uploaded`); onUploaded(); event.target.value = ''; } catch { toast.error('Could not upload site photo'); } };
  return <div className="space-y-2"><div className="flex flex-wrap gap-2"><select className="input-field w-auto" value={stage} onChange={(e) => setStage(e.target.value)}><option value="before">Before installation</option><option value="after">After installation</option></select><button type="button" className="btn-secondary" onClick={captureGps}>{locating ? 'Getting GPS...' : 'Capture current GPS'}</button><label className="btn-primary cursor-pointer">Take / choose photo<input className="hidden" type="file" accept="image/*" capture="environment" onChange={upload} /></label></div><div className="grid grid-cols-2 gap-2"><input className="input-field text-sm" placeholder="Latitude" value={location.latitude} onChange={(e) => setLocation({ ...location, latitude: e.target.value })} /><input className="input-field text-sm" placeholder="Longitude" value={location.longitude} onChange={(e) => setLocation({ ...location, longitude: e.target.value })} /></div><p className="text-xs text-gray-500">Capture GPS first, then take or select a normal photo. The coordinates and capture time will be stored with it.</p></div>;
}

function CloseoutPanel({ projectId, customerName }: { projectId: string; customerName: string }) {
  const [data, setData] = useState<any>({ materials: [], serials: [], reports: [] }); const [products, setProducts] = useState<Product[]>([]);
  const [serialForm, setSerialForm] = useState({ panel_product_id: '', inverter_product_id: '', panel_serials: '', inverter_serials: '' });
  const [report, setReport] = useState({ report_type: 'work_completion', report_date: new Date().toISOString().slice(0, 10), consumer_number: '', meter_number: '', dcr_number: '', inspector_name: '', customer_signatory: customerName, inspection_results: '', remarks: '' });
  const load = () => api.get(`/projects/${projectId}/closeout`).then(({ data }) => { setData(data); setReport((current) => ({ ...current, dcr_number: current.dcr_number || data.dcr_number || '' })); });
  useEffect(() => { load(); api.get('/products').then(({ data }) => setProducts(data.products)); }, [projectId]);
  const saveSerials = async () => { try { await api.post(`/projects/${projectId}/serials`, { panel_product_id: serialForm.panel_product_id, inverter_product_id: serialForm.inverter_product_id, panel_serials: serialForm.panel_serials.split(/\n|,/).map((s) => s.trim()).filter(Boolean), inverter_serials: serialForm.inverter_serials.split(/\n|,/).map((s) => s.trim()).filter(Boolean) }); toast.success('Serial numbers assigned'); setSerialForm((current) => ({ ...current, panel_serials: '', inverter_serials: '' })); load(); } catch (error: any) { toast.error(error.response?.data?.error || 'Could not save serial numbers'); } };
  const createReport = async () => { try { const { data } = await api.post(`/projects/${projectId}/reports`, report); const pdf = await api.get(`/projects/${projectId}/reports/${data.report.id}/pdf`, { responseType: 'blob' }); downloadBlob(pdf.data, `${report.report_type}-${data.report.report_date}.pdf`); toast.success('Report generated and downloaded'); load(); } catch (error: any) { toast.error(error.response?.data?.error || 'Could not generate report'); } };
  const openReport = async (id: string, reportType: string, reportDate: string) => { try { const pdf = await api.get(`/projects/${projectId}/reports/${id}/pdf`, { responseType: 'blob' }); downloadBlob(pdf.data, `${reportType}-${reportDate}.pdf`); } catch (error: any) { toast.error(error.response?.data?.error || 'Could not download report'); } };
  return <div className="card space-y-5"><h3 className="font-semibold">Completion & Joint Inspection</h3>
    <div><h4 className="text-sm font-semibold mb-2">Materials used</h4>{data.materials.length ? data.materials.map((m: any) => <div className="text-sm flex justify-between border-b py-1" key={m.product_id}><span>{m.brand} {m.name} · HSN {m.hsn_code || '—'}</span><span>Qty {m.quantity}</span></div>) : <p className="text-sm text-gray-500">Materials appear here after a plant invoice consumes inventory.</p>}</div>
    <div className="border-t pt-4"><h4 className="text-sm font-semibold mb-2">Panel and inverter serial numbers</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><select className="input-field mb-2" value={serialForm.panel_product_id} onChange={(e) => setSerialForm({ ...serialForm, panel_product_id: e.target.value })}><option value="">Select panel model</option>{products.filter((p) => p.category === 'panel').map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><textarea className="input-field min-h-24" placeholder="Panel serials - one per line" value={serialForm.panel_serials} onChange={(e) => setSerialForm({ ...serialForm, panel_serials: e.target.value })} /></div><div><select className="input-field mb-2" value={serialForm.inverter_product_id} onChange={(e) => setSerialForm({ ...serialForm, inverter_product_id: e.target.value })}><option value="">Select inverter model</option>{products.filter((p) => p.category === 'inverter').map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><textarea className="input-field min-h-24" placeholder="Inverter serials - one per line" value={serialForm.inverter_serials} onChange={(e) => setSerialForm({ ...serialForm, inverter_serials: e.target.value })} /></div></div><button type="button" className="btn-secondary mt-2" onClick={saveSerials}>Save serial numbers</button>{data.serials.length > 0 && <div className="mt-2 text-xs text-gray-600">{data.serials.map((s: any) => <span key={s.id} className="inline-block bg-gray-100 rounded px-2 py-1 mr-1 mb-1">{s.category}: {s.serial_number}</span>)}</div>}</div>
    <div className="border-t pt-4"><h4 className="text-sm font-semibold mb-2">Generate report</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-2"><select className="input-field" value={report.report_type} onChange={(e) => setReport({ ...report, report_type: e.target.value })}><option value="work_completion">Work Completion Report</option><option value="joint_inspection">Joint Inspection Report</option></select><input className="input-field" type="date" value={report.report_date} onChange={(e) => setReport({ ...report, report_date: e.target.value })} /><input className="input-field" placeholder="Consumer number" value={report.consumer_number} onChange={(e) => setReport({ ...report, consumer_number: e.target.value })} /><input className="input-field" placeholder="Meter number" value={report.meter_number} onChange={(e) => setReport({ ...report, meter_number: e.target.value })} />{report.report_type === 'work_completion' && <label className="text-xs text-gray-500">DCR number {data.dcr_document?.file_name && <span>(extracted from {data.dcr_document.file_name})</span>}<input className="input-field mt-1" placeholder="DCR certificate number" value={report.dcr_number} onChange={(e) => setReport({ ...report, dcr_number: e.target.value.toUpperCase() })} /></label>}<input className="input-field" placeholder="Inspector / installer name" value={report.inspector_name} onChange={(e) => setReport({ ...report, inspector_name: e.target.value })} /><input className="input-field" placeholder="Customer signatory" value={report.customer_signatory} onChange={(e) => setReport({ ...report, customer_signatory: e.target.value })} /><textarea className="input-field md:col-span-2" placeholder="Inspection findings / completion notes" value={report.inspection_results} onChange={(e) => setReport({ ...report, inspection_results: e.target.value })} /></div><button type="button" className="btn-primary mt-2" onClick={createReport}>Generate & download PDF</button>{data.reports.length > 0 && <div className="mt-3 space-y-1">{data.reports.map((r: any) => <button type="button" className="block text-sm text-solar-700" key={r.id} onClick={() => openReport(r.id, r.report_type, r.report_date)}>Download {r.report_type.replaceAll('_', ' ')} · {r.report_date}</button>)}</div>}</div>
  </div>;
}

function ProposalForm({ project, onCreated }: { project: Project; onCreated: () => void }) {
  const [form, setForm] = useState({ title: `${project.name} Solar Proposal`, plant_price: String(project.contract_value || ''), system_size_kw: String(project.system_size_kw || ''), scope_of_work: 'Supply, installation, testing and commissioning of the solar power plant.', valid_until: '' });
  useEffect(() => { if (!project.system_size_kw) return; api.get(`/proposals/suggestion?system_size_kw=${project.system_size_kw}`).then(({ data }) => setForm((current) => ({ ...current, plant_price: current.plant_price || String(data.suggested_price), scope_of_work: data.default_scope || current.scope_of_work }))); }, [project.system_size_kw]);
  const submit = async (e: React.FormEvent) => { e.preventDefault(); try { const { data } = await api.post('/proposals', { ...form, project_id: project.id, plant_price: Number(form.plant_price), system_size_kw: form.system_size_kw ? Number(form.system_size_kw) : null }); const pdf = await api.get(`/proposals/${data.proposal.id}/pdf`, { responseType: 'blob' }); downloadBlob(pdf.data, `quotation-${project.name}.pdf`); toast.success('Quotation created and downloaded'); onCreated(); } catch (error: any) { toast.error(error.response?.data?.error || 'Could not create quotation'); } };
  return <form onSubmit={submit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2"><input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /><input className="input-field" type="number" placeholder="Customer total (₹)" value={form.plant_price} onChange={(e) => setForm({ ...form, plant_price: e.target.value })} required /><input className="input-field" type="number" placeholder="System size kW" value={form.system_size_kw} onChange={(e) => setForm({ ...form, system_size_kw: e.target.value })} /><input className="input-field" type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /><textarea className="input-field md:col-span-2" value={form.scope_of_work} onChange={(e) => setForm({ ...form, scope_of_work: e.target.value })} /><button className="btn-primary w-fit">Save & download PDF proposal</button></form>;
}
