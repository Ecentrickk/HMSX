'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck } from '@/client/components/icons';

interface SOAPData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export default function DoctorConsultationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  
  const [soap, setSoap] = useState<SOAPData>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });

  useEffect(() => {
    async function fetchAppointment() {
      try {
        const res = await fetch(`/api/doctor/appointments/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setAppointment(data.appointment);
          // Prepopulate SOAP if notes exist
          if (data.appointment.notes) {
            // Very simple markdown extraction for demo purposes, usually we'd parse it properly
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAppointment();
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // We will send this to the backend to update Appointment.notes and Status
      const formattedNotes = `**Subjective**\n${soap.subjective}\n\n**Objective**\n${soap.objective}\n\n**Assessment**\n${soap.assessment}\n\n**Plan**\n${soap.plan}`;
      
      const res = await fetch(`/api/doctor/appointments/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: formattedNotes, status: 'COMPLETED' })
      });

      if (res.ok) {
        // Automatically pop up the printable Patient Tag in a new window
        if (appointment?.patientId) {
          window.open(`/api/pdf/tag/${appointment.patientId}`, '_blank');
        }
        // Redirect back to doctor dashboard
        router.push('/dashboard/doctor');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading consultation...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-header__title">Clinical Consultation (SOAP)</h1>
          <p className="page-header__subtitle">Appointment ID: {params.id}</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : <><IconCheck size={16} /> Complete Consultation</>}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: 'var(--space-2)', fontSize: '1.1rem' }}>Subjective</label>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-3)' }}>Patient&apos;s chief complaint and history of present illness.</p>
          <textarea 
            className="input-field" 
            rows={4} 
            value={soap.subjective} 
            onChange={e => setSoap(s => ({ ...s, subjective: e.target.value }))}
            placeholder="e.g. Patient complains of headache for 3 days..."
          />
        </div>

        <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: 'var(--space-2)', fontSize: '1.1rem' }}>Objective</label>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-3)' }}>Vital signs, physical examination findings, and lab results.</p>
          <textarea 
            className="input-field" 
            rows={4} 
            value={soap.objective} 
            onChange={e => setSoap(s => ({ ...s, objective: e.target.value }))}
            placeholder="e.g. BP 120/80, HR 72, Temp 98.6F. Clear to auscultation."
          />
        </div>

        <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: 'var(--space-2)', fontSize: '1.1rem' }}>Assessment</label>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-3)' }}>Diagnosis or medical impression.</p>
          <textarea 
            className="input-field" 
            rows={3} 
            value={soap.assessment} 
            onChange={e => setSoap(s => ({ ...s, assessment: e.target.value }))}
            placeholder="e.g. Tension headache."
          />
        </div>

        <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: 'var(--space-2)', fontSize: '1.1rem' }}>Plan</label>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-3)' }}>Treatment plan, medications prescribed, follow-up instructions.</p>
          <textarea 
            className="input-field" 
            rows={4} 
            value={soap.plan} 
            onChange={e => setSoap(s => ({ ...s, plan: e.target.value }))}
            placeholder="e.g. Prescribe Acetaminophen. Follow up in 1 week if no improvement."
          />
        </div>
      </div>
    </div>
  );
}
