import { useEffect, useState } from 'react';
import api from '../../api/client';
import type { Invoice } from '../../types';

export default function PortalInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/invoices').then(({ data }) => setInvoices(data.invoices)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Invoices</h1>
      {invoices.length === 0 ? (
        <div className="card text-center py-8 text-gray-400">No invoices found</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium text-gray-500">Invoice #</th>
                <th className="text-left p-3 font-medium text-gray-500">Status</th>
                <th className="text-right p-3 font-medium text-gray-500">Total</th>
                <th className="text-left p-3 font-medium text-gray-500">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-gray-100">
                  <td className="p-3 font-medium">{inv.invoice_number}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                      inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{inv.status}</span>
                  </td>
                  <td className="p-3 text-right font-medium">${inv.total.toLocaleString()}</td>
                  <td className="p-3 text-gray-500">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
