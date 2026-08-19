'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IconSearch, IconUsers, IconUser } from '@/client/components/icons';
import '@/client/styles/doctor.css';

interface PatientRecord {
  id: string;
  name: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string | null;
  appointments: { id: string; scheduledAt: string; status: string; type: string }[];
  admissions?: { admissionType: string; status: string }[];
  vitals: { heartRate: number | null; bloodPressureSystolic: number | null; bloodPressureDiastolic: number | null; oxygenSat: number | null; recordedAt: string }[];
  _count: { appointments: number };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function DoctorPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewAll, setViewAll] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const url = viewAll ? '/api/doctor/patients?all=true' : '/api/doctor/patients';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients);
      }
    } catch { /* */ } finally { setLoading(false); }
  }, [viewAll]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search)
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="page-header" variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-header__title">{viewAll ? 'All Patients' : 'My Patients'}</h1>
          <p className="page-header__subtitle">
            {viewAll ? 'All registered patients in the hospital' : 'Patients assigned to you via appointments'}
          </p>
        </div>
        <button
          className={`btn ${viewAll ? 'btn-ghost' : 'btn-primary'}`}
          onClick={() => setViewAll(!viewAll)}
        >
          <IconUsers size={14} /> {viewAll ? 'Show My Patients' : 'View All Patients'}
        </button>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} style={{ marginBottom: 'var(--space-4)' }}>
        <div className="search-bar" style={{ maxWidth: 360 }}>
          <span className="search-bar__icon"><IconSearch size={16} /></span>
          <input
            className="search-bar__input"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="patient-search"
          />
        </div>
      </motion.div>

      {/* Patient List */}
      {loading ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading patients...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
          {patients.length === 0
            ? (viewAll ? 'No patients registered yet.' : 'No patients assigned to you yet. Patients appear here when they have appointments with you.')
            : 'No patients match your search.'
          }
        </div>
      ) : (
        <motion.div className="patient-grid" variants={containerVariants}>
          {filtered.map((patient) => {
            const age = Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000);
            const lastAppt = patient.appointments?.[0];
            const lastVital = patient.vitals?.[0];

            return (
              <motion.div
                key={patient.id}
                className="glass-card patient-card"
                variants={itemVariants}
                whileHover={{ y: -2 }}
                onClick={() => router.push(`/dashboard/patient/${patient.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="patient-card__header">
                  <div className="avatar avatar--lg">
                    {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="patient-card__info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 className="patient-card__name" style={{ margin: 0 }}>{patient.name}</h3>
                      {patient.admissions && patient.admissions.length > 0 && (
                        <span className={`badge ${patient.admissions[0].admissionType === 'IPD' ? 'badge-primary' : 'badge-neutral'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                          {patient.admissions[0].admissionType}
                        </span>
                      )}
                    </div>
                    <p className="patient-card__meta">
                      {age}y · {patient.gender} {patient.bloodGroup ? `· ${patient.bloodGroup}` : ''}
                    </p>
                  </div>
                  {lastAppt && (
                    <span className="badge badge-neutral">{lastAppt.status}</span>
                  )}
                </div>

                <div className="patient-card__body">
                  <div className="patient-card__condition">
                    <span className="patient-card__label">Phone</span>
                    <span className="patient-card__value">{patient.phone}</span>
                  </div>
                  {lastAppt && (
                    <div className="patient-card__visit">
                      <span className="patient-card__label">Last Appointment</span>
                      <span className="patient-card__value">
                        {new Date(lastAppt.scheduledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {lastVital && (
                    <div className="patient-card__visit">
                      <span className="patient-card__label">Vitals</span>
                      <span className="patient-card__value" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                        {lastVital.heartRate ? `HR: ${lastVital.heartRate}` : ''}
                        {lastVital.bloodPressureSystolic ? ` · BP: ${lastVital.bloodPressureSystolic}/${lastVital.bloodPressureDiastolic}` : ''}
                        {lastVital.oxygenSat ? ` · SpO₂: ${lastVital.oxygenSat}%` : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="patient-card__footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {patient._count.appointments} appointment{patient._count.appointments !== 1 ? 's' : ''} total
                  </span>
                  {lastAppt && lastAppt.status !== 'COMPLETED' && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/doctor/consultation/${lastAppt.id}`); }}
                    >
                      Start Consultation
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
