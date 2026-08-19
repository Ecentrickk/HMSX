'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { IconSearch, IconPlus, IconX, IconCheck } from '@/client/components/icons';

interface ReportRecord {
  id: string;
  type: string;
  title: string;
  content: string;
  isSigned: boolean;
  isLocked: boolean;
  signedAt: string | null;
  createdAt: string;
  patient: { name: string; phone: string };
}
interface PatientOption { id: string; name: string; phone: string }

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const REPORT_TYPES = ['Cardiology', 'Pathology', 'Radiology', 'Neurology', 'General', 'Surgical', 'Psychiatric'];

export default function DoctorReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'SIGNED' | 'DRAFT'>('ALL');
  const [formData, setFormData] = useState({ patientId: '', type: 'General', title: '', content: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [signingId, setSigningId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/doctor/reports');
      if (res.ok) { const data = await res.json(); setReports(data.reports); }
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch('/api/receptionist/patients');
      if (res.ok) { const data = await res.json(); setPatients(data.patients); }
    } catch { /* */ }
  }, []);

  useEffect(() => { fetchReports(); fetchPatients(); }, [fetchReports, fetchPatients]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const res = await fetch('/api/doctor/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) { const d = await res.json(); setFormError(d.error || 'Failed'); setFormLoading(false); return; }
      setShowModal(false);
      setFormData({ patientId: '', type: 'General', title: '', content: '' });
      fetchReports();
    } catch { setFormError('Network error'); } finally { setFormLoading(false); }
  };

  const handleSign = async (id: string) => {
    setSigningId(id);
    try {
      const res = await fetch(`/api/doctor/reports/${id}/sign`, { method: 'POST' });
      if (res.ok) fetchReports();
    } catch { /* */ } finally { setSigningId(null); }
  };

  const filtered = reports.filter(r => {
    const matchSearch = r.patient.name.toLowerCase().includes(search.toLowerCase()) || r.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || (filter === 'SIGNED' ? r.isSigned : !r.isSigned);
    return matchSearch && matchFilter;
  });

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="page-header" variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-header__title">Reports</h1>
          <p className="page-header__subtitle">Create, review, and sign medical reports</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <IconPlus size={14} /> New Report
        </button>
      </motion.div>

      <motion.div className="pharmacy-toolbar" variants={itemVariants}>
        <div className="search-bar" style={{ maxWidth: 360 }}>
          <span className="search-bar__icon"><IconSearch size={16} /></span>
          <input className="search-bar__input" placeholder="Search by patient or title..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="pharmacy-filters">
          {(['ALL', 'SIGNED', 'DRAFT'] as const).map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'All' : f === 'SIGNED' ? 'Signed' : 'Drafts'}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div className="glass-card--static data-table-container" variants={itemVariants}>
        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
            {reports.length === 0 ? 'No reports yet.' : 'No matches.'}
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Patient</th><th>Title</th><th>Type</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.patient.name}</td>
                  <td>{r.title}</td>
                  <td><span className="badge badge-neutral">{r.type}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                  <td>
                    <span className={`badge ${r.isSigned ? 'badge-success' : 'badge-warning'}`}>
                      {r.isSigned ? 'Signed' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    {!r.isSigned && (
                      <button className="btn btn-sm btn-success" onClick={() => handleSign(r.id)} disabled={signingId === r.id}>
                        <IconCheck size={12} /> {signingId === r.id ? 'Signing...' : 'Sign & Lock'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {showModal && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowModal(false)}>
          <motion.div className="modal-content" style={{ maxWidth: 600 }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Report</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><IconX size={16} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="input-group">
                    <label className="input-label">Patient *</label>
                    <select className="select-field" value={formData.patientId} onChange={e => setFormData(p => ({ ...p, patientId: e.target.value }))} required>
                      <option value="">Select patient...</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="input-group">
                      <label className="input-label">Type *</label>
                      <select className="select-field" value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}>
                        {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Title *</label>
                      <input className="input-field" placeholder="Report title" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Content *</label>
                    <textarea className="input-field" placeholder="Report content and findings..." value={formData.content} onChange={e => setFormData(p => ({ ...p, content: e.target.value }))} required style={{ minHeight: 120, resize: 'vertical' }} />
                  </div>
                  {formError && (
                    <div style={{ padding: 'var(--space-3)', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--danger-400)' }}>{formError}</div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? 'Creating...' : 'Create Report'}</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
