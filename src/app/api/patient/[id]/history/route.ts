import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { medicalHistoryCreateSchema, parseBody } from '@/server/validations/schemas';
import { logger } from '@/server/config/logger';

// GET /api/patient/[id]/history — Get patient's medical history
export const GET = withAuth(async (req, { params }) => {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const where: any = { patientId: id };
    if (category) where.category = category;

    const histories = await prisma.medicalHistory.findMany({
      where,
      include: {
        recordedBy: { select: { name: true, role: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ histories });
  } catch (error) {
    logger.error('[API] Medical history fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch medical history' }, { status: 500 });
  }
}, ['DOCTOR', 'NURSE', 'ADMIN']);

// POST /api/patient/[id]/history — Add medical history entry
export const POST = withAuth(async (req, { session, params }) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = parseBody(medicalHistoryCreateSchema, { ...body, patientId: id });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const data = parsed.data;

    // Verify patient exists
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const history = await prisma.medicalHistory.create({
      data: {
        patientId: id,
        recordedById: session.user.id,
        category: data.category,
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        severity: data.severity || null,
        isOngoing: data.isOngoing,
        attachments: data.attachments,
        metadata: data.metadata || null,
      },
      include: {
        recordedBy: { select: { name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'MEDICAL_HISTORY_ADDED',
        entity: 'MedicalHistory',
        entityId: history.id,
        details: { patientName: patient.name, category: data.category, title: data.title },
      },
    });

    logger.info(`[MedHistory] Added ${data.category} for patient ${patient.name}`);

    return NextResponse.json({ history }, { status: 201 });
  } catch (error) {
    logger.error('[API] Medical history create error:', error);
    return NextResponse.json({ error: 'Failed to add medical history' }, { status: 500 });
  }
}, ['DOCTOR', 'NURSE', 'ADMIN']);

// PATCH /api/patient/[id]/history — Update medical history entry
export const PATCH = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const { historyId, ...updates } = body;

    if (!historyId) {
      return NextResponse.json({ error: 'History ID is required' }, { status: 400 });
    }

    const history = await prisma.medicalHistory.update({
      where: { id: historyId },
      data: {
        ...(updates.title && { title: updates.title }),
        ...(updates.description && { description: updates.description }),
        ...(updates.severity !== undefined && { severity: updates.severity }),
        ...(updates.isOngoing !== undefined && { isOngoing: updates.isOngoing }),
        ...(updates.date && { date: new Date(updates.date) }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'MEDICAL_HISTORY_UPDATED',
        entity: 'MedicalHistory',
        entityId: historyId,
      },
    });

    return NextResponse.json({ history });
  } catch (error) {
    logger.error('[API] Medical history update error:', error);
    return NextResponse.json({ error: 'Failed to update medical history' }, { status: 500 });
  }
}, ['DOCTOR', 'ADMIN']);
