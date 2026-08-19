'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  IconSearch, IconPlus, IconX, IconCheck, IconDollarSign,
  IconList, IconTrash, IconRefresh, IconFilter, IconEdit, IconDownload, IconAlertCircle
} from '@/client/components/icons';
import '@/client/styles/receptionist.css';

// ─── Types ───────────────────────────────────────────────
interface ServiceOption {
  id: string; name: string; code: string; category: string;
  unitPrice: number; unit: string; taxRate: number;
}

interface LineItem {
  serviceId: string; serviceName: string; code: string;
  category: string; unit: string; unitPrice: number;
  quantity: number; discount: number; taxRate: number;
  taxAmount: number; totalAmount: number;
}

interface BillingLineItem {
  id: string; serviceName: string; quantity: number;
  unitPrice: number; discount: number; taxAmount: number;
  totalAmount: number; notes: string | null;
  service: { code: string; category: string; unit: string };
}

interface BillingRecord {
  id: string; invoiceNumber: string | null; totalAmount: number;
  discount: number; taxTotal: number; paidAmount: number;
  paymentMethod: string | null; status: string; createdAt: string;
  items: string[];
  patient: { name: string; phone: string };
  appointment: { type: string; scheduledAt: string } | null;
  generatedBy: { name: string };
  lineItems: BillingLineItem[];
}

interface PatientOption { id: string; name: string; phone: string }

// ─── Animation Variants ──────────────────────────────────
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const statusColors: Record<string, string> = {
  PAID: 'success', PENDING: 'warning', PARTIALLY_PAID: 'primary', OVERDUE: 'danger', CANCELLED: 'neutral',
};
const categoryColors: Record<string, string> = {
  CONSULTATION: '#6366f1', PROCEDURE: '#f59e0b', LABORATORY: '#06b6d4',
  RADIOLOGY: '#8b5cf6', ROOM_CHARGE: '#64748b', NURSING_CHARGE: '#ec4899',
  MEDICATION: '#22c55e', SURGERY: '#ef4444', PHYSIOTHERAPY: '#14b8a6',
  AMBULANCE: '#f97316', MISCELLANEOUS: '#94a3b8',
};
const SERVICE_CATEGORIES = [
  'CONSULTATION', 'PROCEDURE', 'LABORATORY', 'RADIOLOGY',
  'ROOM_CHARGE', 'NURSING_CHARGE', 'MEDICATION', 'SURGERY',
  'PHYSIOTHERAPY', 'AMBULANCE', 'MISCELLANEOUS',
];

