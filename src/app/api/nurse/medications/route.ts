import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';

// GET /api/nurse/medications — Fetch medication schedules for today
export const GET = withAuth(async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const schedules = await prisma.medicationSchedule.findMany({
      where: {
        scheduledTime: { gte: today, lt: tomorrow },
      },
      include: {
        patient: { select: { name: true } },
        nurse: { select: { name: true } },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    // Also get the bed info for each patient
    const patientIds = [...new Set(schedules.map(s => s.patientId))];
    const beds = await prisma.bed.findMany({
      where: { patientId: { in: patientIds }, status: 'OCCUPIED' },
      select: { patientId: true, bedNumber: true, ward: { select: { name: true } } },
    });
    const bedMap = new Map(beds.map(b => [b.patientId!, { bedNumber: b.bedNumber, wardName: b.ward.name }]));

    const result = schedules.map(s => ({
      id: s.id,
      patientId: s.patientId,
      patientName: s.patient.name,
      nurseName: s.nurse?.name || 'Unassigned',
      medicationName: s.medicationName,
      dosage: s.dosage,
      scheduledTime: s.scheduledTime,
      administeredAt: s.administeredAt,
      status: s.status,
      notes: s.notes,
      bed: bedMap.get(s.patientId) || null,
    }));

    return NextResponse.json({ schedules: result });
  } catch (error) {
    console.error('[API] Error fetching medication schedules:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}, ['NURSE', 'ADMIN']);

// PATCH /api/nurse/medications — Update medication schedule status
export const PATCH = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const { scheduleId, action, notes } = body;
    // action: 'administer' | 'skip'

    if (!scheduleId || !action) {
      return NextResponse.json({ error: 'scheduleId and action are required' }, { status: 400 });
    }

    const data: any = { notes: notes || null };

    if (action === 'administer') {
      data.status = 'ADMINISTERED';
      data.administeredAt = new Date();
      data.nurseId = session.user.id;
    } else if (action === 'skip') {
      data.status = 'SKIPPED';
      data.nurseId = session.user.id;
    }

    const updated = await prisma.medicationSchedule.update({
      where: { id: scheduleId },
      data,
      include: { patient: { select: { name: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: action === 'administer' ? 'MEDICATION_ADMINISTERED' : 'MEDICATION_SKIPPED',
        entity: 'MedicationSchedule',
        entityId: scheduleId,
        details: {
          patientName: updated.patient.name,
          medicationName: updated.medicationName,
          action,
        },
      },
    });

    return NextResponse.json({ schedule: updated });
  } catch (error) {
    console.error('[API] Error updating medication schedule:', error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}, ['NURSE', 'ADMIN']);
