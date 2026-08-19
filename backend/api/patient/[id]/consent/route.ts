import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { logger } from '@/server/config/logger';

// GET /api/patient/[id]/consent — Get consent forms for a patient
export const GET = withAuth(async (req, { params }) => {
  try {
    const { id } = await params;

    // For now, we simulate consent forms by reading from the Report table with a specific type
    const consents = await prisma.report.findMany({
      where: {
        patientId: id,
        type: 'CONSENT_FORM',
      },
      include: {
        doctor: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ consents });
  } catch (error) {
    logger.error('[API] Consent fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch consent forms' }, { status: 500 });
  }
}, ['DOCTOR', 'ADMIN', 'NURSE', 'RECEPTIONIST']);

// POST /api/patient/[id]/consent — Create a new consent form
export const POST = withAuth(async (req, { session, params }) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, content, type } = body;

    if (!title || !content || !type) {
        return NextResponse.json({ error: 'Title, content, and consent type are required' }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const consent = await prisma.report.create({
      data: {
        patientId: id,
        doctorId: session.user.id,
        type: 'CONSENT_FORM',
        title: `[${type}] ${title}`,
        content,
        isSigned: false, // Patient/Guardian needs to sign
      },
      include: {
        doctor: { select: { name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CONSENT_FORM_CREATED',
        entity: 'Report',
        entityId: consent.id,
        details: { patientName: patient.name, type },
      },
    });

    logger.info(`[Consent] Created ${type} consent for patient ${patient.name}`);

    return NextResponse.json({ consent }, { status: 201 });
  } catch (error) {
    logger.error('[API] Consent create error:', error);
    return NextResponse.json({ error: 'Failed to create consent form' }, { status: 500 });
  }
}, ['DOCTOR', 'ADMIN']);
