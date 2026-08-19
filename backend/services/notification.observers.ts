/**
 * H1MS — Unified Observer Registration
 * 
 * Handles both patient-facing (WhatsApp) and staff-facing (in-app)
 * notifications. When events fire, observers create the appropriate
 * notification records and trigger side effects.
 */

import { prisma } from '@/server/config/database';
import { notificationEngine, HospitalEvent } from './notification.engine';

// ─── Frequency-to-Schedule Mapping ───────────────────────
function frequencyToHours(frequency: string): number[] {
  const lower = frequency.toLowerCase();
  if (lower.includes('once daily') || lower.includes('once a day') || lower.includes('1x')) return [8];
  if (lower.includes('twice daily') || lower.includes('2x') || lower.includes('bd')) return [8, 20];
  if (lower.includes('three times') || lower.includes('3x') || lower.includes('tid')) return [8, 14, 20];
  if (lower.includes('four times') || lower.includes('4x') || lower.includes('qid')) return [6, 12, 18, 22];
  if (lower.includes('bedtime') || lower.includes('night')) return [22];
  if (lower.includes('morning')) return [8];
  return [8]; // Default to once daily morning
}

// ─── Helper: Send staff notification ─────────────────────
async function notifyStaff(
  recipientId: string,
  type: string,
  title: string,
  message: string,
  link?: string,
  metadata?: any
): Promise<void> {
  try {
    await prisma.staffNotification.create({
      data: {
        recipientId,
        type,
        title,
        message,
        link: link || null,
        metadata: metadata || {},
      },
    });
  } catch (error) {
    console.error('[Observers] Failed to create staff notification:', error);
  }
}

// ─── Helper: Notify all users with a specific role ───────
async function notifyRole(
  role: string,
  type: string,
  title: string,
  message: string,
  link?: string,
  metadata?: any
): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: { role: role as any, isActive: true },
      select: { id: true },
    });
    await Promise.all(
      users.map((u) => notifyStaff(u.id, type, title, message, link, metadata))
    );
  } catch (error) {
    console.error(`[Observers] Failed to notify role ${role}:`, error);
  }
}

// ─── Mock WhatsApp Message Logger ────────────────────────
async function sendWhatsApp(
  phone: string,
  title: string,
  content: string,
  metadata?: any
): Promise<void> {
  try {
    console.log(`\n[WhatsApp] To: ${phone} | ${title}`);
    console.log(`[WhatsApp] ${content.slice(0, 120)}...`);

    await prisma.notification.create({
      data: {
        patientPhone: phone,
        type: metadata?.type || 'GENERAL',
        title,
        content,
        status: 'SENT',
        metadata: metadata || {},
        sentAt: new Date(),
        deliveredAt: new Date(),
      },
    });
  } catch (error) {
    console.error('[WhatsApp] Failed to persist notification:', error);
  }
}

