/**
 * H1MS — Role-Based Access Control System
 * 
 * Uses TypeScript private fields (#) for sensitive data encapsulation
 * to prevent accidental logging or client-side leakage.
 */

import { auth } from '@/server/config/auth';
import { NextResponse } from 'next/server';
import type { Role } from '@prisma/client';

// ─── Permission Matrix ──────────────────────────────────
export type Resource =
  | 'patient_metadata'
  | 'patient_vitals'
  | 'diagnosis'
  | 'medication_list'
  | 'prescriptions'
  | 'appointments'
  | 'inventory'
  | 'billing'
  | 'audit_logs'
  | 'user_management'
  | 'reports'
  | 'services'
  | 'admissions'
  | 'medical_history'
  | 'certificates';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'sign';

const PERMISSION_MATRIX: Record<Role, Record<Resource, Action[]>> = {
  DOCTOR: {
    patient_metadata: ['read'],
    patient_vitals: ['read'],
    diagnosis: ['create', 'read', 'update'],
    medication_list: ['create', 'read'],
    prescriptions: ['create', 'read', 'sign'],
    appointments: ['read'],
    inventory: [],
    billing: [],
    audit_logs: [],
    user_management: [],
    reports: ['create', 'read', 'update', 'sign'],
    services: [],
    admissions: ['read', 'update'],
    medical_history: ['create', 'read', 'update'],
    certificates: ['create', 'read', 'sign'],
  },
  NURSE: {
    patient_metadata: ['read'],
    patient_vitals: ['create', 'read', 'update'],
    diagnosis: [],
    medication_list: ['read'],
    prescriptions: ['read'],
    appointments: ['read'],
    inventory: [],
    billing: [],
    audit_logs: [],
    user_management: [],
    reports: [],
    services: [],
    admissions: ['read'],
    medical_history: ['create', 'read'],
    certificates: [],
  },
  RECEPTIONIST: {
    patient_metadata: ['create', 'read', 'update'],
    patient_vitals: [],
    diagnosis: [],
    medication_list: [],
    prescriptions: [],
    appointments: ['create', 'read', 'update', 'delete'],
    inventory: [],
    billing: ['create', 'read', 'update'],
    audit_logs: [],
    user_management: [],
    reports: [],
    services: ['create', 'read', 'update'],
    admissions: ['create', 'read', 'update'],
    medical_history: [],
    certificates: [],
  },
  PHARMACIST: {
    patient_metadata: ['read'], // Name + phone only
    patient_vitals: [],
    diagnosis: [], // BLOCKED: Cannot access diagnosisString
    medication_list: ['read'],
    prescriptions: ['read', 'update'], // Fulfillment only
    appointments: [],
    inventory: ['create', 'read', 'update', 'delete'],
    billing: [],
    audit_logs: [],
    user_management: [],
    reports: [],
    services: [],
    admissions: [],
    medical_history: [],
    certificates: [],
  },
  ADMIN: {
    patient_metadata: ['create', 'read', 'update', 'delete'],
    patient_vitals: ['read'],
    diagnosis: ['read'],
    medication_list: ['read'],
    prescriptions: ['read'],
    appointments: ['create', 'read', 'update', 'delete'],
    inventory: ['create', 'read', 'update', 'delete'],
    billing: ['create', 'read', 'update', 'delete'],
    audit_logs: ['read'],
    user_management: ['create', 'read', 'update', 'delete'],
    reports: ['read'],
    services: ['create', 'read', 'update', 'delete'],
    admissions: ['create', 'read', 'update', 'delete'],
    medical_history: ['read'],
    certificates: ['read'],
  },
  ACCOUNTANT: {
    patient_metadata: ['read'],
    patient_vitals: [],
    diagnosis: [],
    medication_list: [],
    prescriptions: [],
    appointments: [],
    inventory: [],
    billing: ['create', 'read', 'update', 'delete'],
    audit_logs: [],
    user_management: [],
    reports: ['read'],
    services: ['create', 'read', 'update', 'delete'],
    admissions: ['read'],
    medical_history: [],
    certificates: [],
  },
};

// ─── Permission Check ────────────────────────────────────
export function hasPermission(
  role: Role,
  resource: Resource,
  action: Action
): boolean {
  const permissions = PERMISSION_MATRIX[role];
  if (!permissions) return false;
  return permissions[resource]?.includes(action) ?? false;
}

// ─── Secure Data Container ──────────────────────────────
/**
 * Uses TypeScript private fields (#) to encapsulate sensitive medical data.
 * The #diagnosisCode cannot be accessed externally, even through serialization
 * or accidental console.log calls.
 */
export class SecureDiagnosisRecord {
  readonly patientId: string;
  readonly doctorId: string;
  readonly createdAt: Date;
  #diagnosisCode: string;
  #diagnosisString: string;
  readonly notes: string;

  constructor(data: {
    patientId: string;
    doctorId: string;
    diagnosisCode: string;
    diagnosisString: string;
    notes: string;
    createdAt: Date;
  }) {
    this.patientId = data.patientId;
    this.doctorId = data.doctorId;
    this.#diagnosisCode = data.diagnosisCode;
    this.#diagnosisString = data.diagnosisString;
    this.notes = data.notes;
    this.createdAt = data.createdAt;
  }

  /**
   * Returns diagnosis data — only accessible to authorized roles.
   */
  getDiagnosis(role: Role): { code: string; description: string } | null {
    if (!hasPermission(role, 'diagnosis', 'read')) {
      return null;
    }
    return {
      code: this.#diagnosisCode,
      description: this.#diagnosisString,
    };
  }

