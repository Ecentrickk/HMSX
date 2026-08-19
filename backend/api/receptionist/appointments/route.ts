import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { WhatsAppService } from '@/server/services/whatsapp.service';
import { notificationEngine, HospitalEvent } from '@/server/services/notification.engine';

// GET /api/receptionist/appointments
export const GET = withAuth(async (req, { session }) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: { select: { name: true, phone: true } },
        doctor: { select: { name: true, department: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}, ['RECEPTIONIST', 'ADMIN']);

// POST /api/receptionist/appointments
import { z } from 'zod';
import { logger } from '@/server/config/logger';

const createAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  scheduledAt: z.string().datetime({ message: 'Invalid datetime format' }),
  endAt: z.string().datetime().optional().nullable(),
  type: z.enum(['CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'ROUTINE_CHECKUP', 'PROCEDURE']).optional(),
  notes: z.string().optional(),
});

export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    
    // Validate request body
    const validationResult = createAppointmentSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn(`[Appointments API] Validation failed: ${validationResult.error.message}`);
      return NextResponse.json({ error: 'Invalid payload', details: validationResult.error.issues }, { status: 400 });
    }

    const validData = validationResult.data;

    const appointment = await prisma.appointment.create({
      data: {
        patientId: validData.patientId,
        doctorId: validData.doctorId,
        scheduledAt: new Date(validData.scheduledAt),
        endAt: validData.endAt ? new Date(validData.endAt) : null,
        type: validData.type || 'CONSULTATION',
        notes: validData.notes,
        createdById: session.user.id,
      },
      include: {
        patient: true,
        doctor: { select: { id: true, name: true } },
      },
    });

    // Emit APPOINTMENT_CREATED event → notifies doctor + WhatsApp to patient
    await notificationEngine.emit(HospitalEvent.APPOINTMENT_CREATED, {
      appointmentId: appointment.id,
      patientName: appointment.patient.name,
      patientPhone: appointment.patient.phone,
      doctorId: appointment.doctor.id,
      doctorName: appointment.doctor.name,
      scheduledAt: appointment.scheduledAt,
      type: appointment.type,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'APPOINTMENT_CREATED',
        entity: 'Appointment',
        entityId: appointment.id,
        details: {
          patientName: appointment.patient.name,
          doctorName: appointment.doctor.name,
          scheduledAt: appointment.scheduledAt,
        },
      },
    });

    const message = `Hello ${appointment.patient.name},\nYour appointment with Dr. ${appointment.doctor.name} is confirmed for ${new Date(appointment.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}.\nYour token number is ${appointment.id.slice(-4).toUpperCase()}.\n\nThank you,\n${process.env.HOSPITAL_NAME || 'Hospital'}`;
    WhatsAppService.sendMessage(appointment.patient.phone, message).catch(err => {
      logger.error(`[Appointments API] WhatsApp send failed: ${err.message}`);
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error: any) {
    logger.error(`[Appointments API] Error creating appointment: ${error.message}\n${error.stack}`);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}, ['RECEPTIONIST', 'ADMIN']);
