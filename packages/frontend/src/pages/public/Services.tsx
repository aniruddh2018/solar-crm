import { Sun, Home, Building2, Battery, Wrench, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const services = [
  { icon: Home, title: 'Residential Solar', desc: 'Custom-designed solar systems for your home. Maximum savings with premium panels and expert installation.', price: 'Starting at $12,000' },
  { icon: Building2, title: 'Commercial Solar', desc: 'Scale your business with commercial-grade solar. Reduce operating costs and meet sustainability goals.', price: 'Custom pricing' },
  { icon: Battery, title: 'Battery Storage', desc: 'Store excess energy for nighttime use or backup power. Tesla Powerwall and other premium options.', price: 'Starting at $9,500' },
  { icon: Wrench, title: 'Maintenance & Repair', desc: 'Keep your system running at peak performance with our annual maintenance plans and repair services.', price: 'Starting at $199/year' },
];

export default function Services() {
  return (
    <div>
      <section className="bg-gradient-to-br from-solar-50 to-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Our Services</h1>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Complete solar solutions from consultation to installation and beyond.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map(({ icon: Icon, title, desc, price }) => (
            <div key={title} className="card hover:shadow-md transition-shadow">
              <Icon className="w-10 h-10 text-solar-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-gray-600 mb-4">{desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-solar-600 font-semibold">{price}</span>
                <Link to="/contact" className="text-solar-600 hover:text-solar-700 font-medium flex items-center gap-1 text-sm">
                  Get Quote <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
