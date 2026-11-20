import { useState } from 'react';
import { MapPin, Phone, Mail, CheckCircle } from 'lucide-react';
import api from '../../api/client';

export default function Contact() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', address: '', notes: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/leads', { ...form, source: 'website', status: 'new' });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="bg-gradient-to-br from-solar-50 to-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Get Your Free Solar Quote</h1>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Fill out the form below and one of our energy consultants will reach out within 24 hours.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="card text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold mt-4">Thank You!</h2>
                <p className="text-gray-600 mt-2">We've received your information and will contact you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="card space-y-4">
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input name="first_name" className="input-field" value={form.first_name} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input name="last_name" className="input-field" value={form.last_name} onChange={handleChange} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input name="email" type="email" className="input-field" value={form.email} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input name="phone" className="input-field" value={form.phone} onChange={handleChange} required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input name="address" className="input-field" value={form.address} onChange={handleChange} placeholder="Street address for assessment" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea name="notes" className="input-field" rows={4} value={form.notes} onChange={handleChange} placeholder="Tell us about your energy needs..." />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? 'Submitting...' : 'Get Free Quote'}
                </button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="font-semibold text-lg mb-4">Contact Info</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-solar-500 mt-0.5" />
                  <div><p className="font-medium">Address</p><p className="text-gray-600 text-sm">123 Solar Street, Phoenix, AZ 85001</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-solar-500 mt-0.5" />
                  <div><p className="font-medium">Phone</p><p className="text-gray-600 text-sm">(555) 123-4567</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-solar-500 mt-0.5" />
                  <div><p className="font-medium">Email</p><p className="text-gray-600 text-sm">info@solarpro.com</p></div>
                </div>
              </div>
            </div>
            <div className="card bg-solar-50 border-solar-200">
              <h3 className="font-semibold text-lg mb-2">Why Choose SolarPro?</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />Free consultation & site assessment</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />Custom system design</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />Permit & utility paperwork handled</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />Professional installation</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />25-year warranty</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