  /**
   * Serializes for API response — diagnosis excluded by default.
   */
  toJSON() {
    return {
      patientId: this.patientId,
      doctorId: this.doctorId,
      notes: this.notes,
      createdAt: this.createdAt,
    };
  }
}

/**
 * Immutable signed report wrapper.
 * Once signed, no mutations are permitted.
 */
export class SignedReport {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  #content: string;
  #isSigned: boolean;
  #signedAt: Date | null;

  constructor(data: {
    id: string;
    type: string;
    title: string;
    content: string;
    isSigned: boolean;
    signedAt: Date | null;
  }) {
    this.id = data.id;
    this.type = data.type;
    this.title = data.title;
    this.#content = data.content;
    this.#isSigned = data.isSigned;
    this.#signedAt = data.signedAt;
  }

  get isSigned(): boolean {
    return this.#isSigned;
  }

  get signedAt(): Date | null {
    return this.#signedAt;
  }

  getContent(role: Role): string | null {
    if (!hasPermission(role, 'reports', 'read')) return null;
    return this.#content;
  }

  sign(): void {
    if (this.#isSigned) {
      throw new Error('Report is already signed and cannot be modified.');
    }
    this.#isSigned = true;
    this.#signedAt = new Date();
    Object.freeze(this);
  }
}

// ─── API Route Auth Wrapper ──────────────────────────────
export function withAuth(
  handler: (req: Request, context: { session: any; params?: any }) => Promise<Response>,
  allowedRoles: Role[]
) {
  return async (req: Request, routeContext?: { params?: any }) => {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(req, { session, params: routeContext?.params });
  };
}

// ─── Role Metadata ───────────────────────────────────────
export const ROLE_CONFIG: Record<Role, {
  label: string;
  color: string;
  iconKey: string;
  defaultRoute: string;
}> = {
  DOCTOR: {
    label: 'Doctor',
    color: 'primary',
    iconKey: 'stethoscope',
    defaultRoute: '/dashboard/doctor/patients',
  },
  NURSE: {
    label: 'Nurse',
    color: 'primary',
    iconKey: 'nurse',
    defaultRoute: '/dashboard/nurse/wards',
  },
  RECEPTIONIST: {
    label: 'Receptionist',
    color: 'neutral',
    iconKey: 'clipboard',
    defaultRoute: '/dashboard/receptionist/appointments',
  },
  PHARMACIST: {
    label: 'Pharmacist',
    color: 'neutral',
    iconKey: 'flask',
    defaultRoute: '/dashboard/pharmacy/inventory',
  },
  ADMIN: {
    label: 'Admin',
    color: 'primary',
    iconKey: 'shield',
    defaultRoute: '/dashboard/admin/users',
  },
  ACCOUNTANT: {
    label: 'Accountant',
    color: 'neutral',
    iconKey: 'dollarSign',
    defaultRoute: '/dashboard/accountant/billing',
  },
};

// ─── Navigation Items per Role ───────────────────────────
export const ROLE_NAV_ITEMS: Record<Role, { label: string; href: string; iconKey: string }[]> = {
  DOCTOR: [
    { label: 'Hospital Pulse', href: '/dashboard', iconKey: 'activity' },
    { label: 'My Patients', href: '/dashboard/doctor/patients', iconKey: 'users' },
    { label: 'Prescriptions', href: '/dashboard/doctor/prescriptions', iconKey: 'fileText' },
    { label: 'Reports', href: '/dashboard/doctor/reports', iconKey: 'fileText' },
    { label: 'Certificates', href: '/dashboard/doctor/certificates', iconKey: 'fileText' },
  ],
  NURSE: [
    { label: 'Hospital Pulse', href: '/dashboard', iconKey: 'activity' },
    { label: 'Ward Management', href: '/dashboard/nurse/wards', iconKey: 'bed' },
    { label: 'Medications', href: '/dashboard/nurse/medications', iconKey: 'pill' },
    { label: 'Vitals Monitoring', href: '/dashboard/nurse/monitoring', iconKey: 'heart' },
  ],
  RECEPTIONIST: [
    { label: 'Hospital Pulse', href: '/dashboard', iconKey: 'activity' },
    { label: 'Appointments', href: '/dashboard/receptionist/appointments', iconKey: 'calendar' },
    { label: 'Patient Registry', href: '/dashboard/receptionist/patients', iconKey: 'user' },
    { label: 'Billing', href: '/dashboard/receptionist/billing', iconKey: 'dollarSign' },
  ],
  PHARMACIST: [
    { label: 'Hospital Pulse', href: '/dashboard', iconKey: 'activity' },
    { label: 'Inventory', href: '/dashboard/pharmacy/inventory', iconKey: 'package' },
    { label: 'Prescriptions', href: '/dashboard/pharmacy/prescriptions', iconKey: 'fileText' },
  ],
  ADMIN: [
    { label: 'Hospital Pulse', href: '/dashboard', iconKey: 'activity' },
    { label: 'User Management', href: '/dashboard/admin/users', iconKey: 'users' },
    { label: 'System Telemetry', href: '/dashboard/admin/telemetry', iconKey: 'barChart' },
    { label: 'Audit Logs', href: '/dashboard/admin/audit', iconKey: 'list' },
  ],
  ACCOUNTANT: [
    { label: 'Hospital Pulse', href: '/dashboard', iconKey: 'activity' },
    { label: 'Service Catalog', href: '/dashboard/accountant/services', iconKey: 'list' },
    { label: 'Billing', href: '/dashboard/accountant/billing', iconKey: 'dollarSign' },
    { label: 'Financial Reports', href: '/dashboard/accountant/reports', iconKey: 'barChart' },
  ],
};
