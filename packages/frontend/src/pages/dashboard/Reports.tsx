import { useEffect, useState } from 'react';
import api from '../../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Reports() {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/sales').then(({ data }) => {
      setSalesData(data.salesByRep || []);
    }).finally(() => setLoading(false));
    api.get('/analytics/pipeline').then(({ data }) => setPipeline(data.pipeline || []));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading reports...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Reports</h2>
      <div className="card">
        <h3 className="font-semibold mb-4">Sales by Representative</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="full_name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Rep</th>
                <th className="text-center p-2">Total Leads</th>
                <th className="text-center p-2">Won</th>
                <th className="text-right p-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((row: any) => (
                <tr key={row.full_name} className="border-t">
                  <td className="p-2 font-medium">{row.full_name || 'Unassigned'}</td>
                  <td className="p-2 text-center">{row.total_leads}</td>
                  <td className="p-2 text-center">{row.won_leads}</td>
                  <td className="p-2 text-right">${(row.revenue || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card mt-6">
        <h3 className="font-semibold mb-4">Pipeline by stage</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pipeline.map((row) => <div key={row.status} className="bg-gray-50 rounded-lg p-3"><p className="text-xs uppercase text-gray-500">{row.status.replace('_', ' ')}</p><p className="font-semibold mt-1">{row.count} leads</p><p className="text-sm text-solar-700">₹{Number(row.value || 0).toLocaleString('en-IN')}</p></div>)}
        </div>
      </div>
    </div>
  );
}
