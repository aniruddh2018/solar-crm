export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'admin' | 'sales' | 'installer' | 'customer';
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  source: string;
  status: string;
  notes: string | null;
  estimated_system_size_kw: number | null;
  estimated_value: number | null;
  assigned_to: string | null;
  assigned_name?: string;
  created_by: string | null;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string | null;
  user_name?: string;
  activity_type: string;
  description: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  user_id: string | null;
  lead_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  utility_company: string | null;
  avg_monthly_bill: number | null;
  annual_usage_kwh: number | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  customer_id: string;
  customer_name?: string;
  lead_id: string | null;
  name: string;
  status: string;
  system_size_kw: number | null;
  panel_count: number | null;
  inverter_model: string | null;
  battery_model: string | null;
  contract_value: number | null;
  deposit_amount: number | null;
  deposit_paid: boolean;
  permit_number: string | null;
  utility_interconnection_ref: string | null;
  scheduled_date: string | null;
  completion_date: string | null;
  assigned_installer: string | null;
  installer_name?: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  manufacturer: string | null;
  brand: string | null;
  hsn_code: string | null;
  gst_rate: number;
  model: string | null;
  wattage: number | null;
  capacity_kwh: number | null;
  unit_price: number;
  unit_cost: number | null;
  quantity_in_stock: number;
  reorder_point: number;
  created_at: string;
  updated_at: string;
  batches?: Array<{ id: string; batch_number: string; quantity_remaining: number; unit_cost: number; received_date: string }>;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  project_id: string | null;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  project_name?: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  gst_enabled: boolean;
  price_includes_gst: boolean;
  material_base_amount: number;
  material_gst_amount: number;
  labour_base_amount: number;
  labour_gst_amount: number;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  product_id: string | null;
  product_name?: string;
  hsn_code: string | null;
  gst_rate: number;
  taxable_amount: number;
  gst_amount: number;
  sort_order: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  received_by: string | null;
  received_by_name?: string;
  payment_date: string;
  created_at: string;
}

export interface DashboardStats {
  totalRevenue: number;
  activeProjects: number;
  pipelineValue: number;
  totalLeads: number;
  recentProjects: Project[];
  leadsByStatus: { status: string; count: number }[];
  monthlyRevenue: { month: string; total: number }[];
}
