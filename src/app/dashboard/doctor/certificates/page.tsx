'use client';

import { useState, useEffect } from 'react';
import { IconPlus, IconRefresh, IconSearch, IconFileText, IconCheck, IconX, IconAlertCircle, IconDownload } from '@/client/components/icons';
import { motion, AnimatePresence } from 'framer-motion';
import '@/client/styles/receptionist.css'; // For modal styles

export default function CertificateManagementPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [formData, setFormData] = useState({
    patientId: '',
    type: 'BIRTH',
    newbornName: '',
    newbornGender: 'MALE',
    birthWeight: '',
    birthTime: '',
    motherName: '',
    fatherName: '',
    placeOfBirth: ''
  });

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/doctor/certificates');
      const data = await res.json();
      if (data.certificates) setCertificates(data.certificates);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/doctor/patients?all=true');
      const data = await res.json();
      if (data.patients) setPatients(data.patients);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCertificates();
    fetchPatients();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      const patient = patients.find(p => p.id === formData.patientId);

      let payload: any = {
        patientId: formData.patientId,
        type: formData.type,
      };

      if (formData.type === 'BIRTH') {
        payload = {
          ...payload,
          newbornName: formData.newbornName || undefined,
          newbornGender: formData.newbornGender || undefined,
          birthWeight: formData.birthWeight ? parseFloat(formData.birthWeight) : undefined,
          birthTime: formData.birthTime ? new Date(formData.birthTime).toISOString() : undefined,
          motherName: formData.motherName || (patient ? patient.name : undefined),
          fatherName: formData.fatherName || undefined,
          placeOfBirth: formData.placeOfBirth || undefined,
        };
      } else if (formData.type === 'DEATH') {
        payload = {
          ...payload,
          dateOfDeath: formData.birthTime ? new Date(formData.birthTime).toISOString() : undefined,
          timeOfDeath: formData.birthTime ? new Date(formData.birthTime).toISOString() : undefined,
          attendingPhysician: formData.fatherName || undefined,
          causeOfDeath: formData.motherName || undefined,
          mannerOfDeath: formData.newbornGender || undefined,
        };
      }

      const res = await fetch('/api/doctor/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to create certificate');
      }

      setShowModal(false);
      setFormData({
        patientId: '', type: 'BIRTH', newbornName: '', newbornGender: 'MALE',
        birthWeight: '', birthTime: '', motherName: '', fatherName: '', placeOfBirth: ''
      });
      fetchCertificates();
      showToast('Certificate created successfully!', 'success');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSign = async (certId: string) => {
    try {
      const res = await fetch('/api/doctor/certificates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId: certId }),
      });
      if (!res.ok) throw new Error('Failed to sign');
      fetchCertificates();
      showToast('Certificate digitally signed!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to sign certificate', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Certificates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage, draft, and digitally sign patient certificates.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchCertificates} className="btn btn-secondary">
            <IconRefresh size={18} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <IconPlus size={18} /> Issue Certificate
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Patient or Cert #..."
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-3">Cert #</th>
                <th className="px-6 py-3">Patient</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Issue Date</th>
                <th className="px-6 py-3 text-center">Signature Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading certificates...</td></tr>
              ) : certificates.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No certificates issued yet.</td></tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-blue-600">{cert.certificateNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{cert.patient?.name}</div>
                      <div className="text-xs text-gray-500">{cert.patient?.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {cert.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(cert.issuedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        cert.isSigned ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {cert.isSigned ? 'SIGNED' : 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!cert.isSigned ? (
                        <button className="text-blue-600 hover:text-blue-800 font-medium text-sm" onClick={() => handleSign(cert.id)}>Sign</button>
                      ) : (
                        <button className="text-gray-600 hover:text-gray-800 font-medium text-sm" onClick={() => window.open(`/api/pdf/certificate/${cert.id}`, '_blank')}><IconDownload size={14} className="inline mr-1" /> PDF</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Issue Certificate Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="modal-content" style={{ maxWidth: '600px' }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Issue Birth Certificate</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><IconX size={16} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="input-label">Select Patient *</label>
                      <select className="select-field" value={formData.patientId} onChange={e => setFormData({ ...formData, patientId: e.target.value })} required>
                        <option value="">Choose a patient...</option>
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                        ))}
                      </select>
                    </div>

                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="input-label">Certificate Type *</label>
                      <select className="select-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} required>
                        <option value="BIRTH">Birth Certificate</option>
                        <option value="DEATH">Death Certificate</option>
                      </select>
                    </div>

                    {formData.type === 'BIRTH' && (
                      <>
                        <div className="input-group">
                          <label className="input-label">Newborn Name (Optional)</label>
                          <input className="input-field" placeholder="e.g., Baby Doe" value={formData.newbornName} onChange={e => setFormData({ ...formData, newbornName: e.target.value })} />
                        </div>

                        <div className="input-group">
                          <label className="input-label">Gender</label>
                          <select className="select-field" value={formData.newbornGender} onChange={e => setFormData({ ...formData, newbornGender: e.target.value })}>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>

                        <div className="input-group">
                          <label className="input-label">Birth Weight (kg)</label>
                          <input className="input-field" type="number" step="0.01" placeholder="e.g., 3.2" value={formData.birthWeight} onChange={e => setFormData({ ...formData, birthWeight: e.target.value })} required={formData.type === 'BIRTH'} />
                        </div>

                        <div className="input-group">
                          <label className="input-label">Date & Time of Birth *</label>
                          <input className="input-field" type="datetime-local" value={formData.birthTime} onChange={e => setFormData({ ...formData, birthTime: e.target.value })} required={formData.type === 'BIRTH'} />
                        </div>

                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="input-label">Father's Name (Optional)</label>
                          <input className="input-field" placeholder="Father's full name" value={formData.fatherName} onChange={e => setFormData({ ...formData, fatherName: e.target.value })} />
                        </div>

                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="input-label">Place of Birth (Optional)</label>
                          <input className="input-field" placeholder="Leave blank to use Hospital Name" value={formData.placeOfBirth} onChange={e => setFormData({ ...formData, placeOfBirth: e.target.value })} />
                        </div>
                      </>
                    )}

                    {formData.type === 'DEATH' && (
                      <>
                        <div className="input-group">
                          <label className="input-label">Date & Time of Death *</label>
                          <input className="input-field" type="datetime-local" value={formData.birthTime} onChange={e => setFormData({ ...formData, birthTime: e.target.value })} required={formData.type === 'DEATH'} />
                        </div>

                        <div className="input-group">
                          <label className="input-label">Attending Physician *</label>
                          <input className="input-field" placeholder="Doctor's Name" value={formData.fatherName} onChange={e => setFormData({ ...formData, fatherName: e.target.value })} required={formData.type === 'DEATH'} />
                        </div>

                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="input-label">Cause of Death *</label>
                          <input className="input-field" placeholder="Primary cause of death" value={formData.motherName} onChange={e => setFormData({ ...formData, motherName: e.target.value })} required={formData.type === 'DEATH'} />
                        </div>

                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="input-label">Manner of Death (Optional)</label>
                          <select className="select-field" value={formData.newbornGender} onChange={e => setFormData({ ...formData, newbornGender: e.target.value })}>
                            <option value="">Select manner...</option>
                            <option value="NATURAL">Natural</option>
                            <option value="ACCIDENT">Accident</option>
                            <option value="SUICIDE">Suicide</option>
                            <option value="HOMICIDE">Homicide</option>
                            <option value="PENDING">Pending Investigation</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  {error && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', fontSize: '14px', color: '#ef4444' }}>
                      {error}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={formLoading}>
                    {formLoading ? 'Creating...' : 'Issue Certificate'}
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
              position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
              background: toast.type === 'success' ? 'var(--success-50)' : 'var(--danger-50)',
              color: toast.type === 'success' ? 'var(--success-700)' : 'var(--danger-700)',
              padding: '16px 24px', borderRadius: 'var(--radius-lg)',
              border: `1px solid ${toast.type === 'success' ? 'var(--success-200)' : 'var(--danger-200)'}`,
              boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500,
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
    </div>
  );
}
