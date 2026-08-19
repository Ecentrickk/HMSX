import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { notificationEngine, HospitalEvent } from '@/server/services/notification.engine';

// GET /api/nurse/vitals
export const GET = withAuth(async (req, { session }) => {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');

    const where: any = {};
    if (patientId) where.patientId = patientId;

    const vitals = await prisma.vitals.findMany({
      where,
      include: {
        patient: { select: { name: true } },
        recordedBy: { select: { name: true } },
      },
      orderBy: { recordedAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ vitals });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch vitals' }, { status: 500 });
  }
}, ['NURSE', 'DOCTOR', 'ADMIN']);

// Critical thresholds
const CRITICAL_THRESHOLDS = {
  heartRate: { min: 50, max: 120, label: 'Heart Rate' },
  oxygenSat: { min: 90, max: 100, label: 'SpO2' },
  temperature: { min: 95, max: 103, label: 'Temperature' },
  bloodPressureSystolic: { min: 80, max: 180, label: 'Systolic BP' },
};

// POST /api/nurse/vitals — Record new vitals + detect critical values
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();

    const vitals = await prisma.vitals.create({
      data: {
        patientId: body.patientId,
        recordedById: session.user.id,
        bloodPressureSystolic: body.systolic ? parseInt(body.systolic) : null,
        bloodPressureDiastolic: body.diastolic ? parseInt(body.diastolic) : null,
        heartRate: body.heartRate ? parseInt(body.heartRate) : null,
        temperature: body.temperature ? parseFloat(body.temperature) : null,
        oxygenSat: body.oxygenSat ? parseFloat(body.oxygenSat) : null,
        weight: body.weight ? parseFloat(body.weight) : null,
        height: body.height ? parseFloat(body.height) : null,
        notes: body.notes,
      },
      include: { patient: true },
    });

    // Check for critical values
    const criticals: { metric: string; value: number; threshold: string }[] = [];

    if (vitals.heartRate) {
      const t = CRITICAL_THRESHOLDS.heartRate;
      if (vitals.heartRate < t.min || vitals.heartRate > t.max) {
        criticals.push({ metric: t.label, value: vitals.heartRate, threshold: `Normal: ${t.min}-${t.max} bpm` });
      }
    }
    if (vitals.oxygenSat) {
      const t = CRITICAL_THRESHOLDS.oxygenSat;
      if (vitals.oxygenSat < t.min) {
        criticals.push({ metric: t.label, value: vitals.oxygenSat, threshold: `Normal: >${t.min}%` });
      }
    }
    if (vitals.temperature) {
      const t = CRITICAL_THRESHOLDS.temperature;
      if (vitals.temperature < t.min || vitals.temperature > t.max) {
        criticals.push({ metric: t.label, value: vitals.temperature, threshold: `Normal: ${t.min}-${t.max}F` });
      }
    }
    if (vitals.bloodPressureSystolic) {
      const t = CRITICAL_THRESHOLDS.bloodPressureSystolic;
      if (vitals.bloodPressureSystolic < t.min || vitals.bloodPressureSystolic > t.max) {
        criticals.push({ metric: t.label, value: vitals.bloodPressureSystolic, threshold: `Normal: ${t.min}-${t.max} mmHg` });
      }
    }

    // If critical values detected, notify doctors
    if (criticals.length > 0) {
      // Find doctors associated with this patient
      const patientDoctors = await prisma.appointment.findMany({
        where: { patientId: body.patientId },
        select: { doctorId: true },
        distinct: ['doctorId'],
      });
      const doctorIds = patientDoctors.map(a => a.doctorId);

      for (const critical of criticals) {
        await notificationEngine.emit(HospitalEvent.VITALS_CRITICAL, {
          patientId: body.patientId,
          patientName: vitals.patient.name,
          patientPhone: vitals.patient.phone,
          metric: critical.metric,
          value: critical.value,
          threshold: critical.threshold,
          doctorIds,
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'VITALS_RECORDED',
        entity: 'Vitals',
        entityId: vitals.id,
        details: {
          patientId: body.patientId,
          critical: criticals.length > 0,
          criticalMetrics: criticals.map(c => c.metric),
        },
      },
    });

    return NextResponse.json({ vitals, criticals }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record vitals' }, { status: 500 });
  }
}, ['NURSE', 'ADMIN']);
