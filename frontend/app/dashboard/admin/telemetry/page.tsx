'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import '@/client/styles/admin.css';

interface TelemetryData {
  stats: {
    avgAppointmentsPerDay: number; appointmentsPctChange: number;
    bedOccupancy: number; weeklyRevenue: number;
    revenuePctChange: number; notificationsSent: number;
  };
  dailyAppointments: { day: string; value: number }[];
  inventoryBurn: { item: string; rate: number; currentQty: number; reorderLevel: number }[];
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function AdminTelemetryPage() {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/telemetry');
      if (res.ok) setData(await res.json());
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTelemetry(); }, [fetchTelemetry]);

  if (loading || !data) return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading telemetry...</div>;

  const { stats, dailyAppointments, inventoryBurn } = data;
  const maxAppt = Math.max(...dailyAppointments.map(d => d.value), 1);
  const formatRevenue = (v: number) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString()}`;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="page-header" variants={itemVariants}>
        <h1 className="page-header__title">System Telemetry</h1>
        <p className="page-header__subtitle">Hospital-wide analytics and performance metrics</p>
      </motion.div>

      <motion.div className="grid-stats" variants={itemVariants}>
        <div className="glass-card stat-card">
          <div className="stat-card__label">Avg. Appointments/Day</div>
          <div className="stat-card__value">{stats.avgAppointmentsPerDay}</div>
          <div className={`stat-card__trend ${stats.appointmentsPctChange >= 0 ? 'stat-card__trend--up' : ''}`}>
            {stats.appointmentsPctChange >= 0 ? '↑' : '↓'} {Math.abs(stats.appointmentsPctChange)}% vs last week
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-card__label">Bed Occupancy</div>
          <div className="stat-card__value">{stats.bedOccupancy}%</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-card__label">Weekly Revenue</div>
          <div className="stat-card__value" style={{ fontSize: 'var(--text-2xl)' }}>{formatRevenue(stats.weeklyRevenue)}</div>
          <div className={`stat-card__trend ${stats.revenuePctChange >= 0 ? 'stat-card__trend--up' : ''}`}>
            {stats.revenuePctChange >= 0 ? '↑' : '↓'} {Math.abs(stats.revenuePctChange)}% vs last week
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-card__label">Notifications Sent</div>
          <div className="stat-card__value">{stats.notificationsSent}</div>
          <div className="stat-card__trend" style={{ color: 'var(--text-muted)' }}>This week</div>
        </div>
      </motion.div>

      <div className="admin-metrics-grid">
        {/* Appointments Chart */}
        <motion.div className="glass-card--static metric-chart" variants={itemVariants}>
          <div className="metric-chart__header">
            <h3 className="metric-chart__title">Daily Appointments</h3>
            <span className="badge badge-primary">This Week</span>
          </div>
          <div className="bar-chart" style={{ marginBottom: 24 }}>
            {dailyAppointments.map((d, i) => (
              <motion.div key={d.day} className="bar-chart__bar"
                style={{ background: 'linear-gradient(to top, var(--primary-600), var(--primary-400))' }}
                data-label={d.day} data-value={d.value}
                initial={{ height: 0 }}
                animate={{ height: `${maxAppt > 0 ? (d.value / maxAppt) * 100 : 0}%` }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: 'easeOut' }} />
            ))}
          </div>
        </motion.div>

        {/* Inventory Burn Rate */}
        <motion.div className="glass-card--static metric-chart" variants={itemVariants}>
          <div className="metric-chart__header">
            <h3 className="metric-chart__title">Inventory Usage Rate</h3>
            <span className="badge badge-neutral">Units/Week</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {inventoryBurn.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No usage data yet</div>
            ) : inventoryBurn.map((item, i) => (
              <div key={item.item}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{item.item}</span>
                  <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{item.rate}/wk</span>
                </div>
                <div style={{ height: 6, background: 'var(--glass-bg)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <motion.div style={{
                    height: '100%',
                    background: item.currentQty <= item.reorderLevel ? 'var(--danger-500)' : item.rate > 30 ? 'var(--warning-500)' : 'var(--success-500)',
                    borderRadius: 'var(--radius-full)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((item.rate / 100) * 100, 100)}%` }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
