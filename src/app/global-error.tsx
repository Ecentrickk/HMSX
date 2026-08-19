'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh', 
          backgroundColor: '#09090b',
          color: '#fafafa',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Critical System Error</h2>
          <p style={{ color: '#a1a1aa', marginBottom: '24px' }}>
            A fatal error occurred. Please refresh or contact the IT administrator.
          </p>
          <button 
            onClick={() => reset()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Attempt Recovery
          </button>
        </div>
      </body>
    </html>
  );
}
