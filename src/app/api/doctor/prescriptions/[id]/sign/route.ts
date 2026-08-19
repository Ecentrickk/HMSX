import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { notificationEngine, HospitalEvent } from '@/server/services/notification.engine';

// POST /api/doctor/prescriptions/[id]/sign — Sign and lock a prescription
export const POST = withAuth(async (req, { session, params }) => {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: 'Prescription ID required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.prescription.findUnique({
      where: { id },
      include: { patient: true, medications: true, doctor: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    if (existing.doctorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized to sign this prescription' }, { status: 403 });
    }

    if (existing.isSigned) {
      return NextResponse.json({ error: 'Prescription already signed' }, { status: 400 });
    }

    // Sign the prescription
    const signed = await prisma.prescription.update({
      where: { id },
      data: {
        isSigned: true,
        signedAt: new Date(),
      },
      include: { medications: true, patient: true },
    });

    // Trigger notification via Observer pattern
    // This will auto-create MedicationSchedules, notify nurses & pharmacists, and WhatsApp patient
    await notificationEngine.emit(HospitalEvent.PRESCRIPTION_SIGNED, {
      prescriptionId: signed.id,
      patientId: signed.patient.id,
      patientName: signed.patient.name,
      patientPhone: signed.patient.phone,
      doctorId: existing.doctor.id,
      doctorName: existing.doctor.name,
      medications: signed.medications.map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration || '',
      })),
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PRESCRIPTION_SIGNED',
        entity: 'Prescription',
        entityId: signed.id,
        details: {
          patientName: signed.patient.name,
          medicationCount: signed.medications.length,
        },
      },
    });

    return NextResponse.json({ prescription: signed });
  } catch (error) {
    console.error('[API] Error signing prescription:', error);
    return NextResponse.json(
      { error: 'Failed to sign prescription' },
      { status: 500 }
    );
  }
}, ['DOCTOR', 'ADMIN']);
