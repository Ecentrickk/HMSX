'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { IconUsers, IconBed, IconCalendar, IconAlertCircle } from '@/client/components/icons';
import '@/client/styles/pulse.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

interface PulseData {
  stats: {
    activePatients: number;
    appointmentsToday: number;
    completedAppointments: number;
    staffOnDuty: number;
    totalBeds: number;
    occupiedBeds: number;
  };
  appointments: { patient: string; doctor: string; time: string; type: string; status: string }[];
  staff: { name: string; role: string; department: string; status: string }[];
  wards: { name: string; floor: number; type: string; total: number; occupied: number }[];
}

// Short human-readable role labels
const ROLE_LABELS: Record<string, string> = {
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  RECEPTIONIST: 'Front Desk',
  PHARMACIST: 'Pharmacy',
  ADMIN: 'Admin',
};

// Role badge color mapping
const ROLE_BADGE: Record<string, string> = {
  DOCTOR: 'primary',
  NURSE: 'accent',
  RECEPTIONIST: 'warning',
  PHARMACIST: 'success',
  ADMIN: 'neutral',
};

export default function HospitalPulsePage() {
  const { data: session } = useSession();
  const [data, setData] = useState<PulseData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const userRole = session?.user?.role || '';
  const isPharmacist = userRole === 'PHARMACIST';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch('/api/pulse/stats')
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
    // Refresh every 30s
    const interval = setInterval(() => {
      fetch('/api/pulse/stats').then(r => r.json()).then(setData).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = data?.stats || { activePatients: 0, appointmentsToday: 0, completedAppointments: 0, staffOnDuty: 0, totalBeds: 0, occupiedBeds: 0 };
  const bedPct = stats.totalBeds > 0 ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0;

  return (
    <motion.div className="pulse-page" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="pulse-header" variants={itemVariants}>
        <div className="pulse-header__left">
          <h1 className="page-header__title">Hospital <span className="text-gradient">Pulse</span></h1>
          <p className="page-header__subtitle">
            Real-time hospital overview · {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <div className="pulse-header__right">
          <div className="pulse-dot pulse-dot--active" />
          <span className="pulse-status">Live</span>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div className="grid-stats" variants={itemVariants}>
        <StatCard icon={<IconUsers size={18} />} label="Active Patients" value={stats.activePatients} />
        {/* Bed Occupancy card hidden from pharmacists */}
        {!isPharmacist && (
          <StatCard icon={<IconBed size={18} />} label="Bed Occupancy" value={`${bedPct}%`} subValue={`${stats.occupiedBeds}/${stats.totalBeds}`} />
        )}
        <StatCard icon={<IconCalendar size={18} />} label="Today's Appointments" value={stats.appointmentsToday} subValue={`${stats.completedAppointments} completed`} />
        <StatCard icon={<IconUsers size={18} />} label="Staff On Duty" value={stats.staffOnDuty} />
      </motion.div>

      {/* Main Grid */}
      <div className="pulse-grid">
        <div className="pulse-grid__left">
          {/* Ward Occupancy — hidden from pharmacists */}
          {!isPharmacist && (
            <motion.div className="glass-card--static pulse-section" variants={itemVariants}>
              <div className="pulse-section__header">
                <h2 className="pulse-section__title">Ward Occupancy</h2>
              </div>
              {(data?.wards?.length ?? 0) === 0 ? (
                <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                  No wards configured yet. Run the seed script to add ward data.
                </div>
              ) : (
                <div className="ward-grid">
                  {data!.wards.map(ward => {
                    const pct = ward.total > 0 ? Math.round((ward.occupied / ward.total) * 100) : 0;
                    const status = pct >= 90 ? 'critical' : pct >= 70 ? 'warning' : 'normal';
                    return (
                      <div key={ward.name} className="ward-card">
                        <div className="ward-card__header">
                          <span className="ward-card__name">{ward.name}</span>
                          <span className="badge badge-neutral">{ward.type}</span>
                        </div>
                        <div className="ward-card__stats">
                          <span className="ward-card__count">{ward.occupied}/{ward.total}</span>
                          <span className="ward-card__floor">Floor {ward.floor}</span>
                        </div>
                        <div className="ward-card__bar">
                          <motion.div className={`ward-card__fill ward-card__fill--${status}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Today's Appointments */}
          <motion.div className="glass-card--static pulse-section" variants={itemVariants}>
            <div className="pulse-section__header">
              <h2 className="pulse-section__title">Today&apos;s Appointments</h2>
              <span className="badge badge-neutral">{data?.appointments?.length ?? 0}</span>
            </div>
            {(data?.appointments?.length ?? 0) === 0 ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                No appointments today
              </div>
            ) : (
              <div className="appointment-timeline">
                {data!.appointments.map((apt, i) => (
                  <div key={i} className="appointment-item">
                    <div className="appointment-item__time">
                      {new Date(apt.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className={`appointment-item__dot appointment-item__dot--${apt.status.toLowerCase()}`} />
                    <div className="appointment-item__content">
                      <div className="appointment-item__patient">{apt.patient}</div>
                      <div className="appointment-item__meta">{apt.doctor} · {apt.type}</div>
                    </div>
                    <span className="badge badge-neutral">{apt.status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        <div className="pulse-grid__right">
          {/* Staff On Duty — visible to all roles */}
          <motion.div className="glass-card--static pulse-section" variants={itemVariants}>
            <div className="pulse-section__header">
              <h2 className="pulse-section__title">Staff On Duty</h2>
              <span className="badge badge-neutral">{data?.staff?.length ?? 0}</span>
            </div>
            {(data?.staff?.length ?? 0) === 0 ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                No staff on duty
              </div>
            ) : (
              <div className="staff-list">
                {data!.staff.map((s, i) => (
                  <div key={i} className="staff-item">
                    <div className="avatar avatar--sm">{s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                    <div className="staff-item__info">
                      <div className="staff-item__name">{s.name}</div>
                      <div className="staff-item__dept">{s.department}</div>
                    </div>
                    <span className={`staff-role-tag staff-role-tag--${ROLE_BADGE[s.role] || 'neutral'}`}>
                      {ROLE_LABELS[s.role] || s.role}
                    </span>
                    <div className="activity-dot activity-dot--online" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, subValue }: { icon: ReactNode; label: string; value: string | number; subValue?: string }) {
  return (
    <motion.div className="glass-card stat-card" whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400 }}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      {subValue && <div className="stat-card__trend" style={{ color: 'var(--text-muted)' }}>{subValue}</div>}
    </motion.div>
  );
}
