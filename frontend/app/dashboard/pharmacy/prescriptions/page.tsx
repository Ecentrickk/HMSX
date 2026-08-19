'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { IconCheck } from '@/client/components/icons';
import '@/client/styles/pharmacy.css';

interface PrescriptionRecord {
  id: string; patientId: string; signedAt: string; notes: string | null; createdAt: string;
  patient: { name: string; phone: string };
  doctor: { name: string; department: string | null };
  medications: { id: string; name: string; dosage: string; frequency: string; duration: string; instructions: string | null }[];
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function PharmacyPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fulfilledMeds, setFulfilledMeds] = useState<Record<string, boolean>>({});
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);

  const fetchPrescriptions = useCallback(async () => {
    try {
      const res = await fetch('/api/pharmacy/prescriptions');
      if (res.ok) { const data = await res.json(); setPrescriptions(data.prescriptions); }
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPrescriptions(); }, [fetchPrescriptions]);

  const toggleMed = (medId: string) => setFulfilledMeds(prev => ({ ...prev, [medId]: !prev[medId] }));

  const handleFulfill = async (rx: PrescriptionRecord) => {
    setFulfillingId(rx.id);
    const medIds = rx.medications.map(m => m.id).filter(id => fulfilledMeds[id]);
    if (medIds.length === 0) { setFulfillingId(null); return; }
    try {
      await fetch('/api/pharmacy/prescriptions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescriptionId: rx.id, medicationIds: medIds }),
      });
      fetchPrescriptions();
    } catch { /* */ } finally { setFulfillingId(null); }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="page-header" variants={itemVariants}>
        <h1 className="page-header__title">Prescription Queue</h1>
        <p className="page-header__subtitle">Fulfill signed prescriptions — Medication list only (diagnosis data restricted)</p>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card--accent"
        style={{ padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-6)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          <strong>Data Encapsulation Active</strong> — You can view medication lists but patient diagnosis data is restricted to authorized personnel only.
        </span>
      </motion.div>

      {loading ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading queue...</div>
      ) : prescriptions.length === 0 ? (
        <div className="glass-card--static" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>No signed prescriptions in queue</div>
      ) : (
        <div className="rx-queue">
          {prescriptions.map(rx => (
            <motion.div key={rx.id} className="glass-card rx-queue-item" variants={itemVariants} whileHover={{ y: -2 }}>
              <div style={{ flex: 1 }}>
                <div className="rx-queue-item__header">
                  <div>
                    <div className="rx-queue-item__patient">{rx.patient.name}</div>
                    <div className="rx-queue-item__doctor">{rx.doctor.name} — {rx.doctor.department || 'General'} | {new Date(rx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                  </div>
                  <span className="badge badge-primary">SIGNED</span>
                </div>
                <div className="rx-queue-item__meds">
                  {rx.medications.map(med => {
                    const isDone = fulfilledMeds[med.id] || false;
                    return (
                      <div key={med.id} className="rx-queue-item__med" style={{ opacity: isDone ? 0.5 : 1, textDecoration: isDone ? 'line-through' : 'none' }}>
                        <button className={`rx-queue-item__med-check ${isDone ? 'rx-queue-item__med-check--done' : ''}`} onClick={() => toggleMed(med.id)}>
                          {isDone && <IconCheck size={10} />}
                        </button>
                        <strong>{med.name}</strong>
                        <span style={{ color: 'var(--text-muted)' }}>— {med.dosage}, {med.frequency}{med.duration ? `, ${med.duration}` : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rx-queue-item__actions">
                <button className="btn btn-sm btn-success" onClick={() => handleFulfill(rx)} disabled={fulfillingId === rx.id || !rx.medications.some(m => fulfilledMeds[m.id])}>
                  <IconCheck size={12} /> {fulfillingId === rx.id ? 'Fulfilling...' : 'Fulfill Checked'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
