import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import type { Invoice } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-400',
};

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/invoices').then(({ data }) => setInvoices(data.invoices)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading invoices...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Invoices</h2>
        <div className="flex gap-2"><button onClick={() => navigate('/dashboard/invoices/item/new')} className="btn-secondary">Item Invoice</button><button onClick={() => navigate('/dashboard/invoices/new')} className="btn-primary">Plant Invoice</button></div>
      </div>
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium text-gray-500">Invoice #</th>
              <th className="text-left p-3 font-medium text-gray-500">Customer</th>
              <th className="text-left p-3 font-medium text-gray-500">Status</th>
              <th className="text-right p-3 font-medium text-gray-500">Total</th>
              <th className="text-left p-3 font-medium text-gray-500">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/dashboard/invoices/${inv.id}`)}>
                <td className="p-3 font-medium">{inv.invoice_number}</td>
                <td className="p-3 text-gray-600">{inv.customer_name}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status]}`}>{inv.status}</span>
                </td>
                <td className="p-3 text-right font-medium">${inv.total.toLocaleString()}</td>
                <td className="p-3 text-gray-500">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">No invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
