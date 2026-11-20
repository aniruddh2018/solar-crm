import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sun, LogOut, Home, Building2, FileText, User, ChevronRight } from 'lucide-react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sun className="w-7 h-7 text-solar-500" />
            <span className="font-bold text-lg">Solar Customer Portal</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/portal" className="text-sm text-gray-600 hover:text-solar-600 flex items-center gap-1">
              <Home className="w-4 h-4" /> Home
            </Link>
            <Link to="/portal/projects" className="text-sm text-gray-600 hover:text-solar-600 flex items-center gap-1">
              <Building2 className="w-4 h-4" /> My Projects
            </Link>
            <Link to="/portal/invoices" className="text-sm text-gray-600 hover:text-solar-600 flex items-center gap-1">
              <FileText className="w-4 h-4" /> My Invoices
            </Link>
            <span className="text-sm text-gray-500">{user?.full_name}</span>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
