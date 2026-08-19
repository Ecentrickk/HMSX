/**
 * H1MS — Zod Validation Schemas
 * 
 * Centralized input validation for all API routes.
 * Every request body is validated before touching the database.
 */

import { z } from 'zod';

// ─── Patient Schemas ─────────────────────────────────────
export const patientCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  phone: z.string().min(1, 'Phone is required').max(20),
  email: z.string().email().optional().nullable(),
  dateOfBirth: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  aadharNumber: z.string().optional().nullable(),
  insuranceId: z.string().optional().nullable(),
});

// ─── Admission Schemas ───────────────────────────────────
export const admissionCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  admissionType: z.enum(['OPD', 'IPD']),
  attendingDoctorId: z.string().min(1, 'Doctor ID is required'),
  department: z.string().optional().nullable(),
  wardId: z.string().optional().nullable(),
  bedId: z.string().optional().nullable(),
  referredFrom: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const admissionConvertSchema = z.object({
  admissionId: z.string().min(1, 'Admission ID is required'),
  wardId: z.string().optional().nullable(),
  bedId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const dischargeSchema = z.object({
  admissionId: z.string().min(1, 'Admission ID is required'),
  dischargeType: z.enum(['NORMAL', 'REFERRAL', 'LAMA', 'ABSCONDED', 'DECEASED']),
  dischargeSummary: z.string().optional().nullable(),
  referredTo: z.string().optional().nullable(),
});

// ─── Medical History Schemas ─────────────────────────────
export const medicalHistoryCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  category: z.enum([
    'PAST_ILLNESS', 'SURGICAL_HISTORY', 'FAMILY_HISTORY', 'ALLERGY',
    'CHRONIC_CONDITION', 'IMMUNIZATION', 'SUBSTANCE_USE',
    'OBSTETRIC_HISTORY', 'SOCIAL_HISTORY', 'MEDICATION_HISTORY',
  ]),
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().min(1, 'Description is required'),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  severity: z.string().optional().nullable(),
  isOngoing: z.boolean().optional().default(false),
  attachments: z.array(z.string()).optional().default([]),
  metadata: z.any().optional().nullable(),
});

// ─── Hospital Service Schemas ────────────────────────────
export const serviceCreateSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(200),
  code: z.string().min(1, 'Service code is required').max(50),
  category: z.enum([
    'CONSULTATION', 'PROCEDURE', 'LABORATORY', 'RADIOLOGY',
    'ROOM_CHARGE', 'NURSING_CHARGE', 'MEDICATION', 'SURGERY',
    'PHYSIOTHERAPY', 'AMBULANCE', 'MISCELLANEOUS',
  ]),
  unitPrice: z.number().min(0, 'Price must be non-negative'),
  unit: z.string().min(1).default('per unit'),
  description: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  taxRate: z.number().min(0).max(100).optional().default(0),
});

export const serviceUpdateSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  name: z.string().min(1).max(200).optional(),
  unitPrice: z.number().min(0).optional(),
  unit: z.string().optional(),
  description: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  taxRate: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

// ─── Billing Schemas ─────────────────────────────────────
export const billingCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  admissionId: z.string().optional().nullable(),
  appointmentId: z.string().optional().nullable(),
  lineItems: z.array(z.object({
    serviceId: z.string().min(1, 'Service ID is required'),
    quantity: z.number().min(0.01, 'Quantity must be positive'),
    discount: z.number().min(0).optional().default(0),
    notes: z.string().optional().nullable(),
    unitPrice: z.number().optional(),
    unit: z.string().optional(),
  })).min(1, 'At least one line item is required'),
  discount: z.number().min(0).optional().default(0),
  paymentMethod: z.string().optional().nullable(),
});

export const billingPaymentSchema = z.object({
  billingId: z.string().min(1, 'Billing ID is required'),
  amount: z.number().min(0.01, 'Amount must be positive'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
});

export const billingStatusSchema = z.object({
  billingId: z.string().min(1, 'Billing ID is required'),
  status: z.enum(['PENDING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED']),
});

// ─── Certificate Schemas ─────────────────────────────────
export const certificateCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  type: z.enum(['BIRTH', 'DEATH', 'MEDICAL_FITNESS', 'DISABILITY', 'MEDICAL_LEAVE']),
  // Birth certificate fields
  newbornName: z.string().optional().nullable(),
  newbornGender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  birthWeight: z.number().optional().nullable(),
  birthTime: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  fatherName: z.string().optional().nullable(),
  placeOfBirth: z.string().optional().nullable(),
  // Death certificate fields
  dateOfDeath: z.string().optional().nullable(),
  timeOfDeath: z.string().optional().nullable(),
  causeOfDeath: z.string().optional().nullable(),
  mannerOfDeath: z.string().optional().nullable(),
  attendingPhysician: z.string().optional().nullable(),
  metadata: z.any().optional().nullable(),
});

// ─── Vitals Schema ───────────────────────────────────────
export const vitalsCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  bloodPressureSystolic: z.number().int().min(0).max(400).optional().nullable(),
  bloodPressureDiastolic: z.number().int().min(0).max(300).optional().nullable(),
  heartRate: z.number().int().min(0).max(400).optional().nullable(),
  temperature: z.number().min(80).max(115).optional().nullable(),
  oxygenSat: z.number().min(0).max(100).optional().nullable(),
  weight: z.number().min(0).max(1000).optional().nullable(),
  height: z.number().min(0).max(300).optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ─── Appointment Schema ──────────────────────────────────
export const appointmentCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  scheduledAt: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  endAt: z.string().optional().nullable(),
  type: z.enum(['CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'ROUTINE_CHECKUP', 'PROCEDURE']).optional().default('CONSULTATION'),
  notes: z.string().optional().nullable(),
});

// ─── Referral Schema ─────────────────────────────────────
export const referralCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  referredToId: z.string().optional().nullable(),
  referralType: z.enum(['INTERNAL', 'EXTERNAL']),
  department: z.string().optional().nullable(),
  externalHospital: z.string().optional().nullable(),
  reason: z.string().min(1, 'Reason is required'),
  urgency: z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']),
  notes: z.string().optional().nullable(),
});

// ─── Helper: Parse and validate ──────────────────────────
export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: errors };
  }
  return { success: true, data: result.data };
}
