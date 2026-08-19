import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { admissionCreateSchema, admissionConvertSchema, parseBody } from '@/server/validations/schemas';
import { logger } from '@/server/config/logger';

// UHID Generator: H1MS-YYYY-NNNNN
async function generateUHID(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.admission.count();
  const seq = String(count + 1).padStart(5, '0');
  return `H1MS-${year}-${seq}`;
}

// GET /api/receptionist/admissions — List admissions
export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // OPD or IPD
    const status = searchParams.get('status') || 'ACTIVE';
    const doctorId = searchParams.get('doctorId');

    const where: any = {};
    if (type) where.admissionType = type;
    if (status) where.status = status;
    if (doctorId) where.attendingDoctorId = doctorId;

    const admissions = await prisma.admission.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, phone: true, gender: true, dateOfBirth: true, bloodGroup: true } },
        attendingDoctor: { select: { id: true, name: true, department: true } },
      },
      orderBy: { admissionDate: 'desc' },
    });

    return NextResponse.json({ admissions });
  } catch (error) {
    logger.error('[API] Admissions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch admissions' }, { status: 500 });
  }
}, ['RECEPTIONIST', 'ADMIN', 'DOCTOR', 'NURSE', 'ACCOUNTANT']);

// POST /api/receptionist/admissions — Create OPD/IPD admission
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const parsed = parseBody(admissionCreateSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { patientId, admissionType, attendingDoctorId, department, wardId, bedId, referredFrom, notes } = parsed.data;

    // Verify patient exists
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Check for active admission
    const activeAdmission = await prisma.admission.findFirst({
      where: { patientId, status: 'ACTIVE' },
    });
    if (activeAdmission) {
      return NextResponse.json({
        error: `Patient already has an active ${activeAdmission.admissionType} admission (${activeAdmission.uhid})`,
      }, { status: 409 });
    }

    const uhid = await generateUHID();

    // If IPD + bed assigned, mark bed as occupied
    if (admissionType === 'IPD' && bedId) {
      await prisma.bed.update({
        where: { id: bedId },
        data: { status: 'OCCUPIED', patientId },
      });
    }

    const admission = await prisma.admission.create({
      data: {
        patientId,
        admissionType,
        uhid,
        attendingDoctorId,
        department: department || null,
        wardId: wardId || null,
        bedId: bedId || null,
        referredFrom: referredFrom || null,
        notes: notes || null,
      },
      include: {
        patient: { select: { name: true } },
        attendingDoctor: { select: { name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: `${admissionType}_ADMISSION_CREATED`,
        entity: 'Admission',
        entityId: admission.id,
        details: { uhid, patientName: admission.patient.name, type: admissionType },
      },
    });

    logger.info(`[Admission] ${admissionType} admission created: ${uhid} for ${admission.patient.name}`);

    return NextResponse.json({ admission }, { status: 201 });
  } catch (error) {
    logger.error('[API] Admission create error:', error);
    return NextResponse.json({ error: 'Failed to create admission' }, { status: 500 });
  }
}, ['RECEPTIONIST', 'ADMIN']);

// PATCH /api/receptionist/admissions — Convert OPD → IPD
export const PATCH = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const parsed = parseBody(admissionConvertSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { admissionId, wardId, bedId, notes } = parsed.data;

    const existing = await prisma.admission.findUnique({ where: { id: admissionId } });
    if (!existing) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 });
    }
    if (existing.admissionType !== 'OPD') {
      return NextResponse.json({ error: 'Only OPD admissions can be converted to IPD' }, { status: 400 });
    }
    if (existing.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Only active admissions can be converted' }, { status: 400 });
    }

    // Assign bed if provided
    if (bedId) {
      await prisma.bed.update({
        where: { id: bedId },
        data: { status: 'OCCUPIED', patientId: existing.patientId },
      });
    }

    const updated = await prisma.admission.update({
      where: { id: admissionId },
      data: {
        admissionType: 'IPD',
        wardId: wardId || null,
        bedId: bedId || null,
        notes: notes ? `${existing.notes || ''}\n[OPD→IPD] ${notes}` : existing.notes,
      },
      include: {
        patient: { select: { name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMISSION_OPD_TO_IPD',
        entity: 'Admission',
        entityId: admissionId,
        details: { uhid: updated.uhid, patientName: updated.patient.name },
      },
    });

    logger.info(`[Admission] OPD→IPD conversion: ${updated.uhid}`);

    return NextResponse.json({ admission: updated });
  } catch (error) {
    logger.error('[API] Admission conversion error:', error);
    return NextResponse.json({ error: 'Failed to convert admission' }, { status: 500 });
  }
}, ['RECEPTIONIST', 'ADMIN']);
