import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { logger } from '@/server/config/logger';

// UHID Generator for emergency
async function generateEmergencyUHID(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.admission.count();
  const seq = String(count + 1).padStart(5, '0');
  return `H1MS-${year}-${seq}`;
}

// POST /api/emergency — Fast-register emergency patient and create IPD admission
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const { name, phone, gender, dateOfBirth, triageLevel, notes, doctorId } = body;

    // Minimal validation for emergency
    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required for emergency registration' }, { status: 400 });
    }

    // Check if patient already exists by phone
    let patient = await prisma.patient.findFirst({ where: { phone } });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          name,
          phone,
          gender: gender || 'OTHER',
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('1900-01-01'),
        },
      });
      logger.info(`[Emergency] New patient created: ${name} (${phone})`);
    }

    // Auto-assign doctor if not specified
    let assignedDoctorId = doctorId;
    if (!assignedDoctorId) {
      const availableDoctor = await prisma.user.findFirst({
        where: { role: 'DOCTOR', isActive: true, department: 'Emergency' },
      });
      if (!availableDoctor) {
        // Fallback: any active doctor
        const anyDoctor = await prisma.user.findFirst({
          where: { role: 'DOCTOR', isActive: true },
        });
        assignedDoctorId = anyDoctor?.id;
      } else {
        assignedDoctorId = availableDoctor.id;
      }
    }

    if (!assignedDoctorId) {
      return NextResponse.json({ error: 'No doctors available' }, { status: 503 });
    }

    const uhid = await generateEmergencyUHID();

    // Find an available emergency bed
    let bedId: string | null = null;
    const emergencyBed = await prisma.bed.findFirst({
      where: {
        status: 'AVAILABLE',
        ward: { type: 'EMERGENCY' },
      },
    });
    if (emergencyBed) {
      bedId = emergencyBed.id;
      await prisma.bed.update({
        where: { id: emergencyBed.id },
        data: { status: 'OCCUPIED', patientId: patient.id },
      });
    }

    // Create emergency IPD admission
    const admission = await prisma.admission.create({
      data: {
        patientId: patient.id,
        admissionType: 'IPD',
        uhid,
        attendingDoctorId: assignedDoctorId,
        department: 'Emergency',
        bedId,
        notes: `[EMERGENCY - Triage: ${triageLevel || 'UNASSIGNED'}] ${notes || ''}`,
      },
      include: {
        patient: { select: { name: true } },
        attendingDoctor: { select: { name: true } },
      },
    });

    // Create an emergency appointment
    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: assignedDoctorId,
        scheduledAt: new Date(),
        type: 'EMERGENCY',
        status: 'IN_PROGRESS',
        notes: `Emergency admission. Triage: ${triageLevel || 'UNASSIGNED'}`,
        createdById: session.user.id,
      },
    });

    // Notify the assigned doctor
    await prisma.staffNotification.create({
      data: {
        recipientId: assignedDoctorId,
        type: 'EMERGENCY_PATIENT',
        title: '🚨 Emergency Patient Assigned',
        message: `Emergency patient ${patient.name} (Triage: ${triageLevel || 'UNASSIGNED'}) has been assigned to you. UHID: ${uhid}`,
        link: '/dashboard/doctor/patients',
        metadata: { admissionId: admission.id, triageLevel, patientId: patient.id },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EMERGENCY_ADMISSION',
        entity: 'Admission',
        entityId: admission.id,
        details: { uhid, patientName: patient.name, triageLevel, doctorName: admission.attendingDoctor.name },
      },
    });

    logger.info(`[Emergency] Patient ${patient.name} admitted (Triage: ${triageLevel}) - UHID: ${uhid}`);

    return NextResponse.json({
      patient,
      admission,
      triageLevel: triageLevel || 'UNASSIGNED',
      bedAssigned: !!bedId,
    }, { status: 201 });
  } catch (error) {
    logger.error('[API] Emergency admission error:', error);
    return NextResponse.json({ error: 'Failed to process emergency admission' }, { status: 500 });
  }
}, ['RECEPTIONIST', 'ADMIN', 'NURSE', 'DOCTOR']);
