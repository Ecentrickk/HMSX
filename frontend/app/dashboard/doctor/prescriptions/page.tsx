'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { IconSearch, IconPlus, IconX, IconEdit, IconCheck } from '@/client/components/icons';

interface MedicationInput { name: string; dosage: string; frequency: string; duration: string; instructions: string }
interface PrescriptionRecord {
  id: string;
  isSigned: boolean;
  signedAt: string | null;
  notes: string | null;
  createdAt: string;
  patient: { name: string; phone: string };
  medications: { id: string; name: string; dosage: string; frequency: string; duration: string; instructions: string | null }[];
}
interface PatientOption { id: string; name: string; phone: string }

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const EMPTY_MED: MedicationInput = { name: '', dosage: '', frequency: 'Once daily', duration: '30 days', instructions: '' };

export default function DoctorPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'SIGNED' | 'DRAFT'>('ALL');
  const [formData, setFormData] = useState({ patientId: '', notes: '' });
  const [medications, setMedications] = useState<MedicationInput[]>([{ ...EMPTY_MED }]);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [signingId, setSigningId] = useState<string | null>(null);

  const fetchPrescriptions = useCallback(async () => {
    try {
      const res = await fetch('/api/doctor/prescriptions');
      if (res.ok) { const data = await res.json(); setPrescriptions(data.prescriptions); }
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch('/api/doctor/patients');
      if (res.ok) { const data = await res.json(); setPatients(data.patients); }
    } catch { /* */ }
  }, []);

  useEffect(() => { fetchPrescriptions(); fetchPatients(); }, [fetchPrescriptions, fetchPatients]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (medications.every(m => !m.name.trim())) { setFormError('Add at least one medication'); return; }
    setFormLoading(true);
    try {
      const res = await fetch('/api/doctor/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formData.patientId,
          notes: formData.notes || null,
          medications: medications.filter(m => m.name.trim()),
        }),
      });
      if (!res.ok) { const d = await res.json(); setFormError(d.error || 'Failed'); setFormLoading(false); return; }
      setShowModal(false);
      setFormData({ patientId: '', notes: '' });
      setMedications([{ ...EMPTY_MED }]);
      fetchPrescriptions();
    } catch { setFormError('Network error'); } finally { setFormLoading(false); }
  };

  const handleSign = async (id: string) => {
    setSigningId(id);
    try {
      const res = await fetch(`/api/doctor/prescriptions/${id}/sign`, { method: 'POST' });
      if (res.ok) { fetchPrescriptions(); }
    } catch { /* */ } finally { setSigningId(null); }
  };

  const addMed = () => setMedications(prev => [...prev, { ...EMPTY_MED }]);
  const removeMed = (i: number) => setMedications(prev => prev.filter((_, idx) => idx !== i));
  const updateMed = (i: number, field: keyof MedicationInput, val: string) => {
    setMedications(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };

  const filtered = prescriptions.filter(p => {
    const matchSearch = p.patient.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || (filter === 'SIGNED' ? p.isSigned : !p.isSigned);
    return matchSearch && matchFilter;
  });

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="page-header" variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-header__title">Prescriptions</h1>
          <p className="page-header__subtitle">Create, manage, and sign prescriptions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <IconPlus size={14} /> New Prescription
        </button>
      </motion.div>

      <motion.div className="pharmacy-toolbar" variants={itemVariants}>
        <div className="search-bar" style={{ maxWidth: 360 }}>
          <span className="search-bar__icon"><IconSearch size={16} /></span>
          <input className="search-bar__input" placeholder="Search by patient..." value={search} onChange={e => setSearch(e.target.value)} />
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
            {prescriptions.length === 0 ? 'No prescriptions yet. Create one above.' : 'No matches.'}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Patient</th><th>Medications</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.patient.name}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {p.medications.map(m => (
                        <span key={m.id} className="badge badge-neutral" style={{ fontSize: '0.6rem' }}>
                          {m.name} {m.dosage}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                    {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <span className={`badge ${p.isSigned ? 'badge-success' : 'badge-warning'}`}>
                      {p.isSigned ? 'Signed' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    {!p.isSigned && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleSign(p.id)}
                        disabled={signingId === p.id}
                      >
                        <IconCheck size={12} /> {signingId === p.id ? 'Signing...' : 'Sign'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Create Prescription Modal */}
      {showModal && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowModal(false)}>
          <motion.div className="modal-content" style={{ maxWidth: 640 }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Prescription</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><IconX size={16} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="input-group">
                    <label className="input-label">Patient *</label>
                    <select className="select-field" value={formData.patientId} onChange={e => setFormData(p => ({ ...p, patientId: e.target.value }))} required>
                      <option value="">Select patient...</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>)}
                    </select>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                      <label className="input-label" style={{ margin: 0 }}>Medications *</label>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={addMed}><IconPlus size={12} /> Add</button>
                    </div>
                    {medications.map((med, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                        <input className="input-field" placeholder="Drug name" value={med.name} onChange={e => updateMed(i, 'name', e.target.value)} />
                        <input className="input-field" placeholder="Dosage" value={med.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} />
                        <input className="input-field" placeholder="Frequency" value={med.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)} />
                        <input className="input-field" placeholder="Duration" value={med.duration} onChange={e => updateMed(i, 'duration', e.target.value)} />
                        {medications.length > 1 && (
                          <button type="button" className="btn btn-sm btn-ghost" onClick={() => removeMed(i)}><IconX size={12} /></button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Notes</label>
                    <input className="input-field" placeholder="Additional notes" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
                  </div>

                  {formError && (
                    <div style={{ padding: 'var(--space-3)', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--danger-400)' }}>{formError}</div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? 'Creating...' : 'Create Prescription'}</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
