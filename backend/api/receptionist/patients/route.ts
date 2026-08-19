import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { notificationEngine, HospitalEvent } from '@/server/services/notification.engine';

// GET /api/receptionist/patients — list all patients
export const GET = withAuth(async () => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { appointments: true } },
      },
    });
    return NextResponse.json({ patients });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}, ['RECEPTIONIST', 'ADMIN', 'DOCTOR', 'NURSE']);

// POST /api/receptionist/patients — register a new patient
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const { name, phone, email, dateOfBirth, gender, bloodGroup, address, emergencyContact, emergencyPhone } = body;

    if (!name || !phone || !dateOfBirth || !gender) {
      return NextResponse.json({ error: 'Name, phone, date of birth, and gender are required' }, { status: 400 });
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        phone,
        email: email || null,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        bloodGroup: bloodGroup || null,
        address: address || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
      },
    });

    // Emit PATIENT_REGISTERED event → notifies receptionists
    await notificationEngine.emit(HospitalEvent.PATIENT_REGISTERED, {
      patientId: patient.id,
      patientName: patient.name,
      patientPhone: patient.phone,
      registeredById: session.user.id,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PATIENT_REGISTERED',
        entity: 'Patient',
        entityId: patient.id,
        details: { name: patient.name, phone: patient.phone },
      },
    });

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    console.error('Patient create error:', error);
    return NextResponse.json({ error: 'Failed to register patient' }, { status: 500 });
  }
}, ['RECEPTIONIST', 'ADMIN']);
