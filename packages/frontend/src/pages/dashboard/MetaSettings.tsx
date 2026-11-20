import { useEffect, useState } from 'react';
import api from '../../api/client';

type Connection = { id: string; page_id: string; page_name: string; enabled: boolean };
type Status = { configured: boolean; redirectUri: string; webhookUrl: string; connections: Connection[] };

export default function MetaSettings() {
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState('');
  const load = () => api.get('/meta/status').then(({ data }) => setStatus(data));
  useEffect(() => { load(); const query = new URLSearchParams(window.location.search); if (query.get('connected')) setMessage('Meta account connected. Enable the Page that should import leads.'); if (query.get('error')) setMessage(`Connection failed: ${query.get('error')}`); }, []);
  const connect = async () => { const { data } = await api.get('/meta/connect'); window.location.href = data.url; };
  const toggle = async (connection: Connection) => { await api.patch(`/meta/connections/${connection.id}`, { enabled: !connection.enabled }); load(); };
  if (!status) return <div className="p-8 text-center text-gray-500">Loading Meta settings...</div>;
  return <div className="max-w-3xl"><h2 className="text-2xl font-bold mb-2">Meta Lead Ads</h2><p className="text-gray-600 mb-6">Connect your own Meta Business account. Instant Form submissions are imported as CRM leads; convert a qualified lead to create its customer and project.</p>
    {message && <p className="mb-4 rounded-lg bg-blue-50 text-blue-800 p-3 text-sm">{message}</p>}
    {!status.configured ? <div className="card"><h3 className="font-semibold">Server configuration required</h3><p className="text-sm text-gray-600 mt-2">Add your Meta App ID, App Secret, webhook verification token, and public HTTPS callback URL to the backend environment. Do not put these secrets in the browser.</p><div className="mt-4 text-sm"><p><b>OAuth callback:</b> {status.redirectUri}</p><p className="mt-1"><b>Lead Ads webhook:</b> {status.webhookUrl}</p></div></div> : <div className="card"><h3 className="font-semibold">Connect Meta Business</h3><p className="text-sm text-gray-600 mt-1">Sign in with a Meta user that administers your Facebook Page and Lead Ads.</p><button className="btn-primary mt-4" onClick={connect}>Connect Meta account</button></div>}
    <div className="card mt-6"><h3 className="font-semibold mb-3">Connected Pages</h3>{status.connections.length ? <div className="space-y-3">{status.connections.map((connection) => <div className="border rounded-lg p-3 flex justify-between items-center" key={connection.id}><div><p className="font-medium">{connection.page_name}</p><p className="text-xs text-gray-500">Page ID: {connection.page_id}</p></div><button className={connection.enabled ? 'btn-primary text-sm' : 'btn-secondary text-sm'} onClick={() => toggle(connection)}>{connection.enabled ? 'Lead import enabled' : 'Enable lead import'}</button></div>)}</div> : <p className="text-sm text-gray-500">No Pages connected yet.</p>}</div>
  </div>;
}
