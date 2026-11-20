import { Link } from 'react-router-dom';
import { Sun, Shield, Bolt, Award, ArrowRight, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-solar-50 to-orange-50 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Power Your Future with <span className="text-solar-600">Solar Energy</span>
          </h1>
          <p className="text-xl text-gray-600 mt-6 max-w-2xl mx-auto">
            Premium solar solutions for homes and businesses. Save money, reduce your carbon footprint, and gain energy independence.
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Link to="/contact" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
              Get Free Quote <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/services" className="btn-secondary text-lg px-8 py-3">Our Services</Link>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Shield, label: '25-Year Warranty' },
              { icon: Bolt, label: 'Premium Equipment' },
              { icon: Award, label: 'Licensed Installers' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 justify-center text-gray-700">
                <Icon className="w-5 h-5 text-solar-500" />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Solar */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Go Solar?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Save Thousands', desc: 'Reduce or eliminate your electricity bills. Average savings of $1,500+ per year.' },
              { title: 'Tax Incentives', desc: 'Take advantage of the 30% federal tax credit and local rebates.' },
              { title: 'Energy Independence', desc: 'Protect yourself from rising utility rates and power outages.' },
              { title: 'Increase Home Value', desc: 'Homes with solar sell for 4.1% more on average.' },
              { title: 'Environmental Impact', desc: 'Reduce your carbon footprint by 3-4 tons of CO2 per year.' },
              { title: 'Low Maintenance', desc: 'Solar panels require minimal upkeep and last 25+ years.' },
            ].map((item) => (
              <div key={item.title} className="card">
                <CheckCircle className="w-8 h-8 text-green-500 mb-3" />
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-solar-600 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-3xl font-bold">Ready to Make the Switch?</h2>
          <p className="text-solar-100 mt-3 text-lg">Get a free, no-obligation solar assessment for your property.</p>
          <Link to="/contact" className="mt-6 inline-block bg-white text-solar-700 px-8 py-3 rounded-lg font-semibold hover:bg-solar-50 transition-colors">
            Start Your Free Quote
          </Link>
        </div>
      </section>
    </div>
  );
}
