import { Sun, Target, Heart, Users, Eye } from 'lucide-react';

export default function About() {
  return (
    <div>
      <section className="bg-gradient-to-br from-solar-50 to-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-gray-900">About SolarPro</h1>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">We're on a mission to make clean energy accessible to everyone.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Our Story</h2>
              <p className="text-gray-600 mb-4">
                Founded in 2018, SolarPro has installed over 5,000 solar systems across Arizona and the Southwest.
                We believe that every home and business deserves access to affordable, reliable clean energy.
              </p>
              <p className="text-gray-600 mb-4">
                Our team of certified installers, engineers, and energy consultants work together to deliver
                end-to-end solar solutions that maximize your savings and minimize your environmental impact.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-8">
                {[
                  { value: '5,000+', label: 'Installations' },
                  { value: '98%', label: 'Customer Satisfaction' },
                  { value: '50+', label: 'Team Members' },
                  { value: '4 States', label: 'Service Area' },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center p-4 bg-solar-50 rounded-lg">
                    <div className="text-2xl font-bold text-solar-600">{value}</div>
                    <div className="text-sm text-gray-600">{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {[
                { icon: Target, title: 'Quality First', desc: 'We use only premium Tier-1 solar panels and components.' },
                { icon: Heart, title: 'Customer Focused', desc: 'Your satisfaction is our top priority. We are with you every step.' },
                { icon: Eye, title: 'Transparent Pricing', desc: 'No hidden fees. Clear, upfront quotes with detailed breakdowns.' },
                { icon: Users, title: 'Expert Team', desc: 'NABCEP-certified installers with years of experience.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4 p-4 bg-white rounded-lg border border-gray-100">
                  <Icon className="w-8 h-8 text-solar-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
