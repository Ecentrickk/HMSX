import { prisma } from '@/server/config/database';
import { notFound } from 'next/navigation';
import { IconUser, IconCalendar, IconActivity, IconFileText, IconPill } from '@/client/components/icons';
import { PatientTimeline } from '@/client/components/patient/PatientTimeline';
import { ClinicalSummary } from '@/client/components/patient/ClinicalSummary';
import { PatientActions } from '@/client/components/patient/PatientActions';
import { BillingSummary } from '@/client/components/patient/BillingSummary';
import { auth } from '@/server/config/auth';

export default async function UnifiedPatientProfile({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return notFound();

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      appointments: {
        orderBy: { scheduledAt: 'desc' },
        include: { doctor: { select: { name: true, department: true } } }
      },
      prescriptions: {
        orderBy: { createdAt: 'desc' },
        include: { 
          doctor: { select: { id: true, name: true } },
          medications: true
        }
      },
      reports: {
        orderBy: { createdAt: 'desc' },
        include: { doctor: { select: { id: true, name: true } } }
      },
      medicalHistories: {
        orderBy: { date: 'desc' },
      },
      billings: {
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      admissions: {
        where: { status: 'ACTIVE' },
        take: 1
      },
      diagnoses: {
        orderBy: { createdAt: 'desc' },
        include: { doctor: { select: { name: true, department: true } } }
      }
    }
  });

  if (!patient) return notFound();

  // Calculate age
  const age = Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / 31557600000);

  return (
    <div className="patient-profile">
      {/* Header Profile Card */}
      <div className="glass-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          
          <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center' }}>
            <div className="avatar avatar--xl">{patient.name.substring(0, 2)}</div>
            
            <div>
              <h1 className="page-header__title" style={{ marginBottom: 'var(--space-2)' }}>{patient.name}</h1>
              
              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                  <IconUser size={16} /> {patient.gender} • {age} yrs
                </div>
                {patient.bloodGroup && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                    <IconActivity size={16} /> Blood: {patient.bloodGroup}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                  Phone: {patient.phone}
                </div>
                {patient.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                    Email: {patient.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          <PatientActions 
            patientId={patient.id} 
            role={session.user.role} 
            activeAdmission={patient.admissions[0] || null} 
          />
        </div>
      </div>

      <div className="grid-2">
        {/* Left Column: Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <IconCalendar size={18} className="text-primary" />
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>History & Timeline</h2>
            </div>
            
            <PatientTimeline 
              appointments={patient.appointments} 
              reports={patient.reports}
              medicalHistories={patient.medicalHistories}
              diagnoses={patient.diagnoses}
            />
          </div>
        </div>

        {/* Right Column: Clinical Summary (No Vitals per user request) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <ClinicalSummary 
            prescriptions={patient.prescriptions}
            reports={patient.reports}
            currentUser={{ id: session.user.id, role: session.user.role }}
          />
          <BillingSummary billings={patient.billings} />
        </div>
      </div>
    </div>
  );
}
