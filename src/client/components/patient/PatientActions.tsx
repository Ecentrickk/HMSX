'use client';
import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { IconPlus, IconFileText, IconPrinter, IconActivity, IconMessageSquare, IconRefresh } from '@/client/components/icons';
import type { Role } from '@prisma/client';

export function PatientActions({ patientId, role, activeAdmission }: { patientId: string, role: Role, activeAdmission?: any }) {
  const router = useRouter();
  const [sendingWA, setSendingWA] = useState(false);
  const [convertingIPD, setConvertingIPD] = useState(false);

  const handleDownloadRecord = () => {
    window.open(`/api/pdf/record/${patientId}`, '_blank');
  };

  const handleSendWhatsApp = async () => {
    setSendingWA(true);
    try {
      await fetch(`/api/patient/${patientId}/whatsapp`, { method: 'POST' });
      alert('WhatsApp dispatch requested');
    } catch {
      alert('Failed to dispatch WhatsApp');
    } finally {
      setSendingWA(false);
    }
  };

  const handleConvertToIPD = async () => {
    if (!activeAdmission || activeAdmission.admissionType !== 'OPD') return;
    
    if (!confirm('Are you sure you want to convert this patient from OPD to IPD?')) return;

    setConvertingIPD(true);
    try {
      const res = await fetch('/api/receptionist/admissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionId: activeAdmission.id,
          notes: 'Converted from OPD to IPD via patient profile.',
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to convert to IPD');
      } else {
        alert('Successfully converted to IPD');
        window.location.reload();
      }
    } catch {
      alert('Network error');
    } finally {
      setConvertingIPD(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
      <button 
        className="btn btn-primary btn-sm"
        onClick={handleDownloadRecord}
      >
        <IconPrinter size={14} /> Download Record
      </button>

      <button 
        className="btn btn-secondary btn-sm"
        onClick={handleSendWhatsApp}
        disabled={sendingWA}
        style={{ marginRight: 'auto', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', borderColor: '#25D366' }}
      >
        <IconMessageSquare size={14} /> {sendingWA ? 'Sending...' : 'Send via WhatsApp'}
      </button>

      {role === 'DOCTOR' && (
        <>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => router.push(`/dashboard/doctor/prescriptions/new?patient=${patientId}`)}
          >
            <IconPlus size={14} /> New Prescription
          </button>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => router.push(`/dashboard/doctor/reports/new?patient=${patientId}`)}
          >
            <IconFileText size={14} /> Add Report
          </button>
        </>
      )}

      {role === 'RECEPTIONIST' && (
        <>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => router.push(`/dashboard/receptionist/appointments/new?patient=${patientId}`)}
          >
            <IconPlus size={14} /> Book Appointment
          </button>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => window.open(`/api/pdf/billing/${patientId}`, '_blank')}
          >
            <IconPrinter size={14} /> Print Bill
          </button>
          
          {activeAdmission && activeAdmission.admissionType === 'OPD' && (
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleConvertToIPD}
              disabled={convertingIPD}
            >
              <IconRefresh size={14} /> {convertingIPD ? 'Converting...' : 'Convert to IPD'}
            </button>
          )}
        </>
      )}

      {role === 'NURSE' && (
        <>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => router.push(`/dashboard/nurse/vitals/new?patient=${patientId}`)}
          >
            <IconActivity size={14} /> Record Vitals
          </button>
        </>
      )}
    </div>
  );
}
