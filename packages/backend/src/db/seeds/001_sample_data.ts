import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  await knex('payments').del();
  await knex('invoice_items').del();
  await knex('invoices').del();
  await knex('project_documents').del();
  await knex('project_products').del();
  await knex('project_milestones').del();
  await knex('projects').del();
  await knex('products').del();
  await knex('customers').del();
  await knex('lead_activities').del();
  await knex('leads').del();
  await knex('users').del();

  const passwordHash = await bcrypt.hash('password123', 10);

  // Users
  await knex('users').insert([
    { id: 'a0000000-0000-0000-0000-000000000001', email: 'admin@solarcrm.com', password_hash: passwordHash, full_name: 'Admin User', phone: '555-0100', role: 'admin' },
    { id: 'a0000000-0000-0000-0000-000000000002', email: 'sales@solarcrm.com', password_hash: passwordHash, full_name: 'Sarah Sales', phone: '555-0101', role: 'sales' },
    { id: 'a0000000-0000-0000-0000-000000000003', email: 'installer@solarcrm.com', password_hash: passwordHash, full_name: 'Mike Installer', phone: '555-0102', role: 'installer' },
    { id: 'a0000000-0000-0000-0000-000000000004', email: 'john@example.com', password_hash: passwordHash, full_name: 'John Customer', phone: '555-0200', role: 'customer' },
    { id: 'a0000000-0000-0000-0000-000000000005', email: 'jane@example.com', password_hash: passwordHash, full_name: 'Jane Customer', phone: '555-0201', role: 'customer' },
  ]);

  // Products
  await knex('products').insert([
    { id: 'b0000000-0000-0000-0000-000000000001', name: 'SunPower 400W Panel', sku: 'PAN-SP-400', category: 'panel', manufacturer: 'SunPower', brand: 'SunPower', hsn_code: '85414300', model: 'SPR-MAX3-400', wattage: 400, unit_price: 350.00, unit_cost: 280.00, quantity_in_stock: 50, reorder_point: 10 },
    { id: 'b0000000-0000-0000-0000-000000000002', name: 'Enphase IQ8 Microinverter', sku: 'INV-EN-IQ8', category: 'inverter', manufacturer: 'Enphase', brand: 'Enphase', hsn_code: '85044010', model: 'IQ8-60-2-US', unit_price: 225.00, unit_cost: 180.00, quantity_in_stock: 40, reorder_point: 8 },
    { id: 'b0000000-0000-0000-0000-000000000003', name: 'Tesla Powerwall 3', sku: 'BAT-TS-PW3', category: 'battery', manufacturer: 'Tesla', brand: 'Tesla', hsn_code: '85076000', model: 'PW3', capacity_kwh: 13.5, unit_price: 9500.00, unit_cost: 7600.00, quantity_in_stock: 5, reorder_point: 2 },
    { id: 'b0000000-0000-0000-0000-000000000004', name: 'IronRidge Racking Kit (10kW)', sku: 'RCK-IR-10K', category: 'racking', manufacturer: 'IronRidge', brand: 'IronRidge', hsn_code: '73089090', model: 'XRS-10K', unit_price: 2500.00, unit_cost: 1950.00, quantity_in_stock: 15, reorder_point: 5 },
    { id: 'b0000000-0000-0000-0000-000000000005', name: 'SolarEdge HD Wave Inverter', sku: 'INV-SE-HDW', category: 'inverter', manufacturer: 'SolarEdge', brand: 'SolarEdge', hsn_code: '85044010', model: 'SE7600H-US', unit_price: 1895.00, unit_cost: 1520.00, quantity_in_stock: 12, reorder_point: 3 },
  ]);

  // Customers
  await knex('customers').insert([
    { id: 'c0000000-0000-0000-0000-000000000001', user_id: 'a0000000-0000-0000-0000-000000000004', first_name: 'John', last_name: 'Customer', email: 'john@example.com', phone: '555-0200', address: '123 Solar Lane', city: 'Phoenix', state: 'AZ', zip: '85001', utility_company: 'APS', avg_monthly_bill: 220.00, annual_usage_kwh: 18000 },
    { id: 'c0000000-0000-0000-0000-000000000002', user_id: 'a0000000-0000-0000-0000-000000000005', first_name: 'Jane', last_name: 'Customer', email: 'jane@example.com', phone: '555-0201', address: '456 Sun Blvd', city: 'Tucson', state: 'AZ', zip: '85701', utility_company: 'TEP', avg_monthly_bill: 180.00, annual_usage_kwh: 15000 },
  ]);

  // Leads
  await knex('leads').insert([
    { id: 'd0000000-0000-0000-0000-000000000001', first_name: 'Bob', last_name: 'Prospect', email: 'bob@example.com', phone: '555-0300', address: '789 Ray Ave', city: 'Phoenix', state: 'AZ', zip: '85002', source: 'website', status: 'new', estimated_system_size_kw: 8.0, estimated_value: 24000.00, assigned_to: 'a0000000-0000-0000-0000-000000000002', created_by: 'a0000000-0000-0000-0000-000000000001' },
    { id: 'd0000000-0000-0000-0000-000000000002', first_name: 'Alice', last_name: 'Lead', email: 'alice@example.com', phone: '555-0301', address: '321 Watt St', city: 'Mesa', state: 'AZ', zip: '85201', source: 'referral', status: 'qualified', estimated_system_size_kw: 10.0, estimated_value: 30000.00, assigned_to: 'a0000000-0000-0000-0000-000000000002', created_by: 'a0000000-0000-0000-0000-000000000001' },
    { id: 'd0000000-0000-0000-0000-000000000003', first_name: 'Charlie', last_name: 'Warm', email: 'charlie@example.com', phone: '555-0302', address: '654 Panel Dr', city: 'Scottsdale', state: 'AZ', zip: '85251', source: 'website', status: 'proposal', estimated_system_size_kw: 12.0, estimated_value: 36000.00, assigned_to: 'a0000000-0000-0000-0000-000000000002', created_by: 'a0000000-0000-0000-0000-000000000001' },
  ]);

  // Projects
  await knex('projects').insert([
    { id: 'e0000000-0000-0000-0000-000000000001', customer_id: 'c0000000-0000-0000-0000-000000000001', name: 'Johns Home Solar Installation', status: 'in_progress', system_size_kw: 8.0, panel_count: 20, inverter_model: 'Enphase IQ8', contract_value: 24000.00, deposit_amount: 5000.00, deposit_paid: true, assigned_installer: 'a0000000-0000-0000-0000-000000000003', scheduled_date: '2025-07-01' },
  ]);

  await knex('project_milestones').insert([
    { project_id: 'e0000000-0000-0000-0000-000000000001', title: 'Contract Signed', completed: true, completed_at: knex.fn.now(), sort_order: 0 },
    { project_id: 'e0000000-0000-0000-0000-000000000001', title: 'Permit Approved', completed: true, completed_at: knex.fn.now(), sort_order: 1 },
    { project_id: 'e0000000-0000-0000-0000-000000000001', title: 'Equipment Delivered', completed: false, sort_order: 2 },
    { project_id: 'e0000000-0000-0000-0000-000000000001', title: 'Installation Complete', completed: false, sort_order: 3 },
    { project_id: 'e0000000-0000-0000-0000-000000000001', title: 'Inspection Passed', completed: false, sort_order: 4 },
    { project_id: 'e0000000-0000-0000-0000-000000000001', title: 'Utility Approval (PTO)', completed: false, sort_order: 5 },
  ]);

  // Invoices
  await knex('invoices').insert([
    {
      id: 'f0000000-0000-0000-0000-000000000001',
      invoice_number: 'INV-2025-0001',
      project_id: 'e0000000-0000-0000-0000-000000000001',
      customer_id: 'c0000000-0000-0000-0000-000000000001',
      status: 'sent',
      subtotal: 24000.00,
      tax_rate: 0,
      tax_amount: 1828.46,
      total: 26040.00,
      gst_enabled: true,
      price_includes_gst: true,
      material_base_amount: 19360.59,
      material_gst_amount: 968.03,
      labour_base_amount: 4840.15,
      labour_gst_amount: 871.23,
      due_date: '2025-07-15',
      notes: 'Full system installation',
    },
  ]);

  await knex('invoice_items').insert([
    { invoice_id: 'f0000000-0000-0000-0000-000000000001', description: 'SunPower 400W Panels (x20)', quantity: 20, unit_price: 350.00, total: 7000.00, product_id: 'b0000000-0000-0000-0000-000000000001', sort_order: 0 },
    { invoice_id: 'f0000000-0000-0000-0000-000000000001', description: 'Enphase IQ8 Microinverters (x20)', quantity: 20, unit_price: 225.00, total: 4500.00, product_id: 'b0000000-0000-0000-0000-000000000002', sort_order: 1 },
    { invoice_id: 'f0000000-0000-0000-0000-000000000001', description: 'IronRidge Racking Kit', quantity: 1, unit_price: 2500.00, total: 2500.00, product_id: 'b0000000-0000-0000-0000-000000000004', sort_order: 2 },
    { invoice_id: 'f0000000-0000-0000-0000-000000000001', description: 'Installation Labor', quantity: 1, unit_price: 10000.00, total: 10000.00, sort_order: 3 },
  ]);

  await knex('payments').insert([
    { invoice_id: 'f0000000-0000-0000-0000-000000000001', amount: 5000.00, method: 'bank_transfer', reference: 'DEPOSIT-001', received_by: 'a0000000-0000-0000-0000-000000000001', payment_date: '2025-06-15' },
  ]);
}
