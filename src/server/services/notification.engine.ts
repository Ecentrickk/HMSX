/**
 * H1MS — Notification Engine (Observer Pattern)
 * 
 * Implements the Observer/Pub-Sub pattern for event-driven notifications.
 * When clinical actions occur (e.g., Doctor signs a prescription), observers
 * are automatically notified and can trigger downstream effects like
 * WhatsApp messages, staff notifications, PDF generation, or audit logging.
 */

// ─── Event Types ─────────────────────────────────────────
export enum HospitalEvent {
  PRESCRIPTION_CREATED = 'PRESCRIPTION_CREATED',
  PRESCRIPTION_SIGNED = 'PRESCRIPTION_SIGNED',
  REPORT_READY = 'REPORT_READY',
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  APPOINTMENT_UPDATED = 'APPOINTMENT_UPDATED',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  VITALS_RECORDED = 'VITALS_RECORDED',
  VITALS_CRITICAL = 'VITALS_CRITICAL',
  INVENTORY_LOW = 'INVENTORY_LOW',
  MEDICATION_OVERDUE = 'MEDICATION_OVERDUE',
  PATIENT_REGISTERED = 'PATIENT_REGISTERED',
  PATIENT_ADMITTED = 'PATIENT_ADMITTED',
  PATIENT_DISCHARGED = 'PATIENT_DISCHARGED',
  BILLING_CREATED = 'BILLING_CREATED',
}

// ─── Event Payload Types ─────────────────────────────────
export interface EventPayload {
  [HospitalEvent.PRESCRIPTION_CREATED]: {
    prescriptionId: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    medications: { name: string; dosage: string; frequency: string; duration: string }[];
  };
  [HospitalEvent.PRESCRIPTION_SIGNED]: {
    prescriptionId: string;
    patientId: string;
    patientName: string;
    patientPhone: string;
    doctorId: string;
    doctorName: string;
    medications: { name: string; dosage: string; frequency: string; duration: string }[];
  };
  [HospitalEvent.REPORT_READY]: {
    reportId: string;
    patientName: string;
    patientPhone: string;
    reportType: string;
    reportTitle: string;
    doctorName: string;
  };
  [HospitalEvent.APPOINTMENT_CREATED]: {
    appointmentId: string;
    patientName: string;
    patientPhone: string;
    doctorId: string;
    doctorName: string;
    scheduledAt: Date;
    type: string;
  };
  [HospitalEvent.APPOINTMENT_UPDATED]: {
    appointmentId: string;
    patientName: string;
    patientPhone: string;
    doctorName: string;
    scheduledAt: Date;
    status: string;
  };
  [HospitalEvent.APPOINTMENT_REMINDER]: {
    appointmentId: string;
    patientName: string;
    patientPhone: string;
    doctorName: string;
    scheduledAt: Date;
  };
  [HospitalEvent.VITALS_RECORDED]: {
    patientId: string;
    patientName: string;
    recordedBy: string;
  };
  [HospitalEvent.VITALS_CRITICAL]: {
    patientId: string;
    patientName: string;
    patientPhone: string;
    metric: string;
    value: number;
    threshold: string;
    doctorIds: string[];
  };
  [HospitalEvent.INVENTORY_LOW]: {
    itemId: string;
    itemName: string;
    currentQty: number;
    reorderLevel: number;
  };
  [HospitalEvent.MEDICATION_OVERDUE]: {
    scheduleId: string;
    patientName: string;
    medicationName: string;
    scheduledTime: Date;
    nurseId?: string;
  };
  [HospitalEvent.PATIENT_REGISTERED]: {
    patientId: string;
    patientName: string;
    patientPhone: string;
    registeredById: string;
  };
  [HospitalEvent.PATIENT_ADMITTED]: {
    patientId: string;
    patientName: string;
    patientPhone: string;
    wardName: string;
    bedNumber: string;
  };
  [HospitalEvent.PATIENT_DISCHARGED]: {
    patientId: string;
    patientName: string;
    patientPhone: string;
  };
  [HospitalEvent.BILLING_CREATED]: {
    billingId: string;
    patientName: string;
    totalAmount: number;
    generatedById: string;
  };
}

// ─── Observer Interface ──────────────────────────────────
export type EventHandler<T extends HospitalEvent> = (
  payload: EventPayload[T]
) => Promise<void> | void;

// ─── Event Bus (Singleton) ───────────────────────────────
class NotificationEngine {
  private static instance: NotificationEngine;
  private handlers: Map<HospitalEvent, Set<EventHandler<any>>>;
  private eventLog: Array<{ event: HospitalEvent; payload: any; timestamp: Date }>;

  private constructor() {
    this.handlers = new Map();
    this.eventLog = [];
  }

  static getInstance(): NotificationEngine {
    if (!NotificationEngine.instance) {
      NotificationEngine.instance = new NotificationEngine();
    }
    return NotificationEngine.instance;
  }

  /**
   * Subscribe to an event (Observer registration)
   */
  on<T extends HospitalEvent>(event: T, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  /**
   * Emit an event (Notify all observers)
   */
  async emit<T extends HospitalEvent>(event: T, payload: EventPayload[T]): Promise<void> {
    // Log the event
    this.eventLog.push({ event, payload, timestamp: new Date() });

    console.log(`[NotificationEngine] Event: ${event}`, {
      timestamp: new Date().toISOString(),
      payload: JSON.stringify(payload).slice(0, 200),
    });

    const handlers = this.handlers.get(event);
    if (!handlers || handlers.size === 0) {
      console.log(`[NotificationEngine] No handlers registered for ${event}`);
      return;
    }

    // Execute all handlers concurrently
    const results = await Promise.allSettled(
      Array.from(handlers).map((handler) => handler(payload))
    );

    // Log failures
    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        console.error(
          `[NotificationEngine] Handler ${idx} failed for ${event}:`,
          result.reason
        );
      }
    });
  }

  /**
   * Get recent event log (for telemetry/admin dashboard)
   */
  getEventLog(limit = 50): Array<{ event: HospitalEvent; payload: any; timestamp: Date }> {
    return this.eventLog.slice(-limit);
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clearAll(): void {
    this.handlers.clear();
    this.eventLog = [];
  }
}

// Export singleton
export const notificationEngine = NotificationEngine.getInstance();
