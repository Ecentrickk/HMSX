'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { IconClipboard, IconPrinter, IconActivity } from '@/client/components/icons';

export default function NurseHandoffPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHandoffData = async () => {
      try {
        const res = await fetch('/api/nurse/handoff');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchHandoffData();
  }, []);

  if (loading) return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading handoff data...</div>;
  if (!data) return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--danger-500)' }}>Failed to load handoff.</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-header__title">Shift Handoff</h1>
          <p className="page-header__subtitle">Current Ward Status & Pending Meds</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => window.open('/api/pdf/handoff', '_blank')}
        >
          <IconPrinter size={16} /> Print Handoff Sheet
        </button>
      </div>

      <div className="grid-2">
        <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <IconActivity size={18} className="text-primary" />
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Occupied Beds ({data.occupiedBeds.length})</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {data.occupiedBeds.map((bed: any) => (
              <div key={bed.id} style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-secondary)' }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-md)', marginBottom: '4px' }}>Bed {bed.bedNumber} — {bed.ward.name}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Patient: {bed.patient.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <IconClipboard size={18} className="text-accent" />
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Pending Medications ({data.pendingMeds.length})</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {data.pendingMeds.map((med: any) => (
              <div key={med.id} style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-secondary)' }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-md)', marginBottom: '4px', color: 'var(--warning-400)' }}>
                  {new Date(med.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: '4px' }}>{med.medicationName} - {med.dosage}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Patient: {med.patient.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
