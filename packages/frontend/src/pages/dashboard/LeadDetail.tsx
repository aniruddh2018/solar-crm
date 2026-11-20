import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import type { Lead, LeadActivity } from '../../types';
import { ArrowLeft, Phone, Mail, MapPin, DollarSign, Sun, Send } from 'lucide-react';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    api.get(`/leads/${id}`).then(({ data }) => {
      setLead(data.lead);
      setActivities(data.activities);
    }).finally(() => setLoading(false));
  }, [id]);

  const addNote = async () => {
    if (!note.trim()) return;
    await api.post(`/leads/${id}/activities`, { activity_type: 'note', description: note });
    setNote('');
    const { data } = await api.get(`/leads/${id}`);
    setActivities(data.activities);
  };

  const handleConvert = async () => {
    setConverting(true);
    try {
      const { data } = await api.post(`/leads/${id}/convert`, {
        project_name: `${lead?.first_name} ${lead?.last_name} Solar Installation`,
        address: lead?.address,
      });
      navigate(`/dashboard/projects/${data.project.id}`);
    } catch {
      setConverting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!lead) return <div className="p-8 text-center text-gray-500">Lead not found</div>;

  return (
    <div>
      <button onClick={() => navigate('/dashboard/leads')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Pipeline
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{lead.first_name} {lead.last_name}</h2>
                <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                  lead.status === 'won' ? 'bg-green-100 text-green-700' :
                  lead.status === 'lost' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>{lead.status}</span>
              </div>
              {lead.status !== 'won' && lead.status !== 'lost' && (
                <button onClick={handleConvert} disabled={converting} className="btn-primary flex items-center gap-2">
                  <Sun className="w-4 h-4" /> {converting ? 'Converting...' : 'Convert to Project'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" /> {lead.phone}
              </div>
              {lead.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" /> {lead.email}
                </div>
              )}
              {lead.address && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" /> {lead.address}, {lead.city} {lead.state} {lead.zip}
                </div>
              )}
              {lead.estimated_value && (
                <div className="flex items-center gap-2 text-solar-600 font-medium">
                  <DollarSign className="w-4 h-4" /> ${lead.estimated_value.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Activity</h3>
            <div className="flex gap-2 mb-4">
              <input
                className="input-field flex-1"
                placeholder="Add a note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addNote()}
              />
              <button onClick={addNote} className="btn-primary flex items-center gap-2">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="border-l-2 border-solar-200 pl-3 py-1">
                  <p className="text-sm">{a.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {a.user_name || 'System'} — {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
              {activities.length === 0 && <p className="text-sm text-gray-400">No activity yet</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-3">Details</h3>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-gray-500">Source</dt><dd className="font-medium">{lead.source}</dd></div>
              <div><dt className="text-gray-500">Assigned To</dt><dd className="font-medium">{lead.assigned_name || '-'}</dd></div>
              <div><dt className="text-gray-500">Created</dt><dd className="font-medium">{new Date(lead.created_at).toLocaleDateString()}</dd></div>
              {lead.estimated_system_size_kw && (
                <div><dt className="text-gray-500">Est. System Size</dt><dd className="font-medium">{lead.estimated_system_size_kw} kW</dd></div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
