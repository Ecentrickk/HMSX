'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { IconSearch } from '@/client/components/icons';
import '@/client/styles/nurse.css';

interface PatientWithVitals {
  id: string; name: string; phone: string;
  vitals: { heartRate: number|null; bloodPressureSystolic: number|null; bloodPressureDiastolic: number|null; oxygenSat: number|null; temperature: number|null; weight: number|null; recordedAt: string; recordedBy: { name: string } }[];
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function NurseMonitoringPage() {
  const [patients, setPatients] = useState<PatientWithVitals[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string|null>(null);
  const [formData, setFormData] = useState({ systolic:'', diastolic:'', heartRate:'', temperature:'', oxygenSat:'', weight:'', notes:'' });
  const [formLoading, setFormLoading] = useState(false);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch('/api/receptionist/patients');
      if (!res.ok) return;
      const data = await res.json();
      // Fetch vitals for each
      const withVitals = await Promise.all(data.patients.slice(0,20).map(async (p: any) => {
        const vRes = await fetch(`/api/nurse/vitals?patientId=${p.id}`);
        const vData = vRes.ok ? await vRes.json() : { vitals: [] };
        return { ...p, vitals: vData.vitals };
      }));
      setPatients(withVitals);
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleRecordVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setFormLoading(true);
    try {
      const res = await fetch('/api/nurse/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selectedPatient, ...formData }),
      });
      if (res.ok) {
        setFormData({ systolic:'', diastolic:'', heartRate:'', temperature:'', oxygenSat:'', weight:'', notes:'' });
        fetchPatients();
      }
    } catch { /* */ } finally { setFormLoading(false); }
  };

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const selPat = patients.find(p => p.id === selectedPatient);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="page-header" variants={itemVariants}>
        <h1 className="page-header__title">Vitals Monitoring</h1>
        <p className="page-header__subtitle">Record and track patient vital signs</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'var(--space-4)' }}>
        {/* Patient List */}
        <motion.div className="glass-card--static" style={{ padding: 'var(--space-4)' }} variants={itemVariants}>
          <div className="search-bar" style={{ marginBottom: 'var(--space-3)' }}>
            <span className="search-bar__icon"><IconSearch size={16} /></span>
            <input className="search-bar__input" placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading ? <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-6)' }}>Loading...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', maxHeight: 500, overflowY: 'auto' }}>
              {filtered.map(p => {
                const latest = p.vitals?.[0];
                return (
                  <button key={p.id} onClick={() => setSelectedPatient(p.id)}
                    className={`notif-item ${selectedPatient === p.id ? 'notif-item--unread' : ''}`}
                    style={{ borderRadius: 'var(--radius-md)' }}>
                    <div className="notif-item__title">{p.name}</div>
                    {latest ? (
                      <div className="notif-item__message">
                        HR: {latest.heartRate || '--'} | SpO2: {latest.oxygenSat || '--'}% | BP: {latest.bloodPressureSystolic || '--'}/{latest.bloodPressureDiastolic || '--'}
                      </div>
                    ) : (
                      <div className="notif-item__message">No vitals recorded</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Vitals Form & History */}
        <motion.div variants={itemVariants}>
          {selectedPatient && selPat ? (
            <>
              <div className="glass-card--static" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
                  Record Vitals — {selPat.name}
                </h3>
                <form onSubmit={handleRecordVitals}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                    <div className="input-group"><label className="input-label">Systolic BP</label><input className="input-field" type="number" placeholder="mmHg" value={formData.systolic} onChange={e => setFormData(p => ({ ...p, systolic: e.target.value }))} /></div>
                    <div className="input-group"><label className="input-label">Diastolic BP</label><input className="input-field" type="number" placeholder="mmHg" value={formData.diastolic} onChange={e => setFormData(p => ({ ...p, diastolic: e.target.value }))} /></div>
                    <div className="input-group"><label className="input-label">Heart Rate</label><input className="input-field" type="number" placeholder="bpm" value={formData.heartRate} onChange={e => setFormData(p => ({ ...p, heartRate: e.target.value }))} /></div>
                    <div className="input-group"><label className="input-label">Temperature</label><input className="input-field" type="number" step="0.1" placeholder="F" value={formData.temperature} onChange={e => setFormData(p => ({ ...p, temperature: e.target.value }))} /></div>
                    <div className="input-group"><label className="input-label">SpO2</label><input className="input-field" type="number" placeholder="%" value={formData.oxygenSat} onChange={e => setFormData(p => ({ ...p, oxygenSat: e.target.value }))} /></div>
                    <div className="input-group"><label className="input-label">Weight</label><input className="input-field" type="number" step="0.1" placeholder="kg" value={formData.weight} onChange={e => setFormData(p => ({ ...p, weight: e.target.value }))} /></div>
                  </div>
                  <div className="input-group" style={{ marginBottom: 'var(--space-3)' }}><label className="input-label">Notes</label><input className="input-field" placeholder="Optional notes" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} /></div>
                  <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? 'Recording...' : 'Record Vitals'}</button>
                </form>
              </div>

              {/* History */}
              <div className="glass-card--static data-table-container" style={{ maxHeight: 300, overflow: 'auto' }}>
                {selPat.vitals.length === 0 ? (
                  <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>No vitals history</div>
                ) : (
                  <table className="data-table">
                    <thead><tr><th>Time</th><th>BP</th><th>HR</th><th>SpO2</th><th>Temp</th></tr></thead>
                    <tbody>
                      {selPat.vitals.map((v: any, i: number) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{new Date(v.recordedAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</td>
                          <td>{v.bloodPressureSystolic || '--'}/{v.bloodPressureDiastolic || '--'}</td>
                          <td>{v.heartRate || '--'}</td>
                          <td>{v.oxygenSat || '--'}%</td>
                          <td>{v.temperature || '--'}F</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="glass-card--static" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a patient to record vitals
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
