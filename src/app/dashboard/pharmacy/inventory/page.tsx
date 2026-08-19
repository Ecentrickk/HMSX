'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { IconSearch, IconPlus, IconX } from '@/client/components/icons';
import '@/client/styles/pharmacy.css';

interface InventoryRecord {
  id: string; name: string; category: string; sku: string; quantity: number;
  unit: string; reorderLevel: number; price: number; supplier: string | null;
  expiryDate: string | null; isActive: boolean;
}

const CATEGORIES = ['ALL', 'MEDICATION', 'PPE', 'SURGICAL_SUPPLY', 'DIAGNOSTIC_EQUIPMENT', 'CONSUMABLE'];
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function PharmacyInventoryPage() {
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name:'', category:'MEDICATION', sku:'', quantity:'0', price:'0', reorderLevel:'10', unit:'units', supplier:'', expiryDate:'' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/pharmacy/inventory');
      if (res.ok) { const data = await res.json(); setItems(data.items); }
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const filtered = useMemo(() => items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase()) || (item.supplier || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'ALL' || item.category === category;
    const matchLow = !showLowOnly || item.quantity <= item.reorderLevel;
    return matchSearch && matchCategory && matchLow;
  }), [items, search, category, showLowOnly]);

  const lowStockCount = items.filter(i => i.quantity <= i.reorderLevel).length;
  const totalValue = items.reduce((s, i) => s + i.quantity * i.price, 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(''); setFormLoading(true);
    try {
      const res = await fetch('/api/pharmacy/inventory', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, quantity: parseInt(formData.quantity), price: parseFloat(formData.price), reorderLevel: parseInt(formData.reorderLevel), expiryDate: formData.expiryDate || null }),
      });
      if (!res.ok) { const d = await res.json(); setFormError(d.error || 'Failed'); setFormLoading(false); return; }
      setShowAddModal(false); setFormData({ name:'', category:'MEDICATION', sku:'', quantity:'0', price:'0', reorderLevel:'10', unit:'units', supplier:'', expiryDate:'' }); fetchInventory();
    } catch { setFormError('Network error'); } finally { setFormLoading(false); }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="page-header" variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-header__title">Inventory Management</h1><p className="page-header__subtitle">Live stock tracking and reorder alerts</p></div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><IconPlus size={14} /> Add Stock</button>
      </motion.div>

      <motion.div className="grid-stats" variants={itemVariants}>
        <div className="glass-card stat-card"><div className="stat-card__label">Total Items</div><div className="stat-card__value">{items.length}</div></div>
        <div className="glass-card stat-card"><div className="stat-card__label">Low Stock</div><div className="stat-card__value" style={{ color: 'var(--danger-400)' }}>{lowStockCount}</div></div>
        <div className="glass-card stat-card"><div className="stat-card__label">Inventory Value</div><div className="stat-card__value" style={{ fontSize: 'var(--text-2xl)' }}>₹{totalValue.toLocaleString()}</div></div>
      </motion.div>

      <motion.div className="pharmacy-toolbar" variants={itemVariants}>
        <div className="search-bar" style={{ maxWidth: 400, flex: 1 }}>
          <span className="search-bar__icon"><IconSearch size={16} /></span>
          <input className="search-bar__input" placeholder="Search name, SKU, or supplier..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="pharmacy-filters">
          {CATEGORIES.map(cat => (<button key={cat} className={`btn btn-sm ${category === cat ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCategory(cat)}>{cat === 'ALL' ? 'All' : cat.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</button>))}
          <button className={`btn btn-sm ${showLowOnly ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setShowLowOnly(!showLowOnly)}>Low Stock Only</button>
        </div>
      </motion.div>

      <motion.div className="glass-card--static data-table-container" variants={itemVariants}>
        {loading ? <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div> : filtered.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>No items found</div>
        ) : (
          <table className="data-table"><thead><tr><th>Item</th><th>SKU</th><th>Category</th><th>Stock</th><th>Price</th><th>Supplier</th><th>Expiry</th></tr></thead>
            <tbody><AnimatePresence>{filtered.map(item => {
              const isLow = item.quantity <= item.reorderLevel;
              return (<motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} layout>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{item.sku}</td>
                <td><span className="badge badge-neutral" style={{ fontSize: '0.6rem' }}>{item.category.replace(/_/g, ' ')}</span></td>
                <td><div className="stock-indicator"><span className={`stock-value ${isLow ? 'stock-value--low' : 'stock-value--ok'}`}>{item.quantity}</span><span className="stock-unit">/ {item.reorderLevel} {item.unit}</span></div></td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>₹{item.price}</td>
                <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{item.supplier || '—'}</td>
                <td style={{ fontSize: 'var(--text-xs)' }}>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</td>
              </motion.tr>);
            })}</AnimatePresence></tbody></table>
        )}
      </motion.div>

      {showAddModal && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowAddModal(false)}>
          <motion.div className="modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Add Stock Item</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}><IconX size={16} /></button></div>
            <form onSubmit={handleAdd}><div className="modal-body"><div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group"><label className="input-label">Name *</label><input className="input-field" placeholder="Item name" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="input-group"><label className="input-label">Category</label><select className="select-field" value={formData.category} onChange={e => setFormData(p => ({...p, category: e.target.value}))}>{CATEGORIES.filter(c => c !== 'ALL').map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}</select></div>
                <div className="input-group"><label className="input-label">SKU *</label><input className="input-field" placeholder="MED-XXX" value={formData.sku} onChange={e => setFormData(p => ({...p, sku: e.target.value}))} required /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="input-group"><label className="input-label">Quantity</label><input className="input-field" type="number" value={formData.quantity} onChange={e => setFormData(p => ({...p, quantity: e.target.value}))} /></div>
                <div className="input-group"><label className="input-label">Price</label><input className="input-field" type="number" value={formData.price} onChange={e => setFormData(p => ({...p, price: e.target.value}))} /></div>
                <div className="input-group"><label className="input-label">Reorder Level</label><input className="input-field" type="number" value={formData.reorderLevel} onChange={e => setFormData(p => ({...p, reorderLevel: e.target.value}))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="input-group"><label className="input-label">Supplier</label><input className="input-field" placeholder="Supplier name" value={formData.supplier} onChange={e => setFormData(p => ({...p, supplier: e.target.value}))} /></div>
                <div className="input-group"><label className="input-label">Expiry Date</label><input className="input-field" type="date" value={formData.expiryDate} onChange={e => setFormData(p => ({...p, expiryDate: e.target.value}))} /></div>
              </div>
              {formError && <div style={{ padding: 'var(--space-3)', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--danger-400)' }}>{formError}</div>}
            </div></div>
            <div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? 'Adding...' : 'Add to Inventory'}</button></div></form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
