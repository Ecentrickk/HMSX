'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IconSearch, IconPlus, IconX, IconUser } from '@/client/components/icons';

interface PatientRecord {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string | null;
  address: string | null;
  createdAt: string;
  _count: { appointments: number };
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function ReceptionistPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', dateOfBirth: '', gender: 'MALE', bloodGroup: '', address: '', emergencyContact: '', emergencyPhone: '' });
  const [admissionType, setAdmissionType] = useState('NONE');
  const [attendingDoctorId, setAttendingDoctorId] = useState('');
  const [doctors, setDoctors] = useState<{id: string, name: string, department: string}[]>([]);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetch('/api/receptionist/doctors')
      .then(res => res.json())
      .then(data => { if (data.doctors) setDoctors(data.doctors); })
      .catch(console.error);
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch('/api/receptionist/patients');
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients);
      }
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const res = await fetch('/api/receptionist/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || 'Failed to register');
        setFormLoading(false);
        return;
      }
      
      const { patient } = await res.json();

      // If admission is requested, create admission
      if (admissionType !== 'NONE') {
        if (!attendingDoctorId) {
          setFormError('Please select an attending doctor for admission.');
          setFormLoading(false);
          return;
        }

        const admRes = await fetch('/api/receptionist/admissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: patient.id,
            admissionType,
            attendingDoctorId,
          }),
        });

        if (!admRes.ok) {
          const admData = await admRes.json();
          setFormError(`Patient registered, but admission failed: ${admData.error}`);
          setFormLoading(false);
          return;
        }
      }

      setShowModal(false);
      setFormData({ name: '', phone: '', email: '', dateOfBirth: '', gender: 'MALE', bloodGroup: '', address: '', emergencyContact: '', emergencyPhone: '' });
      setAdmissionType('NONE');
      setAttendingDoctorId('');
      fetchPatients();
    } catch { setFormError('Network error'); } finally { setFormLoading(false); }
  };

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search));

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="page-header" variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-header__title">Patient Registry</h1>
          <p className="page-header__subtitle">Register and manage patient records</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <IconPlus size={14} /> Register Patient
        </button>
      </motion.div>

      <motion.div variants={itemVariants} style={{ marginBottom: 'var(--space-4)' }}>
        <div className="search-bar" style={{ maxWidth: 360 }}>
          <span className="search-bar__icon"><IconSearch size={16} /></span>
          <input className="search-bar__input" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </motion.div>

      <motion.div className="glass-card--static data-table-container" variants={itemVariants}>
        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading patients...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
            {patients.length === 0 ? 'No patients registered yet.' : 'No patients match your search.'}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Patient</th><th>Phone</th><th>Gender</th><th>Blood Group</th><th>Age</th><th>Appointments</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const age = Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / 31557600000);
                return (
                  <tr 
                    key={p.id} 
                    onClick={() => router.push(`/dashboard/patient/${p.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <div className="avatar avatar--sm"><IconUser size={14} /></div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{p.phone}</td>
                    <td><span className="badge badge-neutral">{p.gender}</span></td>
                    <td>{p.bloodGroup || '—'}</td>
                    <td>{age} yrs</td>
                    <td>{p._count.appointments}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Register Patient Modal */}
      {showModal && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowModal(false)}>
          <motion.div className="modal-content" initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Register Patient</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><IconX size={16} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="input-group">
                    <label className="input-label">Full Name *</label>
                    <input className="input-field" placeholder="Patient name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="input-group">
                      <label className="input-label">Phone *</label>
                      <input className="input-field" placeholder="+91 98765 43210" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Email</label>
                      <input className="input-field" type="email" placeholder="Optional" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="input-group">
                      <label className="input-label">Date of Birth *</label>
                      <input className="input-field" type="date" value={formData.dateOfBirth} onChange={e => setFormData(p => ({ ...p, dateOfBirth: e.target.value }))} required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Gender *</label>
                      <select className="select-field" value={formData.gender} onChange={e => setFormData(p => ({ ...p, gender: e.target.value }))}>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Blood Group</label>
                      <input className="input-field" placeholder="e.g. O+" value={formData.bloodGroup} onChange={e => setFormData(p => ({ ...p, bloodGroup: e.target.value }))} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Address</label>
                    <input className="input-field" placeholder="Full address" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="input-group">
                      <label className="input-label">Emergency Contact</label>
                      <input className="input-field" placeholder="Contact name" value={formData.emergencyContact} onChange={e => setFormData(p => ({ ...p, emergencyContact: e.target.value }))} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Emergency Phone</label>
                      <input className="input-field" placeholder="Phone number" value={formData.emergencyPhone} onChange={e => setFormData(p => ({ ...p, emergencyPhone: e.target.value }))} />
                    </div>
                  </div>
                  
                  {/* Admission Options */}
                  <div style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-secondary)' }}>
                    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>Initial Admission (Optional)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                      <div className="input-group">
                        <label className="input-label">Admission Type</label>
                        <select className="select-field" value={admissionType} onChange={e => setAdmissionType(e.target.value)}>
                          <option value="NONE">None (Registration Only)</option>
                          <option value="OPD">Outpatient (OPD)</option>
                          <option value="IPD">Inpatient (IPD)</option>
                        </select>
                      </div>
                      
                      {admissionType !== 'NONE' && (
                        <div className="input-group">
                          <label className="input-label">Attending Doctor *</label>
                          <select className="select-field" value={attendingDoctorId} onChange={e => setAttendingDoctorId(e.target.value)} required={admissionType !== 'NONE'}>
                            <option value="">Select Doctor...</option>
                            {doctors.map(d => (
                              <option key={d.id} value={d.id}>Dr. {d.name} ({d.department})</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {formError && (
                    <div style={{ padding: 'var(--space-3)', background: 'rgba(113,113,122,0.08)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{formError}</div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? 'Registering...' : 'Register Patient'}</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
