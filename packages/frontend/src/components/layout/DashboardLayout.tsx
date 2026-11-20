import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Kanban, Building2, Package, FileText,
  BarChart3, Sun, LogOut, Menu, Settings, Radio, Truck, ShoppingCart
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../api/client';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'sales', 'installer'] },
  { path: '/dashboard/leads', label: 'Leads', icon: Kanban, roles: ['admin', 'sales'] },
  { path: '/dashboard/customers', label: 'Customers', icon: Users, roles: ['admin', 'sales', 'installer'] },
  { path: '/dashboard/projects', label: 'Projects', icon: Building2, roles: ['admin', 'sales', 'installer'] },
  { path: '/dashboard/invoices', label: 'Invoices', icon: FileText, roles: ['admin', 'sales'] },
  { path: '/dashboard/inventory', label: 'Inventory', icon: Package, roles: ['admin', 'sales', 'installer'] },
  { path: '/dashboard/suppliers', label: 'Suppliers', icon: Truck, roles: ['admin', 'sales', 'installer'] },
  { path: '/dashboard/purchases', label: 'Purchase Invoices', icon: ShoppingCart, roles: ['admin', 'sales', 'installer'] },
  { path: '/dashboard/internal-transfer', label: 'Inter-company Sale', icon: ShoppingCart, roles: ['admin', 'sales'] },
  { path: '/dashboard/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'sales'] },
  { path: '/dashboard/users', label: 'Users', icon: Users, roles: ['admin'] },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]); const [activeCompany, setActiveCompany] = useState(localStorage.getItem('activeCompanyId') || '');
  useEffect(() => { api.get('/companies').then(({ data }) => { setCompanies(data.companies); const id = activeCompany || data.active_company_id; if (id && id !== activeCompany) { localStorage.setItem('activeCompanyId', id); setActiveCompany(id); } }); }, []);
  const switchCompany = (id: string) => { localStorage.setItem('activeCompanyId', id); setActiveCompany(id); window.location.reload(); };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter((item) => item.roles.includes(user?.role || ''));

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <Sun className="w-8 h-8 text-solar-500" />
          <div>
            <h1 className="font-bold text-lg text-gray-900">SolarCRM</h1>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          {visibleItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-solar-50 hover:text-solar-700 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1"><select aria-label="Active company" className="input-field max-w-xs py-2" value={activeCompany} onChange={(e) => switchCompany(e.target.value)}>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.full_name}</span>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
