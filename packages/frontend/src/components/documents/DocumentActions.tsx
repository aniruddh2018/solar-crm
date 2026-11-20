import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { downloadBlob } from '../../utils/download';

export default function DocumentActions({ endpoint, filename }: { endpoint: string; filename: string }) {
  const [preview, setPreview] = useState<{ url: string; type: string } | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  const view = async () => { try { const { data } = await api.get(endpoint, { responseType: 'blob' }); const blob = data instanceof Blob ? data : new Blob([data]); setPreview({ url: URL.createObjectURL(blob), type: blob.type }); } catch { toast.error('Could not open document'); } };
  const download = async () => { try { const { data } = await api.get(`${endpoint}?download=1`, { responseType: 'blob' }); downloadBlob(data, filename); } catch { toast.error('Could not download document'); } };
  return <><div className="flex gap-3"><button type="button" className="text-solar-700 text-xs font-medium" onClick={view}>View</button><button type="button" className="text-solar-700 text-xs font-medium" onClick={download}>Download</button></div>{preview && <div className="fixed inset-0 z-50 bg-black/70 p-4 flex flex-col"><div className="bg-white rounded-t-lg px-4 py-2 flex justify-between"><span className="font-medium truncate">{filename}</span><button type="button" onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }}>Close</button></div><div className="bg-gray-100 rounded-b-lg flex-1 min-h-0 flex items-center justify-center">{preview.type.startsWith('image/') ? <img src={preview.url} className="max-w-full max-h-full object-contain" /> : <iframe src={preview.url} title={filename} className="w-full h-full border-0" />}</div></div>}</>;
}
