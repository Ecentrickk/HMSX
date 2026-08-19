'use client';

import { IconCalendar, IconFileText, IconCheck, IconAlertCircle } from '@/client/components/icons';

interface TimelineEvent {
  id: string;
  date: Date;
  type: 'APPOINTMENT' | 'REPORT' | 'HISTORY';
  title: string;
  subtitle: string;
  status?: string;
  severity?: string;
}

export function PatientTimeline({ appointments, reports, medicalHistories = [] }: { appointments: any[], reports: any[], medicalHistories?: any[] }) {
  // Merge and sort events
  const events: TimelineEvent[] = [
    ...appointments.map((a) => ({
      id: `apt_${a.id}`,
      date: new Date(a.scheduledAt),
      type: 'APPOINTMENT' as const,
      title: `Appointment: ${a.type}`,
      subtitle: `Dr. ${a.doctor.name} (${a.doctor.department || 'General'})`,
      status: a.status
    })),
    ...reports.map((r) => ({
      id: `rep_${r.id}`,
      date: new Date(r.createdAt),
      type: 'REPORT' as const,
      title: `Lab Report: ${r.title}`,
      subtitle: `Signed by Dr. ${r.doctor.name}`,
      status: r.isSigned ? 'COMPLETED' : 'PENDING'
    })),
    ...medicalHistories.map((h) => ({
      id: `hist_${h.id}`,
      date: new Date(h.date),
      type: 'HISTORY' as const,
      title: h.category.replace('_', ' '),
      subtitle: `${h.title} - ${h.description}`,
      status: h.isOngoing ? 'ONGOING' : 'RESOLVED',
      severity: h.severity
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  if (events.length === 0) {
    return <div style={{ padding: 'var(--space-4)', color: 'var(--text-muted)', textAlign: 'center' }}>No history found for this patient.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {events.map((event, index) => (
        <div key={event.id} style={{ display: 'flex', gap: 'var(--space-4)' }}>
          {/* Timeline Line & Dot */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ 
              width: '12px', height: '12px', borderRadius: '50%', 
              background: event.type === 'APPOINTMENT' ? 'var(--accent-blue)' : event.type === 'REPORT' ? 'var(--accent-purple)' : 'var(--accent-red)',
              boxShadow: `0 0 0 4px ${event.type === 'APPOINTMENT' ? 'rgba(0,114,255,0.1)' : event.type === 'REPORT' ? 'rgba(144,37,255,0.1)' : 'rgba(239,68,68,0.1)'}`
            }} />
            {index !== events.length - 1 && (
              <div style={{ flex: 1, width: '2px', background: 'var(--border-secondary)', margin: 'var(--space-1) 0' }} />
            )}
          </div>

          {/* Event Content */}
          <div style={{ 
            flex: 1, 
            padding: 'var(--space-3)', 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid var(--border-secondary)', 
            borderRadius: 'var(--radius-md)',
            marginBottom: index !== events.length - 1 ? 'var(--space-2)' : 0
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {event.type === 'APPOINTMENT' ? <IconCalendar size={14} className="text-primary" /> : event.type === 'REPORT' ? <IconFileText size={14} className="text-accent" /> : <IconAlertCircle size={14} className="text-danger" />}
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{event.title.toLowerCase()}</span>
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {event.date.toLocaleDateString()} {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {event.subtitle}
            </div>

            {event.status && (
              <div style={{ marginTop: 'var(--space-2)' }}>
                <span className={`badge ${
                  event.status === 'COMPLETED' ? 'badge-success' : 
                  event.status === 'CANCELLED' ? 'badge-danger' : 
                  event.status === 'PENDING' ? 'badge-warning' : 
                  event.status === 'ONGOING' ? 'badge-danger' : 'badge-primary'
                }`}>
                  {event.status}
                </span>
                {event.severity && (
                  <span className={`badge ml-2 ${event.severity === 'Severe' || event.severity === 'Major' ? 'badge-danger' : 'badge-warning'}`}>
                    {event.severity}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
