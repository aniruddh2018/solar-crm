import { ReactNode, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import CompanySettings from './CompanySettings';
import GstSettings from './GstSettings';
import ProposalSettings from './ProposalSettings';
import MetaSettings from './MetaSettings';
import SalesPipelineSettings from './SalesPipelineSettings';

const tabs = ['Overview', 'Companies', 'Sales Pipeline', 'Invoice Format', 'Quotation Format', 'GST Rules', 'Workflow', 'Inventory', 'Meta Integration'] as const;
type Tab = typeof tabs[number];
type Preferences = Record<string, string | number | boolean | null>;

export default function SettingsHub() {
  const [tab, setTab] = useState<Tab>('Overview');
  const [preferences, setPreferences] = useState<Preferences | null>(null);

  useEffect(() => {
    api.get('/settings').then(({ data }) => setPreferences(data.preferences)).catch(() => toast.error('Could not load company settings'));
  }, []);

  const change = (key: string, value: string | number | boolean) => setPreferences((current) => current ? { ...current, [key]: value } : current);
  const save = async () => {
    if (!preferences) return;
    try {
      const { data } = await api.patch('/settings', preferences);
      setPreferences(data.preferences);
      toast.success('Settings saved for this company');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not save settings');
    }
  };

  return <div>
    <div className="mb-5"><h2 className="text-2xl font-bold">Settings</h2><p className="text-sm text-gray-500">Control companies, documents, GST, workflow, inventory and integrations from one place.</p></div>
    <div className="flex gap-2 overflow-x-auto border-b mb-6">{tabs.map((name) => <button key={name} className={`px-3 py-2 whitespace-nowrap text-sm ${tab === name ? 'border-b-2 border-solar-600 text-solar-700 font-semibold' : 'text-gray-500'}`} onClick={() => setTab(name)}>{name}</button>)}</div>
    {tab === 'Overview' && <div className="grid md:grid-cols-3 gap-4">{tabs.slice(1).map((name) => <button key={name} onClick={() => setTab(name)} className="card text-left hover:shadow-md"><h3 className="font-semibold">{name}</h3><p className="text-xs text-gray-500 mt-1">Configure {name.toLowerCase()} for the active company.</p></button>)}</div>}
    {tab === 'Companies' && <CompanySettings />}
    {tab === 'GST Rules' && <GstSettings />}
    {tab === 'Meta Integration' && <MetaSettings />}
    {tab === 'Sales Pipeline' && <SalesPipelineSettings />}
    {tab === 'Quotation Format' && preferences && <div className="space-y-6"><PreferenceCard title="Quotation appearance" onSave={save}><Text label="Document title" value={String(preferences.quotation_title || '')} onChange={(value) => change('quotation_title', value)} /><Color label="Accent colour" value={String(preferences.quotation_accent_color || '#d97706')} onChange={(value) => change('quotation_accent_color', value)} /><TextArea label="Quotation footer" value={String(preferences.quotation_footer || '')} onChange={(value) => change('quotation_footer', value)} /><NumberField label="Default validity (days)" value={Number(preferences.quotation_validity_days)} onChange={(value) => change('quotation_validity_days', value)} /></PreferenceCard><ProposalSettings /></div>}
    {tab === 'Invoice Format' && preferences && <PreferenceCard title="GST invoice appearance" onSave={save}><Text label="Document title" value={String(preferences.invoice_title || '')} onChange={(value) => change('invoice_title', value)} /><Color label="Accent colour" value={String(preferences.invoice_accent_color || '#d97706')} onChange={(value) => change('invoice_accent_color', value)} /><TextArea label="Invoice footer / declaration" value={String(preferences.invoice_footer || '')} onChange={(value) => change('invoice_footer', value)} /><NumberField label="Next invoice serial number" value={Number(preferences.next_invoice_number)} onChange={(value) => change('next_invoice_number', value)} /><NumberField label="Default due days" value={Number(preferences.default_invoice_due_days)} onChange={(value) => change('default_invoice_due_days', value)} /><Toggle label="Show HSN/SAC" value={Boolean(preferences.invoice_show_hsn)} onChange={(value) => change('invoice_show_hsn', value)} /><Toggle label="Show bank details" value={Boolean(preferences.invoice_show_bank)} onChange={(value) => change('invoice_show_bank', value)} /><Toggle label="Show signature block" value={Boolean(preferences.invoice_show_signature)} onChange={(value) => change('invoice_show_signature', value)} /></PreferenceCard>}
    {tab === 'Workflow' && preferences && <PreferenceCard title="Process automation" onSave={save}><Toggle label="Create customer and project when lead is marked won" value={Boolean(preferences.auto_customer_on_lead_won)} onChange={(value) => change('auto_customer_on_lead_won', value)} /><Toggle label="Require bill of materials for plant completion" value={Boolean(preferences.require_project_bom)} onChange={(value) => change('require_project_bom', value)} /><NumberField label="Default invoice due days" value={Number(preferences.default_invoice_due_days)} onChange={(value) => change('default_invoice_due_days', value)} /></PreferenceCard>}
    {tab === 'Inventory' && preferences && <PreferenceCard title="Inventory controls" onSave={save}><label className="text-sm">Stock issue method<select className="input-field mt-1" value={String(preferences.stock_issue_method)} onChange={(event) => change('stock_issue_method', event.target.value)}><option value="FIFO">FIFO - oldest batch first</option></select></label><Toggle label="Prevent negative stock" value={Boolean(preferences.prevent_negative_stock)} onChange={(value) => change('prevent_negative_stock', value)} /><NumberField label="Default reorder point" value={Number(preferences.default_reorder_point)} onChange={(value) => change('default_reorder_point', value)} /></PreferenceCard>}
  </div>;
}

function PreferenceCard({ title, onSave, children }: { title: string; onSave: () => void; children: ReactNode }) { return <div className="card max-w-3xl"><h3 className="font-semibold mb-4">{title}</h3><div className="grid md:grid-cols-2 gap-4">{children}</div><button className="btn-primary mt-5" onClick={onSave}>Save settings</button></div>; }
function Text({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-sm">{label}<input className="input-field mt-1" value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-sm md:col-span-2">{label}<textarea className="input-field mt-1" value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function Color({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-sm">{label}<div className="flex gap-2 mt-1"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} /><input className="input-field" value={value} onChange={(event) => onChange(event.target.value)} /></div></label>; }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="text-sm">{label}<input type="number" min="0" className="input-field mt-1" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>; }
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-center justify-between gap-3 text-sm border rounded-lg px-3 py-2"><span>{label}</span><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} /></label>; }