// ─── Main Page Component ─────────────────────────────────
export default function ReceptionistBillingPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'catalog'>('invoices');
  const [billings, setBillings] = useState<BillingRecord[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogFilter, setCatalogFilter] = useState('');
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  // ─── New Service Form State ──────────────────────────
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [svcFormLoading, setSvcFormLoading] = useState(false);
  const [svcFormError, setSvcFormError] = useState('');
  const [svcForm, setSvcForm] = useState({
    name: '', code: '', category: 'CONSULTATION', unitPrice: '',
    unit: 'per unit', description: '', department: '', taxRate: '',
  });

  // ─── Invoice Form State ──────────────────────────────
  const [formPatientId, setFormPatientId] = useState('');
  const [formLineItems, setFormLineItems] = useState<LineItem[]>([]);
  const [formPaymentMethod, setFormPaymentMethod] = useState('');
  const [formDiscount, setFormDiscount] = useState(0);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);

  // ─── Data Fetching ───────────────────────────────────
  const fetchBillings = useCallback(async () => {
    try {
      const res = await fetch(`/api/receptionist/billing?t=${Date.now()}`);
      if (res.ok) { const data = await res.json(); setBillings(data.billings); }
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch(`/api/receptionist/patients?t=${Date.now()}`);
      if (res.ok) { const data = await res.json(); setPatients(data.patients); }
    } catch { /* */ }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch(`/api/accountant/services?t=${Date.now()}`);
      if (res.ok) { const data = await res.json(); setServices(data.services); }
    } catch { /* */ }
  }, []);

  // ─── Create New Service ─────────────────────────────
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault(); setSvcFormError(''); setSvcFormLoading(true);
    try {
      const res = await fetch('/api/accountant/services', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...svcForm,
          description: svcForm.description || undefined,
          department: svcForm.department || undefined,
          unitPrice: parseFloat(svcForm.unitPrice) || 0,
          taxRate: parseFloat(svcForm.taxRate) || 0,
        }),
      });
      if (!res.ok) { const d = await res.json(); setSvcFormError(d.error || 'Failed to create service'); setSvcFormLoading(false); return; }
      const d = await res.json();
      setServices(prev => [...prev, d.service]);
      setShowServiceModal(false);
      setSvcForm({ name: '', code: '', category: 'CONSULTATION', unitPrice: '', unit: 'per unit', description: '', department: '', taxRate: '' });
      showToast('Service added successfully!', 'success');
      fetchServices(); // Background sync
    } catch { setSvcFormError('Network error'); } finally { setSvcFormLoading(false); }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => { fetchBillings(); fetchPatients(); fetchServices(); }, [fetchBillings, fetchPatients, fetchServices]);

  // ─── Service Search Filter ──────────────────────────
  const filteredServices = useMemo(() => {
    if (!serviceSearch) return services;
    const q = serviceSearch.toLowerCase();
    return services.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }, [services, serviceSearch]);

  // ─── Add Service to Invoice ─────────────────────────
  const addServiceToInvoice = (svc: ServiceOption) => {
    // Check if already added
    const existing = formLineItems.find(li => li.serviceId === svc.id);
    if (existing) {
      setFormLineItems(prev => prev.map(li =>
        li.serviceId === svc.id ? recalcLineItem({ ...li, quantity: li.quantity + 1 }) : li
      ));
    } else {
      const newItem: LineItem = {
        serviceId: svc.id, serviceName: svc.name, code: svc.code,
        category: svc.category, unit: svc.unit, unitPrice: svc.unitPrice,
        quantity: 1, discount: 0, taxRate: svc.taxRate,
        taxAmount: 0, totalAmount: 0,
      };
      setFormLineItems(prev => [...prev, recalcLineItem(newItem)]);
    }
    setServiceSearch('');
    setShowServiceDropdown(false);
  };

  const recalcLineItem = (li: LineItem): LineItem => {
    const subtotal = li.unitPrice * li.quantity;
    const taxable = subtotal - li.discount;
    const taxAmount = Math.round(taxable * (li.taxRate / 100) * 100) / 100;
    const totalAmount = Math.round((taxable + taxAmount) * 100) / 100;
    return { ...li, taxAmount, totalAmount };
  };

  const updateLineItemQty = (serviceId: string, qty: number) => {
    if (qty < 1) return;
    setFormLineItems(prev => prev.map(li =>
      li.serviceId === serviceId ? recalcLineItem({ ...li, quantity: qty }) : li
    ));
  };

  const updateLineItemPrice = (serviceId: string, price: number) => {
    setFormLineItems(prev => prev.map(li =>
      li.serviceId === serviceId ? recalcLineItem({ ...li, unitPrice: price }) : li
    ));
  };

  const updateLineItemUnit = (serviceId: string, unit: string) => {
    setFormLineItems(prev => prev.map(li =>
      li.serviceId === serviceId ? { ...li, unit } : li
    ));
  };

  const updateLineItemDiscount = (serviceId: string, discount: number) => {
    setFormLineItems(prev => prev.map(li =>
      li.serviceId === serviceId ? recalcLineItem({ ...li, discount: Math.max(0, discount) }) : li
    ));
  };

  const removeLineItem = (serviceId: string) => {
    setFormLineItems(prev => prev.filter(li => li.serviceId !== serviceId));
  };

  // ─── Invoice Totals ─────────────────────────────────
  const invoiceSubtotal = formLineItems.reduce((s, li) => s + (li.unitPrice * li.quantity), 0);
  const invoiceTax = formLineItems.reduce((s, li) => s + li.taxAmount, 0);
  const invoiceGrandTotal = Math.round((invoiceSubtotal + invoiceTax - formDiscount) * 100) / 100;

  // ─── Create Invoice ─────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(''); setFormLoading(true);
    if (formLineItems.length === 0) { setFormError('Add at least one service'); setFormLoading(false); return; }
    try {
      const res = await fetch('/api/receptionist/billing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formPatientId,
          lineItems: formLineItems.map(li => ({
            serviceId: li.serviceId, quantity: li.quantity,
            discount: li.discount, notes: null,
            unitPrice: li.unitPrice, // Send customized price if modified
          })),
          discount: formDiscount,
          paymentMethod: formPaymentMethod || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); setFormError(d.error || 'Failed to create billing'); setFormLoading(false); return; }
      setShowModal(false);
      setFormPatientId('');
      setFormLineItems([]);
      setFormDiscount(0);
      setFormPaymentMethod('Cash');
      showToast('Invoice generated successfully!', 'success');
      fetchBillings();
    } catch { setFormError('Network error'); } finally { setFormLoading(false); }
  };

  const resetForm = () => {
    setFormPatientId(''); setFormLineItems([]); setFormPaymentMethod('');
    setFormDiscount(0); setFormError(''); setServiceSearch('');
  };

  // ─── Mark as Paid ───────────────────────────────────
  const handlePay = async (billingId: string) => {
    try {
      await fetch('/api/receptionist/billing', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingId, status: 'PAID', paidAmount: 0 }),
      });
      fetchBillings();
    } catch { /* */ }
  };

  // ─── Computed ───────────────────────────────────────
  const filtered = billings.filter(b => b.patient.name.toLowerCase().includes(search.toLowerCase()));
  const totalCollected = billings.filter(b => b.status === 'PAID').reduce((s, b) => s + b.totalAmount, 0);
  const totalPending = billings.filter(b => b.status !== 'PAID' && b.status !== 'CANCELLED').reduce((s, b) => s + b.totalAmount, 0);

  const catalogCategories = useMemo(() => [...new Set(services.map(s => s.category))].sort(), [services]);
  const filteredCatalog = useMemo(() => {
    let result = services;
    if (catalogFilter) result = result.filter(s => s.category === catalogFilter);
    if (catalogSearch) {
      const q = catalogSearch.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
    }
    return result;
  }, [services, catalogFilter, catalogSearch]);

  // ─── Render ─────────────────────────────────────────
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div className="page-header" variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-header__title">Billing</h1>
          <p className="page-header__subtitle">Invoice generation, payment tracking & service catalog</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <IconPlus size={14} /> New Invoice
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div className="grid-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }} variants={itemVariants}>
        <div className="glass-card stat-card">
          <div className="stat-card__label">Collected</div>
          <div className="stat-card__value" style={{ color: 'var(--success-400)' }}>₹{totalCollected.toLocaleString('en-IN')}</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-card__label">Pending</div>
          <div className="stat-card__value" style={{ color: 'var(--warning-400)' }}>₹{totalPending.toLocaleString('en-IN')}</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-card__label">Total Invoices</div>
          <div className="stat-card__value">{billings.length}</div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants} style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-4)', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', padding: 4, border: '1px solid var(--glass-border)', width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('invoices')}
          style={{
            padding: '8px 20px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: activeTab === 'invoices' ? 'var(--primary-500)' : 'transparent',
            color: activeTab === 'invoices' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IconDollarSign size={14} /> Invoices</span>
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          style={{
            padding: '8px 20px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: activeTab === 'catalog' ? 'var(--primary-500)' : 'transparent',
            color: activeTab === 'catalog' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IconList size={14} /> Service Catalog</span>
        </button>
      </motion.div>

      {/* ═══ INVOICES TAB ═══ */}
      {activeTab === 'invoices' && (
        <>
          <motion.div variants={itemVariants} style={{ marginBottom: 'var(--space-4)' }}>
            <div className="search-bar" style={{ maxWidth: 360 }}>
              <span className="search-bar__icon"><IconSearch size={16} /></span>
              <input className="search-bar__input" placeholder="Search by patient..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </motion.div>

          <motion.div className="glass-card--static data-table-container" variants={itemVariants}>
            {loading ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
                {billings.length === 0 ? 'No invoices yet. Create your first invoice!' : 'No matches found.'}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Services</th>
                    <th style={{ textAlign: 'right' }}>Total (₹)</th>
                    <th style={{ textAlign: 'right' }}>Paid (₹)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(bill => (
                    <>
                      <tr key={bill.id} onClick={() => setExpandedInvoice(expandedInvoice === bill.id ? null : bill.id)} style={{ cursor: 'pointer' }}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--primary-400)' }}>
                          {bill.invoiceNumber || '—'}
                        </td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          {new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{bill.patient.name}</td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {bill.lineItems.length > 0
                              ? bill.lineItems.slice(0, 3).map((li, i) => (
                                <span key={i} className="badge badge-neutral" style={{ fontSize: '0.6rem' }}>{li.serviceName}</span>
                              ))
                              : (Array.isArray(bill.items) ? bill.items : []).slice(0, 3).map((item: string, i: number) => (
                                <span key={i} className="badge badge-neutral" style={{ fontSize: '0.6rem' }}>{item}</span>
                              ))
                            }
                            {(bill.lineItems.length > 3 || (Array.isArray(bill.items) && bill.items.length > 3)) && (
                              <span className="badge badge-neutral" style={{ fontSize: '0.6rem' }}>+{Math.max(bill.lineItems.length, Array.isArray(bill.items) ? bill.items.length : 0) - 3} more</span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          ₹{bill.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: bill.paidAmount >= bill.totalAmount ? 'var(--success-400)' : 'var(--text-muted)' }}>
                          ₹{(bill.paidAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td><span className={`badge badge-${statusColors[bill.status] || 'neutral'}`}>{bill.status.replace('_', ' ')}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--space-1)' }} onClick={e => e.stopPropagation()}>
                            {bill.status !== 'PAID' && bill.status !== 'CANCELLED' && (
                              <button className="btn btn-sm btn-success" onClick={() => handlePay(bill.id)}>
                                <IconCheck size={12} /> Pay
                              </button>
                            )}
                            <button className="btn btn-sm btn-ghost" onClick={() => window.open(`/api/pdf/invoice/${bill.id}`, '_blank')}>
                              <IconDownload size={12} /> PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Row — Line Item Breakdown */}
                      {expandedInvoice === bill.id && bill.lineItems.length > 0 && (
                        <tr key={`${bill.id}-detail`}>
                          <td colSpan={8} style={{ padding: 0 }}>
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              style={{ background: 'rgba(99, 102, 241, 0.03)', borderTop: '1px solid var(--border-secondary)' }}
                            >
                              <table style={{ width: '100%', fontSize: 'var(--text-xs)' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                    <th style={{ padding: '8px 16px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Service Name</th>
                                    <th style={{ padding: '8px 16px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Category</th>
                                    <th style={{ padding: '8px 16px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Unit</th>
                                    <th style={{ padding: '8px 16px', color: 'var(--text-tertiary)', fontWeight: 600, textAlign: 'right' }}>Unit Price (₹)</th>
                                    <th style={{ padding: '8px 16px', color: 'var(--text-tertiary)', fontWeight: 600, textAlign: 'center' }}>Qty</th>
                                    <th style={{ padding: '8px 16px', color: 'var(--text-tertiary)', fontWeight: 600, textAlign: 'right' }}>Tax (₹)</th>
                                    <th style={{ padding: '8px 16px', color: 'var(--text-tertiary)', fontWeight: 600, textAlign: 'right' }}>Total (₹)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bill.lineItems.map((li) => (
                                    <tr key={li.id} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                      <td style={{ padding: '8px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>{li.serviceName}</td>
                                      <td style={{ padding: '8px 16px' }}>
                                        <span style={{
                                          display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                                          fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.03em',
                                          background: `${categoryColors[li.service.category] || '#64748b'}18`,
                                          color: categoryColors[li.service.category] || '#64748b',
                                        }}>
                                          {li.service.category.replace('_', ' ')}
                                        </span>
                                      </td>
                                      <td style={{ padding: '8px 16px', color: 'var(--text-muted)' }}>{li.service.unit}</td>
                                      <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₹{li.unitPrice.toLocaleString('en-IN')}</td>
                                      <td style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 600 }}>{li.quantity}</td>
                                      <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>₹{li.taxAmount.toFixed(2)}</td>
                                      <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>₹{li.totalAmount.toLocaleString('en-IN')}</td>
                                    </tr>
                                  ))}
                                  {/* Summary row */}
                                  <tr>
                                    <td colSpan={5}></td>
                                    <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Grand Total:</td>
                                    <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary-400)', fontSize: 'var(--text-sm)' }}>
                                      ₹{bill.totalAmount.toLocaleString('en-IN')}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        </>
      )}

      {/* ═══ SERVICE CATALOG TAB ═══ */}
      {activeTab === 'catalog' && (
        <>
          <motion.div variants={itemVariants} style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
              <div className="search-bar" style={{ maxWidth: 320 }}>
                <span className="search-bar__icon"><IconSearch size={16} /></span>
                <input className="search-bar__input" placeholder="Search services..." value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                <button
                  className={`btn btn-sm ${!catalogFilter ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setCatalogFilter('')}
                  style={{ fontSize: '0.7rem' }}
                >All</button>
                {catalogCategories.map(cat => (
                  <button
                    key={cat}
                    className={`btn btn-sm ${catalogFilter === cat ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setCatalogFilter(catalogFilter === cat ? '' : cat)}
                    style={{ fontSize: '0.7rem' }}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => { setSvcFormError(''); setShowServiceModal(true); }}>
              <IconPlus size={14} /> Add Service
            </button>
          </motion.div>

          <motion.div className="glass-card--static data-table-container" variants={itemVariants}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Service Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th style={{ textAlign: 'right' }}>Unit Price (₹)</th>
                  <th style={{ textAlign: 'right' }}>Tax (%)</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalog.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>No services found.</td></tr>
                ) : filteredCatalog.map(svc => (
                  <tr key={svc.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--primary-400)' }}>{svc.code}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{svc.name}</td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-sm)',
                        fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.03em',
                        background: `${categoryColors[svc.category] || '#64748b'}18`,
                        color: categoryColors[svc.category] || '#64748b',
                      }}>
                        {svc.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{svc.unit}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>₹{svc.unitPrice.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{svc.taxRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </>
      )}

      {/* ═══ NEW INVOICE MODAL ═══ */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div
              className="modal-content"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            >
              <div className="modal-header">
                <h2>New Invoice</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><IconX size={16} /></button>
              </div>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {/* Patient Selection */}
                    <div className="input-group">
                      <label className="input-label">Patient *</label>
                      <select className="select-field" value={formPatientId} onChange={e => setFormPatientId(e.target.value)} required>
                        <option value="">Select patient...</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>)}
                      </select>
                    </div>

                    {/* Payment Method */}
                    <div className="input-group">
                      <label className="input-label">Payment Method</label>
                      <select className="select-field" value={formPaymentMethod} onChange={e => setFormPaymentMethod(e.target.value)}>
                        <option value="">Select method...</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="Insurance">Insurance</option>
                      </select>
                    </div>

                    {/* Service Picker */}
                    <div className="input-group" style={{ position: 'relative' }}>
                      <label className="input-label">Add Services *</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="input-field"
                          placeholder="Search services by name or code..."
                          value={serviceSearch}
                          onChange={e => { setServiceSearch(e.target.value); setShowServiceDropdown(true); }}
                          onFocus={() => setShowServiceDropdown(true)}
                        />
                        {/* Dropdown */}
                        {showServiceDropdown && filteredServices.length > 0 && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                            background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)', maxHeight: 200, overflowY: 'auto',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                          }}>
                            {filteredServices.map(svc => (
                              <button
                                key={svc.id}
                                type="button"
                                onClick={() => addServiceToInvoice(svc)}
                                style={{
                                  display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center',
                                  padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
                                  color: 'var(--text-primary)', fontSize: 'var(--text-sm)', borderBottom: '1px solid var(--border-secondary)',
                                  transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                <div style={{ textAlign: 'left' }}>
                                  <div style={{ fontWeight: 600 }}>{svc.name}</div>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{svc.code} · {svc.category.replace('_', ' ')} · {svc.unit}</div>
                                </div>
                                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary-400)' }}>₹{svc.unitPrice.toLocaleString('en-IN')}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {showServiceDropdown && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowServiceDropdown(false)} />
                      )}
                    </div>

                    {/* Line Items Table */}
                    {formLineItems.length > 0 && (
                      <div style={{ border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', fontSize: 'var(--text-xs)', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: 'rgba(99,102,241,0.05)', borderBottom: '1px solid var(--border-secondary)' }}>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-tertiary)', fontWeight: 600 }}>Service</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-tertiary)', fontWeight: 600 }}>Unit Price</th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-tertiary)', fontWeight: 600 }}>Unit</th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-tertiary)', fontWeight: 600, width: 80 }}>Qty</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-tertiary)', fontWeight: 600 }}>Tax</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-tertiary)', fontWeight: 600 }}>Total</th>
                              <th style={{ padding: '8px 4px', width: 36 }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formLineItems.map(li => (
                              <tr key={li.serviceId} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                <td style={{ padding: '8px 12px' }}>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{li.serviceName}</div>
                                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{li.code} · {li.category.replace('_', ' ')}</div>
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                  <input
                                    type="number" min={0} value={li.unitPrice}
                                    onChange={e => updateLineItemPrice(li.serviceId, parseFloat(e.target.value) || 0)}
                                    style={{
                                      width: 80, padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                                      border: '1px solid var(--border-secondary)', background: 'var(--bg-secondary)',
                                      color: 'var(--text-primary)', textAlign: 'right'
                                    }}
                                  />
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                  <input
                                    type="text" value={li.unit}
                                    onChange={e => updateLineItemUnit(li.serviceId, e.target.value)}
                                    style={{
                                      width: 70, padding: '4px', borderRadius: 'var(--radius-sm)',
                                      border: '1px solid var(--border-secondary)', background: 'var(--bg-secondary)',
                                      color: 'var(--text-primary)', textAlign: 'center', fontSize: '0.65rem'
                                    }}
                                  />
                                </td>
                                <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                                  <input
                                    type="number" min={1} value={li.quantity}
                                    onChange={e => updateLineItemQty(li.serviceId, parseInt(e.target.value) || 1)}
                                    style={{
                                      width: 56, textAlign: 'center', padding: '4px', borderRadius: 'var(--radius-sm)',
                                      border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)',
                                      color: 'var(--text-primary)', fontWeight: 600, fontSize: 'var(--text-xs)',
                                    }}
                                  />
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                  ₹{li.taxAmount.toFixed(2)}
                                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{li.taxRate}%</div>
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary-400)' }}>
                                  ₹{li.totalAmount.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '4px' }}>
                                  <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeLineItem(li.serviceId)} style={{ color: 'var(--danger-400)' }}>
                                    <IconTrash size={13} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Totals */}
                        <div style={{ padding: '12px 16px', background: 'rgba(99,102,241,0.03)', borderTop: '1px solid var(--border-secondary)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            <span>Subtotal</span><span style={{ fontFamily: 'var(--font-mono)' }}>₹{invoiceSubtotal.toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            <span>Tax</span><span style={{ fontFamily: 'var(--font-mono)' }}>₹{invoiceTax.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            <span>Discount</span>
                            <input
                              type="number" min={0} value={formDiscount}
                              onChange={e => setFormDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                              style={{
                                width: 80, textAlign: 'right', padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-secondary)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                            <span style={{ color: 'var(--text-primary)' }}>Grand Total</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-400)', fontSize: 'var(--text-base)' }}>₹{invoiceGrandTotal.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {formError && (
                      <div style={{ padding: 'var(--space-3)', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--danger-400)' }}>
                        {formError}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={formLoading || formLineItems.length === 0}>
                    {formLoading ? 'Creating...' : `Create Invoice — ₹${invoiceGrandTotal.toLocaleString('en-IN')}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ NEW SERVICE MODAL ═══ */}
      <AnimatePresence>
        {showServiceModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowServiceModal(false)}>
            <motion.div
              className="modal-content"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 560 }}
            >
              <div className="modal-header">
                <h2>Add New Service</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowServiceModal(false)}><IconX size={16} /></button>
              </div>
              <form onSubmit={handleCreateService}>
                <div className="modal-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="input-label">Service Name *</label>
                      <input className="input-field" placeholder="e.g. Full Body Checkup" value={svcForm.name} onChange={e => setSvcForm(p => ({ ...p, name: e.target.value }))} required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Service Code *</label>
                      <input className="input-field" placeholder="e.g. FBC-001" value={svcForm.code} onChange={e => setSvcForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Category *</label>
                      <select className="select-field" value={svcForm.category} onChange={e => setSvcForm(p => ({ ...p, category: e.target.value }))} required>
                        {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Unit Price (₹) *</label>
                      <input className="input-field" type="number" min="0" step="0.01" placeholder="0.00" value={svcForm.unitPrice} onChange={e => setSvcForm(p => ({ ...p, unitPrice: e.target.value }))} required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Unit *</label>
                      <input className="input-field" placeholder="e.g. per session, per test" value={svcForm.unit} onChange={e => setSvcForm(p => ({ ...p, unit: e.target.value }))} required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Tax Rate (%)</label>
                      <input className="input-field" type="number" min="0" max="100" step="0.1" placeholder="0" value={svcForm.taxRate} onChange={e => setSvcForm(p => ({ ...p, taxRate: e.target.value }))} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Department</label>
                      <input className="input-field" placeholder="e.g. Radiology" value={svcForm.department} onChange={e => setSvcForm(p => ({ ...p, department: e.target.value }))} />
                    </div>
                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="input-label">Description</label>
                      <input className="input-field" placeholder="Brief description of the service" value={svcForm.description} onChange={e => setSvcForm(p => ({ ...p, description: e.target.value }))} />
                    </div>
                  </div>
                  {svcFormError && (
                    <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--danger-400)' }}>
                      {svcFormError}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowServiceModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={svcFormLoading}>
                    {svcFormLoading ? 'Creating...' : 'Add Service'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ TOAST NOTIFICATION ═══ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 9999,
              background: toast.type === 'success' ? 'var(--success-50)' : 'var(--danger-50)',
              color: toast.type === 'success' ? 'var(--success-700)' : 'var(--danger-700)',
              padding: '16px 24px',
              borderRadius: 'var(--radius-lg)',
              border: `1px solid ${toast.type === 'success' ? 'var(--success-200)' : 'var(--danger-200)'}`,
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontWeight: 500,
            }}
          >
            {toast.type === 'success' ? (
              <div style={{ background: 'var(--success-500)', color: 'white', borderRadius: '50%', padding: '4px' }}><IconCheck size={16} /></div>
            ) : (
              <div style={{ background: 'var(--danger-500)', color: 'white', borderRadius: '50%', padding: '4px' }}><IconAlertCircle size={16} /></div>
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
