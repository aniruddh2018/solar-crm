import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import PortalLayout from './components/layout/PortalLayout';
import PublicNavbar, { PublicFooter } from './components/layout/PublicLayout';

// Public pages
import Home from './pages/public/Home';
import Services from './pages/public/Services';
import About from './pages/public/About';
import Contact from './pages/public/Contact';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard pages
import DashboardHome from './pages/dashboard/DashboardHome';
import LeadPipeline from './pages/dashboard/LeadPipeline';
import LeadDetail from './pages/dashboard/LeadDetail';
import Projects from './pages/dashboard/Projects';
import ProjectDetail from './pages/dashboard/ProjectDetail';
import Invoices from './pages/dashboard/Invoices';
import InvoiceDetail from './pages/dashboard/InvoiceDetail';
import Customers from './pages/dashboard/Customers';
import CustomerDetail from './pages/dashboard/CustomerDetail';
import Inventory from './pages/dashboard/Inventory';
import Reports from './pages/dashboard/Reports';
import Users from './pages/dashboard/Users';
import GstSettings from './pages/dashboard/GstSettings';
import CreateInvoice from './pages/dashboard/CreateInvoice';
import MetaSettings from './pages/dashboard/MetaSettings';
import CreateItemInvoice from './pages/dashboard/CreateItemInvoice';
import ProposalSettings from './pages/dashboard/ProposalSettings';
import Suppliers from './pages/dashboard/Suppliers';
import Purchases from './pages/dashboard/Purchases';
import CompanySettings from './pages/dashboard/CompanySettings';
import InternalTransfer from './pages/dashboard/InternalTransfer';
import SettingsHub from './pages/dashboard/SettingsHub';

// Portal pages
import PortalHome from './pages/portal/PortalHome';
import PortalProjects from './pages/portal/PortalProjects';
import PortalInvoices from './pages/portal/PortalInvoices';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      {children}
      <PublicFooter />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public marketing site */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin/Internal Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['admin', 'sales', 'installer']}>
                <DashboardLayout><DashboardHome /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/leads"
            element={
              <ProtectedRoute roles={['admin', 'sales']}>
                <DashboardLayout><LeadPipeline /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/leads/:id"
            element={
              <ProtectedRoute roles={['admin', 'sales']}>
                <DashboardLayout><LeadDetail /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/projects"
            element={
              <ProtectedRoute roles={['admin', 'sales', 'installer']}>
                <DashboardLayout><Projects /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/projects/:id"
            element={
              <ProtectedRoute roles={['admin', 'sales', 'installer']}>
                <DashboardLayout><ProjectDetail /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/invoices"
            element={
              <ProtectedRoute roles={['admin', 'sales']}>
                <DashboardLayout><Invoices /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/invoices/:id"
            element={
              <ProtectedRoute roles={['admin', 'sales']}>
                <DashboardLayout><InvoiceDetail /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/invoices/new"
            element={<ProtectedRoute roles={['admin', 'sales']}><DashboardLayout><CreateInvoice /></DashboardLayout></ProtectedRoute>}
          />
          <Route path="/dashboard/invoices/item/new" element={<ProtectedRoute roles={['admin', 'sales']}><DashboardLayout><CreateItemInvoice /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/settings/company" element={<ProtectedRoute roles={['admin']}><DashboardLayout><CompanySettings /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute roles={['admin']}><DashboardLayout><SettingsHub /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/internal-transfer" element={<ProtectedRoute roles={['admin', 'sales']}><DashboardLayout><InternalTransfer /></DashboardLayout></ProtectedRoute>} />
          <Route
            path="/dashboard/customers"
            element={
              <ProtectedRoute roles={['admin', 'sales', 'installer']}>
                <DashboardLayout><Customers /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/customers/:id"
            element={
              <ProtectedRoute roles={['admin', 'sales', 'installer']}>
                <DashboardLayout><CustomerDetail /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/inventory"
            element={
              <ProtectedRoute roles={['admin', 'sales', 'installer']}>
                <DashboardLayout><Inventory /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/reports"
            element={
              <ProtectedRoute roles={['admin', 'sales']}>
                <DashboardLayout><Reports /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout><Users /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/gst"
            element={<ProtectedRoute roles={['admin']}><DashboardLayout><GstSettings /></DashboardLayout></ProtectedRoute>}
          />
          <Route path="/dashboard/settings/meta" element={<ProtectedRoute roles={['admin']}><DashboardLayout><MetaSettings /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/settings/quotations" element={<ProtectedRoute roles={['admin']}><DashboardLayout><ProposalSettings /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/suppliers" element={<ProtectedRoute roles={['admin', 'sales', 'installer']}><DashboardLayout><Suppliers /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/purchases" element={<ProtectedRoute roles={['admin', 'sales', 'installer']}><DashboardLayout><Purchases /></DashboardLayout></ProtectedRoute>} />

          {/* Customer Portal */}
          <Route
            path="/portal"
            element={
              <CustomerRoute>
                <PortalLayout><PortalHome /></PortalLayout>
              </CustomerRoute>
            }
          />
          <Route
            path="/portal/projects"
            element={
              <CustomerRoute>
                <PortalLayout><PortalProjects /></PortalLayout>
              </CustomerRoute>
            }
          />
          <Route
            path="/portal/invoices"
            element={
              <CustomerRoute>
                <PortalLayout><PortalInvoices /></PortalLayout>
              </CustomerRoute>
            }
          />

          {/* Redirect based on role */}
          <Route
            path="*"
            element={
              <RoleRedirect />
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function RoleRedirect() {
  const { user } = useAuth();
  if (user) {
    if (user.role === 'customer') return <Navigate to="/portal" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/" replace />;
}
