'use client';

import { IconPill, IconFileText, IconPrinter, IconCheck } from '@/client/components/icons';
import { useRouter } from 'next/navigation';

export function ClinicalSummary({ prescriptions, reports, currentUser }: { prescriptions: any[], reports: any[], currentUser?: { id: string, role: string } }) {
  const router = useRouter();
  const activePrescriptions = prescriptions.filter(p => true); // In a real app, filter by date/duration
  const recentReports = reports.slice(0, 3);

  const handlePrint = (type: string, id: string) => {
    window.open(`/api/pdf/${type}/${id}`, '_blank');
  };

  const handleSign = async (type: string, id: string) => {
    try {
      const res = await fetch('/api/doctor/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id })
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Active Prescriptions */}
      <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <IconPill size={18} className="text-success" />
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Prescriptions</h2>
          </div>
          <span className="badge badge-success">{activePrescriptions.length} Active</span>
        </div>

        {activePrescriptions.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-4)' }}>No active prescriptions.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {activePrescriptions.slice(0, 3).map((px) => (
              <div key={px.id} style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--border-secondary)', 
                padding: 'var(--space-3)', 
                borderRadius: 'var(--radius-md)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {new Date(px.createdAt).toLocaleDateString()} • Dr. {px.doctor.name}
                    {px.isSigned && <span style={{ color: 'var(--success-500)', marginLeft: '8px' }}>✓ Signed</span>}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {currentUser?.role === 'DOCTOR' && !px.isSigned && px.doctor.id === currentUser.id && (
                      <button 
                        onClick={() => handleSign('prescription', px.id)}
                        style={{ color: 'var(--success-500)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}
                      >
                        <IconCheck size={12} /> Sign
                      </button>
                    )}
                    <button 
                      onClick={() => handlePrint('prescription', px.id)}
                      style={{ color: 'var(--accent-cyan)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)' }}
                    >
                      <IconPrinter size={12} /> Print PDF
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {px.medications.map((med: any) => (
                    <div key={med.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{med.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{med.dosage} • {med.frequency}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Lab Reports */}
      <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <IconFileText size={18} className="text-accent" />
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Recent Reports</h2>
        </div>

        {recentReports.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-4)' }}>No lab reports available.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {recentReports.map((report) => (
              <div key={report.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: 'var(--space-3)', 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--border-secondary)', 
                borderRadius: 'var(--radius-md)' 
              }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{report.title}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {new Date(report.createdAt).toLocaleDateString()}
                    {report.isSigned && <span style={{ color: 'var(--success-500)', marginLeft: '8px' }}>✓ Signed</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {currentUser?.role === 'DOCTOR' && !report.isSigned && report.doctor.id === currentUser.id && (
                    <button 
                      onClick={() => handleSign('report', report.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--success-500)' }}
                    >
                      <IconCheck size={14} /> Sign
                    </button>
                  )}
                  <button 
                    onClick={() => handlePrint('report', report.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    <IconPrinter size={14} /> View PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
