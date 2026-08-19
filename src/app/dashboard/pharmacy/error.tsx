'use client';

import { useEffect } from 'react';
import { IconAlertCircle, IconRefresh } from '@/client/components/icons';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service (or Winston via API)
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        backgroundColor: '#fee2e2',
        color: '#ef4444',
        padding: '1.5rem',
        borderRadius: '50%',
        marginBottom: '1.5rem'
      }}>
        <IconAlertCircle size={48} />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
        Something went wrong!
      </h2>
      <p style={{ color: '#6b7280', maxWidth: '32rem', marginBottom: '2rem' }}>
        We&apos;ve encountered an unexpected error while loading this dashboard view. Our technical team has been notified.
      </p>
      
      <button
        onClick={() => reset()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: '#0072ff',
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: 500,
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#005ecc')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0072ff')}
      >
        <IconRefresh size={18} />
        Try again
      </button>
      
      {process.env.NODE_ENV !== 'production' && (
        <div style={{ marginTop: '3rem', textAlign: 'left', width: '100%', maxWidth: '48rem', backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem', overflow: 'auto' }}>
          <p style={{ fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>Developer Details:</p>
          <pre style={{ fontSize: '0.875rem', color: '#ef4444', whiteSpace: 'pre-wrap' }}>
            {error.message}
          </pre>
        </div>
      )}
    </div>
  );
}
