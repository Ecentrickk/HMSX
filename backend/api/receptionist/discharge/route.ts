import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { dischargeSchema, parseBody } from '@/server/validations/schemas';
import { logger } from '@/server/config/logger';

// POST /api/receptionist/discharge — Process patient discharge
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const parsed = parseBody(dischargeSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { admissionId, dischargeType, dischargeSummary, referredTo } = parsed.data;

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: { patient: { select: { name: true } } },
    });

    if (!admission) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 });
    }
    if (admission.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Only active admissions can be discharged' }, { status: 400 });
    }

    // Free up the bed if assigned
    if (admission.bedId) {
      await prisma.bed.update({
        where: { id: admission.bedId },
        data: { status: 'AVAILABLE', patientId: null },
      });
    }

    const updated = await prisma.admission.update({
      where: { id: admissionId },
      data: {
        status: dischargeType === 'DECEASED' ? 'DECEASED' : 'DISCHARGED',
        dischargeDate: new Date(),
        dischargeType,
        dischargeSummary: dischargeSummary || null,
        referredTo: referredTo || null,
      },
      include: {
        patient: { select: { name: true, phone: true } },
        attendingDoctor: { select: { name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PATIENT_DISCHARGED',
        entity: 'Admission',
        entityId: admissionId,
        details: {
          uhid: updated.uhid,
          patientName: updated.patient.name,
          dischargeType,
        },
      },
    });

    logger.info(`[Discharge] Patient ${updated.patient.name} discharged (${dischargeType}) - UHID: ${updated.uhid}`);

    return NextResponse.json({ admission: updated });
  } catch (error) {
    logger.error('[API] Discharge error:', error);
    return NextResponse.json({ error: 'Failed to process discharge' }, { status: 500 });
  }
}, ['RECEPTIONIST', 'ADMIN']);
