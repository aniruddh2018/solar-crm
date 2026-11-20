import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import type { Invoice, InvoiceItem, Payment } from '../../types';
import { ArrowLeft, DollarSign, Plus } from 'lucide-react';
import { downloadBlob } from '../../utils/download';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    api.get(`/invoices/${id}`).then(({ data }) => {
      setInvoice(data.invoice);
      setItems(data.items);
      setPayments(data.payments);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!invoice) return <div className="p-8 text-center text-gray-500">Invoice not found</div>;

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = invoice.total - totalPaid;
  const downloadInvoice = async () => { const { data } = await api.get(`/invoices/${invoice.id}/pdf`, { responseType: 'blob' }); downloadBlob(data, `tax-invoice-${invoice.invoice_number.split('/').join('-')}.pdf`); };

  return (
    <div>
      <button onClick={() => navigate('/dashboard/invoices')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Invoices
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{invoice.invoice_number}</h2>
                <p className="text-gray-500">{invoice.customer_name}</p>
              </div>
              <div className="flex gap-2 items-center"><button className="btn-secondary text-sm" onClick={downloadInvoice}>Download GST PDF</button><span className={`px-3 py-1 rounded-full text-sm font-medium ${
                invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>{invoice.status}</span></div>
            </div>

            {invoice.customer_address && (
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-medium">Bill To:</p>
                <p>{invoice.customer_name}</p>
                <p>{invoice.customer_address}</p>
              </div>
            )}
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-500">Description</th>
                  <th className="text-left p-3 font-medium text-gray-500">HSN/SAC</th>
                  <th className="text-center p-3 font-medium text-gray-500">GST</th>
                  <th className="text-center p-3 font-medium text-gray-500">Qty</th>
                  <th className="text-right p-3 font-medium text-gray-500">Unit Price</th>
                  <th className="text-right p-3 font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="p-3">{item.description}</td>
                    <td className="p-3">{item.hsn_code || '—'}</td>
                    <td className="p-3 text-center">{Number(item.gst_rate || 0)}%</td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right">{inr.format(item.unit_price)}</td>
                    <td className="p-3 text-right font-medium">{inr.format(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-gray-200 p-4 space-y-1 text-sm">
              {invoice.gst_enabled ? <>
                <div className="flex justify-between"><span>Material base</span><span>{inr.format(invoice.material_base_amount)}</span></div>
                <div className="flex justify-between"><span>GST on material</span><span>{inr.format(invoice.material_gst_amount)}</span></div>
                <div className="flex justify-between"><span>Labour base</span><span>{inr.format(invoice.labour_base_amount)}</span></div>
                <div className="flex justify-between"><span>GST on labour</span><span>{inr.format(invoice.labour_gst_amount)}</span></div>
              </> : <div className="flex justify-between"><span>Taxable subtotal</span><span>{inr.format(invoice.subtotal)}</span></div>}
              {invoice.discount_amount > 0 && <div className="flex justify-between"><span>Discount</span><span>-${invoice.discount_amount.toLocaleString()}</span></div>}
              <div className="flex justify-between"><span>GST</span><span>{inr.format(invoice.tax_amount)}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{inr.format(invoice.total)}</span></div>
              <div className="flex justify-between text-green-600"><span>Paid</span><span>{invoice.gst_enabled ? inr.format(totalPaid) : `$${totalPaid.toLocaleString()}`}</span></div>
              {balance > 0 && <div className="flex justify-between text-red-600 font-medium"><span>Balance Due</span><span>${balance.toLocaleString()}</span></div>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Payments</h3>
              {balance > 0 && (
                <button onClick={() => setShowPayment(!showPayment)} className="text-solar-600 text-sm font-medium flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Record
                </button>
              )}
            </div>
            {payments.map((p) => (
              <div key={p.id} className="border-b border-gray-100 py-2 last:border-0">
                <div className="flex justify-between">
                  <span className="font-medium">${p.amount.toLocaleString()}</span>
                  <span className="text-xs text-gray-500">{p.method}</span>
                </div>
                <p className="text-xs text-gray-400">{new Date(p.payment_date).toLocaleDateString()}</p>
              </div>
            ))}
            {payments.length === 0 && <p className="text-sm text-gray-400">No payments recorded</p>}

            {showPayment && (
              <PaymentForm invoiceId={invoice.id} onSuccess={() => {
                setShowPayment(false);
                api.get(`/invoices/${id}`).then(({ data }) => {
                  setInvoice(data.invoice);
                  setPayments(data.payments);
                });
              }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentForm({ invoiceId, onSuccess }: { invoiceId: string; onSuccess: () => void }) {
  const [form, setForm] = useState({ amount: '', method: 'bank_transfer', reference: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await api.post(`/invoices/${invoiceId}/payments`, { amount: parseFloat(form.amount), method: form.method, reference: form.reference, notes: form.notes });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Amount *</label>
        <input type="number" step="0.01" className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Method</label>
        <select className="input-field" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="check">Check</option>
          <option value="cash">Cash</option>
          <option value="credit_card">Credit Card</option>
          <option value="financing">Financing</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Reference</label>
        <input className="input-field" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Check #, transaction ID" />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full text-sm">{loading ? 'Recording...' : 'Record Payment'}</button>
    </form>
  );
}
