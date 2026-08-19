'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IconSearch, IconX, IconUser, IconCalendar, IconFileText, IconPill } from '@/client/components/icons';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'PATIENT' | 'APPOINTMENT' | 'PRESCRIPTION' | 'STAFF';
  url: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      
      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results);
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation within palette
  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          setIsOpen(false);
          router.push(selected.url);
        }
      }
    };

    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [isOpen, results, selectedIndex, router]);

  if (!isOpen) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PATIENT': return <IconUser size={16} />;
      case 'APPOINTMENT': return <IconCalendar size={16} />;
      case 'PRESCRIPTION': return <IconPill size={16} />;
      case 'STAFF': return <IconFileText size={16} />;
      default: return <IconSearch size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PATIENT': return 'var(--accent-cyan)';
      case 'APPOINTMENT': return 'var(--accent-blue)';
      case 'PRESCRIPTION': return 'var(--success-400)';
      case 'STAFF': return 'var(--accent-purple)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '600px', marginTop: '-15vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-primary)' }}>
          <span style={{ color: 'var(--text-muted)', marginRight: '12px', display: 'flex' }}>
            <IconSearch size={20} />
          </span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search patients, appointments, prescriptions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ 
              flex: 1, 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-primary)',
              fontSize: '1.1rem',
              outline: 'none'
            }}
          />
          {loading && <div className="dashboard-loading__spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />}
          <button 
            onClick={() => setIsOpen(false)}
            style={{ padding: '4px', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '12px' }}
          >
            <IconX size={20} />
          </button>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '12px' }}>
          {query.trim() === '' ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Type to search across the entire hospital system.<br/>
              Try names, IDs, or phone numbers.
            </div>
          ) : results.length === 0 && !loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            results.map((result, idx) => (
              <div
                key={result.id}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => {
                  setIsOpen(false);
                  router.push(result.url);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: idx === selectedIndex ? 'rgba(0, 114, 255, 0.1)' : 'transparent',
                  borderLeft: `3px solid ${idx === selectedIndex ? getTypeColor(result.type) : 'transparent'}`,
                  transition: 'background 0.1s',
                  marginBottom: '4px'
                }}
              >
                <div style={{ 
                  width: '32px', height: '32px', 
                  borderRadius: '8px', 
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginRight: '16px',
                  color: getTypeColor(result.type)
                }}>
                  {getTypeIcon(result.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {result.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {result.subtitle}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  color: getTypeColor(result.type),
                  background: 'rgba(255,255,255,0.05)',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {result.type}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div style={{ 
          padding: '12px 20px', 
          borderTop: '1px solid var(--border-primary)', 
          display: 'flex', 
          gap: '16px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>↑</kbd> <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>↓</kbd> to navigate</span>
          <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Enter</kbd> to select</span>
          <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
