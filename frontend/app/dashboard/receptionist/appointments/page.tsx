'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { IconSearch, IconPlus, IconX, IconCalendar } from '@/client/components/icons';

interface AppointmentRecord {
  id: string;
  scheduledAt: string;
  status: string;
  type: string;
  notes: string | null;
  patient: { name: string; phone: string };
  doctor: { name: string; department: string | null };
}

interface DoctorOption { id: string; name: string; department: string | null }
interface PatientOption { id: string; name: string; phone: string }

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const TYPES = ['CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'ROUTINE_CHECKUP', 'PROCEDURE'];

export default function ReceptionistAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formData, setFormData] = useState({ patientId: '', doctorId: '', scheduledAt: '', type: 'CONSULTATION', notes: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch('/api/receptionist/appointments');
      if (res.ok) { const data = await res.json(); setAppointments(data.appointments); }
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  const fetchOptions = useCallback(async () => {
    try {
      const [drRes, ptRes] = await Promise.all([
        fetch('/api/doctors').then(r => r.ok ? r.json() : { doctors: [] }).catch(() => ({ doctors: [] })),
        fetch('/api/receptionist/patients').then(r => r.ok ? r.json() : { patients: [] }).catch(() => ({ patients: [] })),
      ]);
      setDoctors(drRes.doctors || []);
      setPatients(ptRes.patients || []);
    } catch { /* */ }
  }, []);

  useEffect(() => { fetchAppointments(); fetchOptions(); }, [fetchAppointments, fetchOptions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
      };
      const res = await fetch('/api/receptionist/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); setFormError(d.error || 'Failed'); setFormLoading(false); return; }
      setShowModal(false);
      setFormData({ patientId: '', doctorId: '', scheduledAt: '', type: 'CONSULTATION', notes: '' });
      fetchAppointments();
    } catch { setFormError('Network error'); } finally { setFormLoading(false); }
  };

  const filtered = appointments.filter(a => {
    const matchSearch = a.patient.name.toLowerCase().includes(search.toLowerCase()) || a.doctor.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="page-header" variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-header__title">Appointments</h1>
          <p className="page-header__subtitle">Schedule and manage patient appointments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <IconPlus size={14} /> New Appointment
        </button>
      </motion.div>

      <motion.div className="pharmacy-toolbar" variants={itemVariants}>
        <div className="search-bar" style={{ maxWidth: 360 }}>
          <span className="search-bar__icon"><IconSearch size={16} /></span>
          <input className="search-bar__input" placeholder="Search by patient or doctor..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="pharmacy-filters">
          {['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter(s)}>
              {s === 'ALL' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div className="glass-card--static data-table-container" variants={itemVariants}>
        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
            {appointments.length === 0 ? 'No appointments yet.' : 'No matches.'}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Patient</th><th>Doctor</th><th>Date/Time</th><th>Type</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.patient.name}</td>
                  <td>{a.doctor.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                    {new Date(a.scheduledAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td><span className="badge badge-neutral">{a.type.replace('_', ' ')}</span></td>
                  <td><span className={`badge ${a.status === 'COMPLETED' ? 'badge-primary' : 'badge-neutral'}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Create Appointment Modal */}
      {showModal && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowModal(false)}>
          <motion.div className="modal-content" initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Appointment</h2>
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
                  <div className="input-group">
                    <label className="input-label">Doctor *</label>
                    <select className="select-field" value={formData.doctorId} onChange={e => setFormData(p => ({ ...p, doctorId: e.target.value }))} required>
                      <option value="">Select doctor...</option>
                      {doctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.department || 'General'}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="input-group">
                      <label className="input-label">Date & Time *</label>
                      <input className="input-field" type="datetime-local" value={formData.scheduledAt} onChange={e => setFormData(p => ({ ...p, scheduledAt: e.target.value }))} required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Type</label>
                      <select className="select-field" value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}>
                        {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Notes</label>
                    <input className="input-field" placeholder="Optional notes" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                  {formError && (
                    <div style={{ padding: 'var(--space-3)', background: 'rgba(113,113,122,0.08)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{formError}</div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? 'Creating...' : 'Schedule Appointment'}</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
