'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import '@/client/styles/nurse.css';

interface BedData {
  id: string;
  bedNumber: string;
  status: string;
  patient: {
    id: string;
    name: string;
    vitals: {
      heartRate: number | null;
      bloodPressureSystolic: number | null;
      bloodPressureDiastolic: number | null;
      oxygenSat: number | null;
      temperature: number | null;
      recordedAt: string;
    }[];
  } | null;
  assignedNurse: { id: string; name: string } | null;
}

interface WardData {
  id: string;
  name: string;
  floor: number;
  type: string;
  totalBeds: number;
  beds: BedData[];
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const statusColors: Record<string, string> = {
  AVAILABLE: 'var(--success-500)',
  OCCUPIED: 'var(--primary-500)',
  MAINTENANCE: 'var(--warning-500)',
  RESERVED: 'var(--accent-500)',
};

function getVitalStatus(vitals: BedData['patient'] extends null ? never : NonNullable<BedData['patient']>['vitals'][0] | undefined) {
  if (!vitals) return 'none';
  if (vitals.oxygenSat && vitals.oxygenSat < 90) return 'critical';
  if (vitals.heartRate && (vitals.heartRate < 50 || vitals.heartRate > 120)) return 'critical';
  if (vitals.temperature && (vitals.temperature < 95 || vitals.temperature > 103)) return 'critical';
  if (vitals.oxygenSat && vitals.oxygenSat < 95) return 'warning';
  if (vitals.heartRate && (vitals.heartRate < 60 || vitals.heartRate > 100)) return 'warning';
  return 'normal';
}

export default function NurseWardsPage() {
  const [wards, setWards] = useState<WardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState('ALL');

  const fetchWards = useCallback(async () => {
    try {
      const res = await fetch('/api/nurse/wards');
      if (res.ok) { const data = await res.json(); setWards(data.wards); }
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWards(); const interval = setInterval(fetchWards, 30000); return () => clearInterval(interval); }, [fetchWards]);

  const filteredWards = selectedWard === 'ALL' ? wards : wards.filter(w => w.id === selectedWard);
  const totalBeds = wards.reduce((s, w) => s + w.beds.length, 0);
  const occupiedBeds = wards.reduce((s, w) => s + w.beds.filter(b => b.status === 'OCCUPIED').length, 0);
  const availableBeds = wards.reduce((s, w) => s + w.beds.filter(b => b.status === 'AVAILABLE').length, 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="page-header" variants={itemVariants}>
        <h1 className="page-header__title">Ward Management</h1>
        <p className="page-header__subtitle">Live bed occupancy and patient vitals overview</p>
      </motion.div>

      {/* Stats */}
      <motion.div className="grid-stats" variants={itemVariants}>
        <div className="glass-card stat-card">
          <div className="stat-card__label">Total Beds</div>
          <div className="stat-card__value">{totalBeds}</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-card__label">Occupied</div>
          <div className="stat-card__value" style={{ color: 'var(--primary-400)' }}>{occupiedBeds}</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-card__label">Available</div>
          <div className="stat-card__value" style={{ color: 'var(--success-400)' }}>{availableBeds}</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-card__label">Occupancy</div>
          <div className="stat-card__value">{totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0}%</div>
        </div>
      </motion.div>

      {/* Ward Filter */}
      <motion.div className="pharmacy-toolbar" variants={itemVariants}>
        <div className="pharmacy-filters">
          <button className={`btn btn-sm ${selectedWard === 'ALL' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedWard('ALL')}>All Wards</button>
          {wards.map(w => (
            <button key={w.id} className={`btn btn-sm ${selectedWard === w.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedWard(w.id)}>
              {w.name}
            </button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading wards...</div>
      ) : (
        filteredWards.map(ward => (
          <motion.div key={ward.id} className="glass-card--static" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }} variants={itemVariants}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{ward.name}</h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Floor {ward.floor} — {ward.type}</span>
              </div>
              <span className="badge badge-neutral">
                {ward.beds.filter(b => b.status === 'OCCUPIED').length}/{ward.beds.length} beds
              </span>
            </div>

            <div className="ward-bed-grid">
              {ward.beds.map(bed => {
                const latestVitals = bed.patient?.vitals?.[0];
                const vStatus = getVitalStatus(latestVitals);
                return (
                  <div
                    key={bed.id}
                    className={`ward-bed ${bed.status === 'OCCUPIED' ? 'ward-bed--occupied' : ''}`}
                    style={{ borderLeft: `3px solid ${statusColors[bed.status] || 'var(--glass-border)'}` }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{bed.bedNumber}</span>
                      <span className={`badge badge-${bed.status === 'AVAILABLE' ? 'success' : bed.status === 'OCCUPIED' ? 'primary' : 'warning'}`} style={{ fontSize: '0.55rem' }}>
                        {bed.status}
                      </span>
                    </div>
                    {bed.patient ? (
                      <>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{bed.patient.name}</div>
                        {latestVitals && (
                          <div className={`ward-bed__vitals ward-bed__vitals--${vStatus}`}>
                            <span>HR: {latestVitals.heartRate || '--'}</span>
                            <span>SpO2: {latestVitals.oxygenSat || '--'}%</span>
                            <span>BP: {latestVitals.bloodPressureSystolic || '--'}/{latestVitals.bloodPressureDiastolic || '--'}</span>
                          </div>
                        )}
                        {bed.assignedNurse && (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
                            Nurse: {bed.assignedNurse.name}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        {bed.status === 'MAINTENANCE' ? 'Under maintenance' : 'Available'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}
