import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { notificationEngine, HospitalEvent } from '@/server/services/notification.engine';

// POST /api/doctor/prescriptions — Create a prescription
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const { patientId, diagnosisId, medications, notes } = body;

    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        doctorId: session.user.id,
        diagnosisId: diagnosisId || null,
        notes,
        medications: {
          create: medications.map((med: any) => ({
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions || null,
          })),
        },
      },
      include: { medications: true, patient: true },
    });

    return NextResponse.json({ prescription }, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating prescription:', error);
    return NextResponse.json(
      { error: 'Failed to create prescription' },
      { status: 500 }
    );
  }
}, ['DOCTOR', 'ADMIN']);

// GET /api/doctor/prescriptions — Get prescriptions for the doctor
export const GET = withAuth(async (req, { session }) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { doctorId: session.user.id },
      include: {
        medications: true,
        patient: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ prescriptions });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  }
}, ['DOCTOR', 'ADMIN']);
