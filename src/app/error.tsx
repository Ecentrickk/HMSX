'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In a real app, this might send to Sentry or another service.
    // For now, log locally so we don't lose the UI error context.
    console.error('[Error Boundary Caught]', error);
  }, [error]);

  return (
    <div style={{ 
      padding: 'var(--space-8)', 
      textAlign: 'center', 
      background: 'var(--bg-glass)', 
      borderRadius: 'var(--radius-lg)',
      margin: 'var(--space-8) auto',
      maxWidth: '600px',
      border: '1px solid var(--error-500)'
    }}>
      <h2 style={{ color: 'var(--error-500)', marginBottom: 'var(--space-4)' }}>Module Error Detected</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
        We caught an unexpected error in this module. The rest of the system is unaffected and remains online.
      </p>
      <button
        onClick={() => reset()}
        className="btn btn-primary"
      >
        Retry Module
      </button>
    </div>
  );
}
