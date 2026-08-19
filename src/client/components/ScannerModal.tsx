import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconBarcode, IconX } from '@/client/components/icons';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScannerModal({ isOpen, onClose }: ScannerModalProps) {
  const router = useRouter();
  const [patientId, setPatientId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientId.trim()) {
      router.push(`/dashboard/patient/${patientId.trim()}`);
      setPatientId('');
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{
        padding: '24px', width: '400px', maxWidth: '90vw', borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
            <IconBarcode /> Manual Barcode Entry
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <IconX size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Patient Barcode / ID</label>
            <input 
              ref={inputRef}
              type="text" 
              className="form-input" 
              placeholder="Scan or type patient ID here..."
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            If your physical scanner isn&apos;t working or the wristband is damaged, you can manually type the ID here.
          </p>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Lookup Patient
          </button>
        </form>
      </div>
    </div>
  );
}
