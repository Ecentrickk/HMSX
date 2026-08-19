'use client';

import { useState, useEffect } from 'react';
import { HOSPITAL_BRANDING } from '@/shared/branding';

interface QueueItem {
  token: string;
  patient: string;
  time: string;
  status: string;
}

export default function QueueDisplayPage() {
  const [queue, setQueue] = useState<Record<string, QueueItem[]>>({});
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [error, setError] = useState(false);

  useEffect(() => {
    // Clock tick
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    
    // Fetch Queue
    const fetchQueue = async () => {
      try {
        const res = await fetch('/api/queue');
        if (res.ok) {
          const data = await res.json();
          setQueue(data.queue);
          setError(false);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    };

    fetchQueue();
    // Refresh every 10 seconds
    const interval = setInterval(fetchQueue, 10000);
    
    return () => { clearInterval(timer); clearInterval(interval); };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-primary)' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '-0.02em', margin: 0 }}>
            {HOSPITAL_BRANDING.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', margin: 0 }}>Live Token Queue Display</p>
        </div>
        <div style={{ fontSize: '48px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          {time}
        </div>
      </header>

      {/* Grid */}
      <div style={{ padding: '48px', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', alignContent: 'start' }}>
        {error && (
          <div style={{ gridColumn: '1 / -1', padding: '24px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-500)', borderRadius: '12px', textAlign: 'center', fontSize: '20px' }}>
            Connection error. Retrying...
          </div>
        )}
        
        {Object.keys(queue).length === 0 && !error ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', fontSize: '24px', marginTop: '100px' }}>
            No active queue at the moment.
          </div>
        ) : (
          Object.entries(queue).map(([doctorName, patients]) => (
            <div key={doctorName} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-primary)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(0, 114, 255, 0.1)', padding: '20px 24px', borderBottom: '1px solid var(--border-primary)' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>{doctorName}</h2>
              </div>
              
              <div style={{ padding: '0 24px' }}>
                {patients.length > 0 ? patients.map((p, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '24px 0', 
                    borderBottom: idx !== patients.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                    opacity: p.status === 'IN_PROGRESS' ? 1 : 0.6
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: 800, 
                        color: p.status === 'IN_PROGRESS' ? 'var(--success-400)' : 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {p.token}
                      </div>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 600 }}>{p.patient}</div>
                        <div style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>{p.time}</div>
                      </div>
                    </div>
                    {p.status === 'IN_PROGRESS' && (
                      <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-400)', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Inside Now
                      </div>
                    )}
                  </div>
                )) : (
                  <div style={{ padding: '24px 0', color: 'var(--text-muted)' }}>No patients in queue</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
