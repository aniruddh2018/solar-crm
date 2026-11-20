import { Link } from 'react-router-dom';
import { Sun, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Sun className="w-8 h-8 text-solar-500" />
          <span className="font-bold text-xl text-gray-900">SolarPro</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-gray-600 hover:text-solar-600 font-medium">Home</Link>
          <Link to="/services" className="text-gray-600 hover:text-solar-600 font-medium">Services</Link>
          <Link to="/about" className="text-gray-600 hover:text-solar-600 font-medium">About</Link>
          <Link to="/contact" className="text-gray-600 hover:text-solar-600 font-medium">Contact</Link>
          <Link to="/login" className="btn-primary">Login</Link>
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden px-6 pb-4 space-y-3">
          <Link to="/" className="block text-gray-600 font-medium" onClick={() => setOpen(false)}>Home</Link>
          <Link to="/services" className="block text-gray-600 font-medium" onClick={() => setOpen(false)}>Services</Link>
          <Link to="/about" className="block text-gray-600 font-medium" onClick={() => setOpen(false)}>About</Link>
          <Link to="/contact" className="block text-gray-600 font-medium" onClick={() => setOpen(false)}>Contact</Link>
          <Link to="/login" className="btn-primary inline-block" onClick={() => setOpen(false)}>Login</Link>
        </div>
      )}
    </nav>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-6 h-6 text-solar-400" />
            <span className="font-bold text-white text-lg">SolarPro</span>
          </div>
          <p className="text-sm">Powering a sustainable future with premium solar solutions.</p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Services</h4>
          <ul className="space-y-2 text-sm">
            <li>Residential Solar</li>
            <li>Commercial Solar</li>
            <li>Battery Storage</li>
            <li>Maintenance</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Company</h4>
          <ul className="space-y-2 text-sm">
            <li>About Us</li>
            <li>Careers</li>
            <li>Blog</li>
            <li>Contact</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li>123 Solar Street</li>
            <li>Phoenix, AZ 85001</li>
            <li>(555) 123-4567</li>
            <li>info@solarpro.com</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-8 pt-6 border-t border-gray-800 text-center text-sm">
        &copy; {new Date().getFullYear()} SolarPro. All rights reserved.
      </div>
    </footer>
  );
}
