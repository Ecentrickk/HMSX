'use client';

import { useEffect, useState } from 'react';
import { IconX } from '@/client/components/icons';

export function KeyboardShortcuts() {
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        // Allow escape to blur inputs
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      // '?' to show cheat sheet (Shift + /)
      if (e.key === '?') {
        e.preventDefault();
        setShowCheatSheet((prev) => !prev);
      }

      // Escape to close cheat sheet
      if (e.key === 'Escape' && showCheatSheet) {
        setShowCheatSheet(false);
      }

      // Ctrl+P / Cmd+P to print
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        // Let the browser handle the print dialog natively
        // We just ensure we don't block it, but we could add custom logic here before print if needed
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCheatSheet]);

  if (!showCheatSheet) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowCheatSheet(false)} style={{ zIndex: 9999 }}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '400px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button onClick={() => setShowCheatSheet(false)} style={{ color: 'var(--text-muted)' }}>
            <IconX size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Global Search</span>
              <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>Ctrl + K</kbd>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Print Current Page</span>
              <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>Ctrl + P</kbd>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Close Modals/Search</span>
              <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>Esc</kbd>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Show Shortcuts</span>
              <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>?</kbd>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
