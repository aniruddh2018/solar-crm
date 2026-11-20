export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  role: 'admin' | 'sales' | 'installer' | 'customer';
  avatar_url: string | null;
  is_active: boolean;
  refresh_token: string | null;
  created_at: string;
  updated_at: string;
}

export type UserPublic = Omit<User, 'password_hash' | 'refresh_token'>;

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
  source: 'website' | 'referral' | 'cold_call' | 'event' | 'social_media' | 'other';
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  notes: string | null;
  estimated_system_size_kw: number | null;
  estimated_value: number | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string | null;
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

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: 'panel' | 'inverter' | 'battery' | 'racking' | 'electrical' | 'other';
  manufacturer: string | null;
  model: string | null;
  wattage: number | null;
  capacity_kwh: number | null;
  unit_price: number;
  unit_cost: number | null;
  quantity_in_stock: number;
  reorder_point: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  customer_id: string;
  lead_id: string | null;
  name: string;
  status: 'pending' | 'permitting' | 'scheduled' | 'in_progress' | 'inspection' | 'completed' | 'cancelled';
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

export interface Invoice {
  id: string;
  invoice_number: string;
  project_id: string | null;
  customer_id: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
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
  sort_order: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  method: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'financing';
  reference: string | null;
  notes: string | null;
  received_by: string | null;
  payment_date: string;
  created_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
