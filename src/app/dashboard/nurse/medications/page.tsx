'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { IconCheck, IconX } from '@/client/components/icons';
import '@/client/styles/nurse.css';

interface MedSchedule {
  id: string;
  patientId: string;
  patientName: string;
  nurseName: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  administeredAt: string | null;
  status: string;
  notes: string | null;
  bed: { bedNumber: string; wardName: string } | null;
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const statusBadge: Record<string, string> = {
  PENDING: 'warning',
  ADMINISTERED: 'success',
  SKIPPED: 'neutral',
  OVERDUE: 'danger',
};

export default function NurseMedicationsPage() {
  const [schedules, setSchedules] = useState<MedSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch('/api/nurse/medications');
      if (res.ok) { const data = await res.json(); setSchedules(data.schedules); }
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const handleAction = async (scheduleId: string, action: 'administer' | 'skip') => {
    setActionId(scheduleId);
    try {
      const res = await fetch('/api/nurse/medications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId, action }),
      });
      if (res.ok) fetchSchedules();
    } catch { /* */ } finally { setActionId(null); }
  };

  const filtered = schedules.filter(s => statusFilter === 'ALL' || s.status === statusFilter);
  const overdueCount = schedules.filter(s => s.status === 'OVERDUE').length;
  const pendingCount = schedules.filter(s => s.status === 'PENDING').length;
  const doneCount = schedules.filter(s => s.status === 'ADMINISTERED').length;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="page-header" variants={itemVariants}>
        <h1 className="page-header__title">Medication Schedule</h1>
        <p className="page-header__subtitle">Today&apos;s medication administration timeline</p>
      </motion.div>

      {/* Stats */}
      <motion.div className="grid-stats" variants={itemVariants}>
        <div className="glass-card stat-card">
          <div className="stat-card__label">Total Today</div>
          <div className="stat-card__value">{schedules.length}</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-card__label">Pending</div>
          <div className="stat-card__value" style={{ color: 'var(--warning-400)' }}>{pendingCount}</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-card__label">Administered</div>
          <div className="stat-card__value" style={{ color: 'var(--success-400)' }}>{doneCount}</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-card__label">Overdue</div>
          <div className="stat-card__value" style={{ color: 'var(--danger-400)' }}>{overdueCount}</div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div className="pharmacy-toolbar" variants={itemVariants}>
        <div className="pharmacy-filters">
          {['ALL', 'PENDING', 'OVERDUE', 'ADMINISTERED', 'SKIPPED'].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter(s)}>
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Schedule Table */}
      <motion.div className="glass-card--static data-table-container" variants={itemVariants}>
        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading schedules...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
            {schedules.length === 0 ? 'No medication schedules for today.' : 'No schedules match filter.'}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Time</th><th>Patient</th><th>Location</th><th>Medication</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                    {new Date(s.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.patientName}</td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {s.bed ? `${s.bed.wardName} / ${s.bed.bedNumber}` : '--'}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.medicationName}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{s.dosage}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${statusBadge[s.status] || 'neutral'}`}>{s.status}</span>
                  </td>
                  <td>
                    {(s.status === 'PENDING' || s.status === 'OVERDUE') && (
                      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleAction(s.id, 'administer')}
                          disabled={actionId === s.id}
                        >
                          <IconCheck size={12} /> Give
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleAction(s.id, 'skip')}
                          disabled={actionId === s.id}
                        >
                          <IconX size={12} /> Skip
                        </button>
                      </div>
                    )}
                    {s.status === 'ADMINISTERED' && s.administeredAt && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        at {new Date(s.administeredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </motion.div>
  );
}
