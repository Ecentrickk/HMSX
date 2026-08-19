import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { notificationEngine, HospitalEvent } from '@/server/services/notification.engine';

// POST /api/doctor/reports/[id]/sign — Sign and lock a report
export const POST = withAuth(async (req, { session, params }) => {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
    }

    const existing = await prisma.report.findUnique({
      where: { id },
      include: { patient: true, doctor: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (existing.doctorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized to sign this report' }, { status: 403 });
    }

    if (existing.isSigned) {
      return NextResponse.json({ error: 'Report already signed' }, { status: 400 });
    }

    const signed = await prisma.report.update({
      where: { id },
      data: {
        isSigned: true,
        isLocked: true,
        signedAt: new Date(),
      },
      include: { patient: true },
    });

    // Emit REPORT_READY event
    await notificationEngine.emit(HospitalEvent.REPORT_READY, {
      reportId: signed.id,
      patientName: signed.patient.name,
      patientPhone: signed.patient.phone,
      reportType: signed.type,
      reportTitle: signed.title,
      doctorName: existing.doctor.name,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'REPORT_SIGNED',
        entity: 'Report',
        entityId: signed.id,
        details: { title: signed.title, patientName: signed.patient.name },
      },
    });

    return NextResponse.json({ report: signed });
  } catch (error) {
    console.error('[API] Error signing report:', error);
    return NextResponse.json({ error: 'Failed to sign report' }, { status: 500 });
  }
}, ['DOCTOR', 'ADMIN']);
