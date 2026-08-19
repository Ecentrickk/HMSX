import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { referralCreateSchema, parseBody } from '@/server/validations/schemas';
import { logger } from '@/server/config/logger';

// GET /api/doctor/referrals — List referrals
export const GET = withAuth(async (req, { session }) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // incoming or outgoing

    const where: any = {};
    if (type === 'incoming') {
      where.referredToId = session.user.id;
    } else if (type === 'outgoing') {
      where.referredById = session.user.id;
    } else {
      where.OR = [
        { referredById: session.user.id },
        { referredToId: session.user.id }
      ];
    }

    const referrals = await prisma.referral.findMany({
      where,
      include: {
        patient: { select: { name: true, phone: true } },
        referredBy: { select: { name: true, department: true } },
        referredTo: { select: { name: true, department: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ referrals });
  } catch (error) {
    logger.error('[API] Referrals fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  }
}, ['DOCTOR', 'ADMIN']);

// POST /api/doctor/referrals — Create a new referral
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const parsed = parseBody(referralCreateSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const data = parsed.data;

    // Verify patient
    const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Verify target doctor if INTERNAL
    if (data.referralType === 'INTERNAL' && data.referredToId) {
      const targetDoctor = await prisma.user.findUnique({ where: { id: data.referredToId } });
      if (!targetDoctor || targetDoctor.role !== 'DOCTOR') {
         return NextResponse.json({ error: 'Invalid target doctor' }, { status: 400 });
      }
    }

    const referral = await prisma.referral.create({
      data: {
        patientId: data.patientId,
        referredById: session.user.id,
        referredToId: data.referredToId || null,
        referralType: data.referralType,
        department: data.department || null,
        externalHospital: data.externalHospital || null,
        reason: data.reason,
        urgency: data.urgency,
        notes: data.notes || null,
        status: 'PENDING',
      },
      include: {
        patient: { select: { name: true } },
        referredTo: { select: { name: true } },
      },
    });

    // If internal, notify the target doctor
    if (data.referralType === 'INTERNAL' && data.referredToId) {
       await prisma.staffNotification.create({
          data: {
            recipientId: data.referredToId,
            type: 'REFERRAL_RECEIVED',
            title: 'New Patient Referral',
            message: `Dr. ${session.user.name} referred ${patient.name} to you. Urgency: ${data.urgency}`,
            link: '/dashboard/doctor/patients',
            metadata: { referralId: referral.id, patientId: data.patientId },
          },
        });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'REFERRAL_CREATED',
        entity: 'Referral',
        entityId: referral.id,
        details: { 
            patientName: patient.name, 
            type: data.referralType, 
            target: data.referralType === 'INTERNAL' ? referral.referredTo?.name : data.externalHospital 
        },
      },
    });

    logger.info(`[Referral] Created by Dr. ${session.user.name} for patient ${patient.name}`);

    return NextResponse.json({ referral }, { status: 201 });
  } catch (error) {
    logger.error('[API] Referral create error:', error);
    return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
  }
}, ['DOCTOR', 'ADMIN']);

// PATCH /api/doctor/referrals — Update referral status
export const PATCH = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const { referralId, status, notes } = body;

    if (!referralId || !status) {
      return NextResponse.json({ error: 'Referral ID and status are required' }, { status: 400 });
    }

    const existing = await prisma.referral.findUnique({ 
        where: { id: referralId },
        include: { patient: { select: { name: true } }, referredBy: { select: { name: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }

    // Only the target doctor (or admin) can accept/decline
    if (existing.referredToId !== session.user.id && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'You are not authorized to update this referral' }, { status: 403 });
    }

    const updated = await prisma.referral.update({
      where: { id: referralId },
      data: {
        status,
        notes: notes ? `${existing.notes || ''}\n[Status Update] ${notes}` : existing.notes,
      },
    });

    // Notify the referring doctor about the status change
    await prisma.staffNotification.create({
        data: {
          recipientId: existing.referredById,
          type: 'REFERRAL_UPDATED',
          title: `Referral ${status}`,
          message: `Your referral for ${existing.patient.name} was marked as ${status} by Dr. ${session.user.name}.`,
          link: '/dashboard/doctor/patients',
          metadata: { referralId, patientId: existing.patientId, status },
        },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'REFERRAL_STATUS_UPDATED',
        entity: 'Referral',
        entityId: referralId,
        details: { status, patientName: existing.patient.name },
      },
    });

    return NextResponse.json({ referral: updated });
  } catch (error) {
    logger.error('[API] Referral update error:', error);
    return NextResponse.json({ error: 'Failed to update referral status' }, { status: 500 });
  }
}, ['DOCTOR', 'ADMIN']);
