import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { logger } from '@/server/config/logger';

// GET /api/doctor/admissions — Doctor's active admissions
export const GET = withAuth(async (req, { session }) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ACTIVE';
    const type = searchParams.get('type');

    const where: any = {
      attendingDoctorId: session.user.id,
    };
    if (status) where.status = status;
    if (type) where.admissionType = type;

    const admissions = await prisma.admission.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true, name: true, phone: true, gender: true,
            dateOfBirth: true, bloodGroup: true,
          },
        },
      },
      orderBy: { admissionDate: 'desc' },
    });

    return NextResponse.json({ admissions });
  } catch (error) {
    logger.error('[API] Doctor admissions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch admissions' }, { status: 500 });
  }
}, ['DOCTOR', 'ADMIN']);

// PATCH /api/doctor/admissions — Request OPD→IPD conversion
export const PATCH = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const { admissionId, notes } = body;

    if (!admissionId) {
      return NextResponse.json({ error: 'Admission ID is required' }, { status: 400 });
    }

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: { patient: { select: { name: true } } },
    });

    if (!admission) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 });
    }

    if (admission.attendingDoctorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You can only manage your own admissions' }, { status: 403 });
    }

    // Create a staff notification for the receptionist about the conversion request
    const receptionists = await prisma.user.findMany({
      where: { role: 'RECEPTIONIST', isActive: true },
      select: { id: true },
    });

    await Promise.all(
      receptionists.map((r) =>
        prisma.staffNotification.create({
          data: {
            recipientId: r.id,
            type: 'ADMISSION_CONVERSION_REQUEST',
            title: 'IPD Admission Requested',
            message: `Dr. ${session.user.name} requests OPD→IPD conversion for patient ${admission.patient.name} (${admission.uhid}). Reason: ${notes || 'Not specified'}`,
            link: '/dashboard/receptionist/admissions',
            metadata: { admissionId, doctorName: session.user.name },
          },
        })
      )
    );

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'IPD_CONVERSION_REQUESTED',
        entity: 'Admission',
        entityId: admissionId,
        details: { uhid: admission.uhid, patientName: admission.patient.name, notes },
      },
    });

    logger.info(`[Admission] IPD conversion requested by Dr. ${session.user.name} for ${admission.uhid}`);

    return NextResponse.json({ message: 'IPD conversion request sent to reception' });
  } catch (error) {
    logger.error('[API] Doctor admission update error:', error);
    return NextResponse.json({ error: 'Failed to request conversion' }, { status: 500 });
  }
}, ['DOCTOR', 'ADMIN']);
