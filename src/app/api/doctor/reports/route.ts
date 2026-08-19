import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';

// GET /api/doctor/reports — Fetch doctor's reports
export const GET = withAuth(async (req, { session }) => {
  try {
    const reports = await prisma.report.findMany({
      where: { doctorId: session.user.id },
      include: {
        patient: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}, ['DOCTOR', 'ADMIN']);

// POST /api/doctor/reports — Create a new report
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const { patientId, type, title, content } = body;

    if (!patientId || !type || !title || !content) {
      return NextResponse.json({ error: 'Patient, type, title, and content are required' }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        patientId,
        doctorId: session.user.id,
        type,
        title,
        content,
      },
      include: { patient: { select: { name: true, phone: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'REPORT_CREATED',
        entity: 'Report',
        entityId: report.id,
        details: { title, type, patientName: report.patient.name },
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}, ['DOCTOR', 'ADMIN']);