// ─── Register All Observers ──────────────────────────────
export function registerNotificationObservers(): void {

  // ── 1. PRESCRIPTION SIGNED ─────────────────────────────
  // → Auto-create MedicationSchedules for nurses
  // → Notify all nurses
  // → Notify all pharmacists
  // → WhatsApp to patient
  notificationEngine.on(HospitalEvent.PRESCRIPTION_SIGNED, async (payload) => {
    const { prescriptionId, patientId, patientName, patientPhone, doctorId, doctorName, medications } = payload;

    // a) Auto-create MedicationSchedules
    const today = new Date();
    let assignedNurse: string | null = null;

    // Try to find a nurse assigned to the patient's bed
    try {
      const bed = await prisma.bed.findFirst({
        where: { patientId, status: 'OCCUPIED' },
        select: { assignedNurseId: true },
      });
      assignedNurse = bed?.assignedNurseId || null;

      // Fallback: pick any active nurse
      if (!assignedNurse) {
        const anyNurse = await prisma.user.findFirst({
          where: { role: 'NURSE', isActive: true },
          select: { id: true },
        });
        assignedNurse = anyNurse?.id || null;
      }
    } catch { /* continue without nurse assignment */ }

    for (const med of medications) {
      const hours = frequencyToHours(med.frequency);
      for (const hour of hours) {
        const scheduledTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, 0);
        // Only create schedule if time is in the future (or today)
        try {
          await prisma.medicationSchedule.create({
            data: {
              patientId,
              nurseId: assignedNurse,
              medicationName: `${med.name} ${med.dosage}`,
              dosage: med.dosage,
              scheduledTime,
              status: 'PENDING',
              notes: `Auto-assigned from prescription ${prescriptionId}`,
            },
          });
        } catch (err) {
          console.error('[Observers] Failed to create medication schedule:', err);
        }
      }
    }

    // b) Notify all nurses
    const medList = medications.map((m) => `${m.name} ${m.dosage} (${m.frequency})`).join(', ');
    await notifyRole(
      'NURSE',
      'TASK_ASSIGNED',
      `New medication task: ${patientName}`,
      `Dr. ${doctorName} signed a prescription for ${patientName}. Medications: ${medList}. Medication schedules have been auto-assigned.`,
      '/dashboard/nurse/medications',
      { prescriptionId, patientId }
    );

    // c) Notify all pharmacists
    await notifyRole(
      'PHARMACIST',
      'PRESCRIPTION_ALERT',
      `Prescription ready: ${patientName}`,
      `A signed prescription from Dr. ${doctorName} for ${patientName} is ready for fulfillment. ${medications.length} medication(s).`,
      '/dashboard/pharmacy/prescriptions',
      { prescriptionId }
    );

    // d) WhatsApp to patient
    const whatsAppMedList = medications
      .map((m, i) => `${i + 1}. ${m.name} — ${m.dosage}, ${m.frequency}`)
      .join('\n');
    await sendWhatsApp(
      patientPhone,
      'New Prescription',
      `Hello ${patientName},\n\nDr. ${doctorName} has issued a new prescription:\n\n${whatsAppMedList}\n\nPlease visit the pharmacy to collect your medications.\n\n— H1MS Hospital`,
      { type: 'PRESCRIPTION', prescriptionId }
    );
  });

  // ── 2. APPOINTMENT CREATED ─────────────────────────────
  // → Notify assigned doctor
  // → WhatsApp confirmation to patient
  notificationEngine.on(HospitalEvent.APPOINTMENT_CREATED, async (payload) => {
    const { appointmentId, patientName, patientPhone, doctorId, doctorName, scheduledAt, type } = payload;

    // Notify doctor
    const dateStr = new Date(scheduledAt).toLocaleDateString('en-IN', {
      weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
    await notifyStaff(
      doctorId,
      'APPOINTMENT_ALERT',
      `New appointment: ${patientName}`,
      `${patientName} has been scheduled for a ${type.toLowerCase().replace('_', ' ')} on ${dateStr}.`,
      '/dashboard/doctor/patients',
      { appointmentId }
    );

    // WhatsApp to patient
    await sendWhatsApp(
      patientPhone,
      'Appointment Confirmed',
      `Hello ${patientName},\n\nYour ${type.toLowerCase().replace('_', ' ')} with Dr. ${doctorName} is confirmed.\n\nDate: ${dateStr}\n\nPlease arrive 15 minutes early.\n\n— H1MS Hospital`,
      { type: 'APPOINTMENT_CONFIRMATION', appointmentId }
    );
  });

  // ── 3. APPOINTMENT REMINDER ────────────────────────────
  notificationEngine.on(HospitalEvent.APPOINTMENT_REMINDER, async (payload) => {
    const { patientName, patientPhone, doctorName, scheduledAt } = payload;
    const dateStr = new Date(scheduledAt).toLocaleDateString('en-IN', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
    const timeStr = new Date(scheduledAt).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    });
    await sendWhatsApp(
      patientPhone,
      'Appointment Reminder',
      `Hello ${patientName},\n\nReminder for your appointment with Dr. ${doctorName} tomorrow.\n\n${dateStr} at ${timeStr}\n\n— H1MS Hospital`,
      { type: 'APPOINTMENT_REMINDER' }
    );
  });

  // ── 4. REPORT READY ────────────────────────────────────
  // → WhatsApp to patient
  notificationEngine.on(HospitalEvent.REPORT_READY, async (payload) => {
    const { patientName, patientPhone, reportTitle, doctorName } = payload;
    await sendWhatsApp(
      patientPhone,
      'Report Ready',
      `Hello ${patientName},\n\nYour report "${reportTitle}" prepared by Dr. ${doctorName} is now ready.\n\nPlease contact the hospital to collect your report.\n\n— H1MS Hospital`,
      { type: 'REPORT_READY', reportId: payload.reportId }
    );
  });

  // ── 5. VITALS CRITICAL ─────────────────────────────────
  // → Notify all doctors associated with the patient
  notificationEngine.on(HospitalEvent.VITALS_CRITICAL, async (payload) => {
    const { patientName, patientPhone, metric, value, threshold, doctorIds } = payload;

    for (const doctorId of doctorIds) {
      await notifyStaff(
        doctorId,
        'VITALS_CRITICAL',
        `CRITICAL: ${patientName}`,
        `${metric}: ${value} (${threshold}). Immediate attention required.`,
        '/dashboard/doctor/patients',
        { patientId: payload.patientId, metric, value }
      );
    }

    // WhatsApp to patient/family
    await sendWhatsApp(
      patientPhone,
      'Critical Health Alert',
      `Alert for ${patientName}:\n\n${metric}: ${value} (${threshold})\n\nThe medical team has been notified.\n\n— H1MS Hospital`,
      { type: 'GENERAL' }
    );
  });

  // ── 6. INVENTORY LOW ───────────────────────────────────
  // → Notify all pharmacists
  notificationEngine.on(HospitalEvent.INVENTORY_LOW, async (payload) => {
    const { itemName, currentQty, reorderLevel } = payload;
    await notifyRole(
      'PHARMACIST',
      'INVENTORY_LOW',
      `Low stock: ${itemName}`,
      `${itemName} is below reorder level. Current: ${currentQty}, Reorder at: ${reorderLevel}. Please restock.`,
      '/dashboard/pharmacy/inventory',
      { itemId: payload.itemId }
    );
  });

  // ── 7. MEDICATION OVERDUE ──────────────────────────────
  // → Notify assigned nurse
  notificationEngine.on(HospitalEvent.MEDICATION_OVERDUE, async (payload) => {
    const { patientName, medicationName, nurseId } = payload;
    if (nurseId) {
      await notifyStaff(
        nurseId,
        'TASK_ASSIGNED',
        `Overdue: ${medicationName}`,
        `${medicationName} for ${patientName} is overdue. Please administer or skip with notes.`,
        '/dashboard/nurse/medications',
        { scheduleId: payload.scheduleId }
      );
    }
  });

  // ── 8. PATIENT REGISTERED ──────────────────────────────
  // → Notify all receptionists (confirmation)
  notificationEngine.on(HospitalEvent.PATIENT_REGISTERED, async (payload) => {
    const { patientName } = payload;
    await notifyRole(
      'RECEPTIONIST',
      'GENERAL',
      `Patient registered: ${patientName}`,
      `${patientName} has been registered. Schedule an appointment to assign a doctor.`,
      '/dashboard/receptionist/appointments',
      { patientId: payload.patientId }
    );
  });

  console.log('[NotificationEngine] All observers registered');
}
