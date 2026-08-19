import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { certificateCreateSchema, parseBody } from '@/server/validations/schemas';
import { logger } from '@/server/config/logger';

// Certificate number generator: CERT-TYPE-YYYYMMDD-NNNNN
async function generateCertNumber(type: string): Promise<string> {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const count = await prisma.certificate.count();
  const seq = String(count + 1).padStart(5, '0');
  return `CERT-${type.substring(0, 3)}-${date}-${seq}`;
}

// GET /api/doctor/certificates — List certificates
export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const type = searchParams.get('type');

    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (type) where.type = type;

    const certificates = await prisma.certificate.findMany({
      where,
      include: {
        patient: { select: { name: true, phone: true, gender: true, dateOfBirth: true } },
        issuedBy: { select: { name: true } },
        signedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ certificates });
  } catch (error) {
    logger.error('[API] Certificates fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}, ['DOCTOR', 'ADMIN']);

// POST /api/doctor/certificates — Create a certificate
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const parsed = parseBody(certificateCreateSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const data = parsed.data;

    // Verify patient
    const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const certificateNumber = await generateCertNumber(data.type);

    const certificate = await prisma.certificate.create({
      data: {
        patientId: data.patientId,
        type: data.type,
        certificateNumber,
        issuedById: session.user.id,
        // Birth fields
        newbornName: data.newbornName || null,
        newbornGender: data.newbornGender || null,
        birthWeight: data.birthWeight || null,
        birthTime: data.birthTime ? new Date(data.birthTime) : null,
        motherName: data.motherName || null,
        fatherName: data.fatherName || null,
        placeOfBirth: data.placeOfBirth || null,
        // Death fields
        dateOfDeath: data.dateOfDeath ? new Date(data.dateOfDeath) : null,
        timeOfDeath: data.timeOfDeath ? new Date(data.timeOfDeath) : null,
        causeOfDeath: data.causeOfDeath || null,
        mannerOfDeath: data.mannerOfDeath || null,
        attendingPhysician: data.attendingPhysician || null,
        metadata: data.metadata || null,
      },
      include: {
        patient: { select: { name: true } },
        issuedBy: { select: { name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: `CERTIFICATE_${data.type}_CREATED`,
        entity: 'Certificate',
        entityId: certificate.id,
        details: {
          certificateNumber,
          patientName: patient.name,
          type: data.type,
        },
      },
    });

    logger.info(`[Certificate] ${data.type} certificate created: ${certificateNumber} for ${patient.name}`);

    return NextResponse.json({ certificate }, { status: 201 });
  } catch (error) {
    logger.error('[API] Certificate create error:', error);
    return NextResponse.json({ error: 'Failed to create certificate' }, { status: 500 });
  }
}, ['DOCTOR', 'ADMIN']);

// PATCH /api/doctor/certificates — Sign a certificate
export const PATCH = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const { certificateId } = body;

    if (!certificateId) {
      return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 });
    }

    const existing = await prisma.certificate.findUnique({ where: { id: certificateId } });
    if (!existing) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }
    if (existing.isSigned) {
      return NextResponse.json({ error: 'Certificate is already signed' }, { status: 400 });
    }

    const certificate = await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        isSigned: true,
        signedById: session.user.id,
      },
      include: {
        patient: { select: { name: true } },
        signedBy: { select: { name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CERTIFICATE_SIGNED',
        entity: 'Certificate',
        entityId: certificateId,
        details: { certificateNumber: certificate.certificateNumber, type: certificate.type },
      },
    });

    return NextResponse.json({ certificate });
  } catch (error) {
    logger.error('[API] Certificate sign error:', error);
    return NextResponse.json({ error: 'Failed to sign certificate' }, { status: 500 });
  }
}, ['DOCTOR', 'ADMIN']);
