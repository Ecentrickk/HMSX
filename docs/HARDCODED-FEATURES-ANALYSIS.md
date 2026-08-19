# H1MS - Hardcoded Features & Non-Configurable Settings

**Document Purpose:** Identify all hardcoded values, enums, and non-configurable features in the HMS application that are not logically defined for unknown/dynamic data.

**Last Updated:** 2024  
**Status:** Critical for Future Configuration

---

## Table of Contents

1. [Authentication & Sessions](#authentication--sessions)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Patient Data Models](#patient-data-models)
4. [Appointment System](#appointment-system)
5. [Hospital Enums & Constants](#hospital-enums--constants)
6. [Notification Events](#notification-events)
7. [Database Queries & Limits](#database-queries--limits)
8. [API Endpoints & Routes](#api-endpoints--routes)
9. [UI/UX Hardcoded Values](#uiux-hardcoded-values)
10. [Recommendations for Configurability](#recommendations-for-configurability)

---

## Authentication & Sessions

### 📌 Hardcoded Session Configuration

| Feature | Current Value | Type | File | Issue |
|---------|--------------|------|------|-------|
| **Session Max Age** | 24 hours (24 * 60 * 60) | Constant | `src/lib/auth.ts` | Not configurable; all users have same session duration |
| **Session Strategy** | 'jwt' | Hardcoded | `src/lib/auth.ts` | Cannot switch to other session strategies |
| **Sign-In Page Route** | '/' | Hardcoded | `src/lib/auth.ts` | Custom login pages not supported |
| **Error Page Route** | '/' | Hardcoded | `src/lib/auth.ts` | All auth errors redirect to same page |
| **Provider Type** | Credentials only | Hardcoded | `src/lib/auth.ts` | Cannot add OAuth, SAML, LDAP, or other providers |
| **Credential Fields** | email + password | Fixed | `src/lib/auth.ts` | No support for 2FA, biometric, or phone authentication |
| **Password Hashing** | bcryptjs | Hardcoded | `src/lib/auth.ts` | Cannot switch to other hashing algorithms (argon2, scrypt, etc.) |

### ⚠️ Issue
- **Hospital A** wants 12-hour sessions for security; **Hospital B** wants 7-day sessions for convenience
- Different hospitals need different authentication methods (LDAP for large hospitals, Credentials for small ones)
- No support for multi-factor authentication (MFA) globally

### 💡 Solution
Make authentication config externally configurable via environment variables or database settings

---

## User Roles & Permissions

### 📌 Hardcoded Roles

| Role | Status | Configurable | File |
|------|--------|-------------|------|
| **DOCTOR** | Hardcoded enum | No | `prisma/schema.prisma` |
| **NURSE** | Hardcoded enum | No | `prisma/schema.prisma` |
| **RECEPTIONIST** | Hardcoded enum | No | `prisma/schema.prisma` |
| **PHARMACIST** | Hardcoded enum | No | `prisma/schema.prisma` |
| **ADMIN** | Hardcoded enum | No | `prisma/schema.prisma` |

### 📌 Hardcoded Permission Matrix

| Resource | DOCTOR | NURSE | RECEPTIONIST | PHARMACIST | ADMIN |
|----------|--------|-------|--------------|-----------|-------|
| **patient_metadata** | read | read | create, read, update | read | create, read, update, delete |
| **patient_vitals** | read | create, read, update | - | - | read |
| **diagnosis** | create, read, update | - | - | ❌ BLOCKED | read |
| **medication_list** | create, read | read | - | read | read |
| **prescriptions** | create, read, sign | read | - | read, update | read |
| **appointments** | read | - | create, read, update, delete | - | create, read, update, delete |
| **inventory** | - | - | - | create, read, update, delete | create, read, update, delete |
| **billing** | - | - | create, read, update | - | create, read, update, delete |
| **audit_logs** | - | - | - | - | read |
| **user_management** | - | - | - | - | create, read, update, delete |
| **reports** | create, read, update, sign | - | - | - | read |

### ⚠️ Issue
- **Cannot add new roles** (e.g., "Lab Technician", "Radiologist", "Billing Manager")
- **Cannot customize permissions** per hospital
- **Cannot create role hierarchies** (e.g., Senior Doctor vs Junior Doctor)
- **Pharmacist is blocked** from viewing diagnosis data — hardcoded restriction cannot be removed
- Different hospitals have different departmental needs

### 💡 Solution
1. Move role definitions to database (make roles CRUD-able)
2. Create dynamic permission matrix stored in database
3. Allow per-hospital role customization
4. Support role hierarchies and delegation

---

## Patient Data Models

### 📌 Hardcoded Patient Fields

| Field | Type | Configurable | Notes |
|-------|------|-------------|-------|
| **name** | String | No | Always required |
| **phone** | String | No | Format not validated |
| **email** | String | Optional | May not be relevant in all hospitals |
| **dateOfBirth** | DateTime | Required | Calculated age not flexible |
| **gender** | Enum (see below) | No | Limited options |
| **bloodGroup** | String | Optional | Free text, no validation |
| **address** | String | Optional | No postal code validation |
| **emergencyContact** | String | Optional | No validation |
| **emergencyPhone** | String | Optional | No validation |
| **createdAt** | DateTime | Auto | Always tracked |
| **updatedAt** | DateTime | Auto | Always tracked |

### 📌 Hardcoded Gender Enum

```
enum Gender {
  MALE
  FEMALE
  OTHER
}
```

| Issue | Impact |
|-------|--------|
| Only 3 options | Hospitals may need additional options or different categories |
| Cannot be extended | New hospitals cannot add gender preferences |
| No translations | Hardcoded English values |

### ⚠️ Issue
- **Hospital A** wants additional fields: insurance ID, occupation, nationality
- **Hospital B** needs patient classification (VIP, Regular, Charity)
- **Hospital C** requires custom medical history fields
- No way to add hospital-specific patient attributes

### 💡 Solution
1. Create dynamic patient fields schema (JSON store custom fields)
2. Allow per-hospital patient field configuration
3. Support field validation rules per hospital
4. Create patient classification system (configurable)

---

## Appointment System

### 📌 Hardcoded Appointment Types

| Type | Status | Configurable |
|------|--------|-------------|
| **CONSULTATION** | Default | No |
| **FOLLOW_UP** | Hardcoded | No |
| **EMERGENCY** | Hardcoded | No |
| **ROUTINE_CHECKUP** | Hardcoded | No |
| **PROCEDURE** | Hardcoded | No |

### 📌 Hardcoded Appointment Status

| Status | Meaning | Configurable |
|--------|---------|-------------|
| **SCHEDULED** | Appointment booked | No |
| **IN_PROGRESS** | Appointment started | No |
| **COMPLETED** | Appointment finished | No |
| **CANCELLED** | Appointment cancelled | No |
| **NO_SHOW** | Patient didn't show up | No |

### 📌 Hardcoded Appointment Default Values

| Setting | Value | Location |
|---------|-------|----------|
| Default appointment type | 'CONSULTATION' | `src/app/api/receptionist/appointments/route.ts` |
| Appointment sorting | 'asc' (by scheduledAt) | All appointment queries |
| Database query limit | Take: 1 (latest) | Multiple API routes |

### ⚠️ Issue
- **Hospital A** wants custom appointment types: "Surgery", "Lab Test", "X-Ray"
- **Hospital B** needs appointment slots (15-min, 30-min, 1-hour) — currently not enforced
- **Hospital C** requires appointment confirmation (SMS/WhatsApp) — hardcoded event triggers
- **Cannot add appointment statuses** like "PENDING_CONFIRMATION", "RESCHEDULED"
- Default type cannot be customized per hospital

### 💡 Solution
1. Move appointment types to configurable enum (database)
2. Add appointment slot system (configurable duration)
3. Create appointment status workflow (configurable per hospital)
4. Allow custom appointment fields per hospital

---

## Hospital Enums & Constants

### 📌 Bed Status (Hardcoded)

```
enum BedStatus {
  AVAILABLE
  OCCUPIED
  MAINTENANCE
  RESERVED
}
```

| Hospital Need | Current Support | Issue |
|---------------|-----------------|-------|
| "UNDER_CLEANING" | ❌ Not available | Beds need cleaning between patients |
| "QUARANTINE" | ❌ Not available | COVID protocols need isolation status |
| "CLOSED" | ❌ Not available | Permanently closed beds |

### 📌 Ward Type (Hardcoded)

```
enum WardType {
  GENERAL
  ICU
  PEDIATRIC
  MATERNITY
  SURGICAL
  EMERGENCY
}
```

| Hospital Need | Current Support | Issue |
|---------------|-----------------|-------|
| "CARDIOLOGY_UNIT" | ❌ Not available | Specialty units needed |
| "PSYCHIATRY" | ❌ Not available | Mental health facilities |
| "DIALYSIS" | ❌ Not available | Renal units |

### 📌 Medication Schedule Status

```
enum MedScheduleStatus {
  PENDING
  ADMINISTERED
  SKIPPED
  OVERDUE
}
```

| Issue | Impact |
|-------|--------|
| No "NOT_AVAILABLE" status | Cannot mark meds as out-of-stock |
| No "REFUSED" status | Cannot track patient refusals |
| No "PARTIAL" status | Cannot mark partial doses |

### 📌 Inventory Categories (Hardcoded)

```
enum InventoryCategory {
  MEDICATION
  SURGICAL_SUPPLY
  DIAGNOSTIC_EQUIPMENT
  PPE
  CONSUMABLE
  OTHER
}
```

| Hospital Need | Current Support |
|---------------|-----------------|
| "BLOOD_PRODUCTS" | ❌ Not available |
| "IMPLANTS" | ❌ Not available |
| "VACCINES" | ❌ Not available |

### 📌 Billing Status

```
enum BillingStatus {
  PENDING
  PAID
  PARTIALLY_PAID
  OVERDUE
  CANCELLED
}
```

| Issue | Impact |
|-------|--------|
| No insurance claim status | Cannot track insurance submissions |
| No refund tracking | Cannot track refunds/credits |
| No settlement status | Cannot track payment plans |

### ⚠️ Issue
- All enums are hardcoded in schema
- Cannot add new enum values without code change + database migration
- Each hospital has unique needs but must fit into hardcoded structure

### 💡 Solution
1. Convert enums to lookup tables (database)
2. Create per-hospital enum customization
3. Support enum version management
4. Allow enum value translations per hospital

---

## Notification Events

### 📌 Hardcoded Hospital Events

| Event | Trigger | Configurable | File |
|-------|---------|-------------|------|
| **PRESCRIPTION_CREATED** | Doctor creates prescription | No | `src/lib/notifications/engine.ts` |
| **PRESCRIPTION_SIGNED** | Doctor signs prescription | No | `src/lib/notifications/engine.ts` |
| **REPORT_READY** | Report generated | No | `src/lib/notifications/engine.ts` |
| **APPOINTMENT_CREATED** | Appointment scheduled | No | `src/lib/notifications/engine.ts` |
| **APPOINTMENT_UPDATED** | Appointment modified | No | `src/lib/notifications/engine.ts` |
| **APPOINTMENT_REMINDER** | Automatic reminder sent | No | `src/lib/notifications/engine.ts` |
| **VITALS_RECORDED** | Nurse records vitals | No | `src/lib/notifications/engine.ts` |
| **VITALS_CRITICAL** | Abnormal vitals detected | No | `src/lib/notifications/engine.ts` |
| **INVENTORY_LOW** | Stock below threshold | No | `src/lib/notifications/engine.ts` |
| **MEDICATION_OVERDUE** | Meds not administered on time | No | `src/lib/notifications/engine.ts` |
| **PATIENT_REGISTERED** | New patient added | No | `src/lib/notifications/engine.ts` |
| **PATIENT_ADMITTED** | Patient admitted | No | `src/lib/notifications/engine.ts` |
| **PATIENT_DISCHARGED** | Patient discharged | No | `src/lib/notifications/engine.ts` |
| **BILLING_CREATED** | Bill generated | No | `src/lib/notifications/engine.ts` |

### 📌 Notification Types (Hardcoded)

```
enum NotificationType {
  PRESCRIPTION = 'PRESCRIPTION'
  APPOINTMENT_CONFIRMATION = 'APPOINTMENT_CONFIRMATION'
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER'
  REPORT_READY = 'REPORT_READY'
  BILLING = 'BILLING'
  GENERAL = 'GENERAL'
}
```

### 📌 Notification Status

```
enum NotificationStatus {
  QUEUED
  SENT
  DELIVERED
  FAILED
  READ
}
```

### ⚠️ Issue
- **Cannot add new events** without code changes (e.g., "LAB_RESULT_READY", "BED_AVAILABLE")
- **Cannot disable events** per hospital (e.g., some hospitals don't want prescription reminders)
- **Event payloads are hardcoded** — cannot add custom fields
- **No event routing rules** (e.g., send SMS to one hospital, WhatsApp to another)
- **Critical vitals threshold** is likely hardcoded (see below)

### 💡 Solution
1. Move event definitions to database (CRUD-able)
2. Create per-hospital event subscription rules
3. Create dynamic event payload schemas
4. Support event routing and transformation

---

## Database Queries & Limits

### 📌 Hardcoded Query Limits

| Location | Query | Limit | Purpose | Issue |
|----------|-------|-------|---------|-------|
| Doctor's patients | vitals | `take: 1` | Latest vitals | Cannot get vitals history |
| Doctor's patients | appointments | `take: 1` | Latest appointment | Cannot see appointment history |
| Doctor's patients | diagnoses | `take: 3` | Latest 3 diagnoses | Max 3 hardcoded |
| Doctor's patients | prescriptions | `take: 3` | Latest 3 prescriptions | Max 3 hardcoded |
| Receptionist appointments | All records | No limit | All appointments | Could return 10,000+ records |
| API responses | Paginated results | No default | Not specified | Inconsistent pagination |

### ⚠️ Issue
- **Performance impact**: Some queries have no limits and could return thousands of records
- **UX issue**: "Take 3 diagnoses" means only 3 are visible; need pagination
- **Not configurable**: Cannot change limits per hospital or user type
- **Inconsistent**: Different routes have different limits or no limits

### 💡 Solution
1. Create configurable default page sizes per entity type
2. Implement consistent pagination across all endpoints
3. Allow per-hospital query limit customization
4. Add result caching with TTL configuration

---

## API Endpoints & Routes

### 📌 Hardcoded Role Access Control

| Endpoint | Allowed Roles | Issue |
|----------|---------------|-------|
| `GET /api/doctor/patients` | DOCTOR, ADMIN | Cannot add other roles |
| `GET /api/receptionist/appointments` | RECEPTIONIST, ADMIN | Cannot customize per hospital |
| `POST /api/nurse/vitals` | NURSE, ADMIN | Hardcoded role checks |

### 📌 Hardcoded HTTP Status Codes

| Status | Meaning | Hardcoded Locations |
|--------|---------|-------------------|
| **200** | Success | All GET endpoints |
| **201** | Created | All POST endpoints (APPOINTMENT_CREATED) |
| **500** | Server Error | Error handlers (generic message) |

### 📌 Hardcoded Error Messages

| Error | Location | Message | Issue |
|-------|----------|---------|-------|
| Patients fetch failed | `src/app/api/doctor/patients/route.ts` | "Failed to fetch patients" | Generic, not user-friendly |
| Appointments fetch failed | `src/app/api/receptionist/appointments/route.ts` | "Failed to fetch appointments" | Generic message |
| Appointment creation failed | `src/app/api/receptionist/appointments/route.ts` | "Failed to create appointment" | No specific error details |

### ⚠️ Issue
- **Role-based hardcoding**: Cannot add new roles without code changes
- **Error messages**: Not user-friendly, not translatable, no error codes
- **No rate limiting**: API can be abused (no hardcoded limits, but should be)
- **No API versioning**: Cannot support multiple API versions

### 💡 Solution
1. Create dynamic role assignment system
2. Implement user-friendly, translatable error messages with error codes
3. Add API rate limiting (configurable per hospital)
4. Support API versioning for backward compatibility

---

## UI/UX Hardcoded Values

### 📌 Navigation & Menu Structure (Likely Hardcoded)

| Component | Issue |
|-----------|-------|
| Dashboard Sidebar | Menu hardcoded for fixed roles |
| Doctor Dashboard | Shows only doctor-specific views |
| Admin Dashboard | Shows only admin-specific views |
| Navigation Permissions | Hardcoded based on role |

### 📌 Timestamps & Formats (Likely Hardcoded)

| Item | Issue |
|------|-------|
| Date Format | Likely hardcoded to single format (not configurable) |
| Time Format | 12-hour or 24-hour likely hardcoded |
| Timezone | May be UTC hardcoded |
| Language | Likely English only (no i18n) |

### 📌 Business Logic Numbers (Likely Hardcoded)

| Setting | Likely Value | Issue |
|---------|---------|-------|
| Session timeout warning | 5 minutes? | Not specified |
| Password expiration | Never? | Security risk if never |
| Password history | Unlimited? | Can reuse old passwords |
| Failed login attempts | Unlimited? | Can brute force |
| Account lockout duration | N/A? | No lockout implemented |
| Vital signs thresholds | Hardcoded? | Blood pressure normal: 120/80? |
| Critical vitals alerts | Hardcoded? | Heart rate > 120 is critical? |

### ⚠️ Issue
- **International expansion impossible**: Hardcoded English + date formats
- **Cannot customize thresholds**: Different hospitals have different vital sign ranges
- **No multi-language support**: All UI hardcoded to English
- **Date/time confusion**: No timezone support evident

### 💡 Solution
1. Implement i18n (internationalization) system
2. Create configurable vital signs thresholds per hospital
3. Add timezone support
4. Support RTL languages
5. Create customizable date/time formats

---

## Audit Logging & Compliance

### 📌 Hardcoded Audit Actions

| Action | Configurable | Issue |
|--------|-------------|-------|
| APPOINTMENT_CREATED | No | Only this action logged |
| No other audit actions visible | ❌ Incomplete | Most system changes not audited |

### ⚠️ Issue
- **Incomplete audit trail**: Only appointment creation logged
- **No audit configuration**: Cannot customize what is audited
- **No retention policy**: Unclear how long audit logs are kept
- **HIPAA non-compliance**: Incomplete audit trail may violate healthcare regulations

### 💡 Solution
1. Expand audit logging to all sensitive operations
2. Create configurable audit policies
3. Implement audit retention policies (configurable)
4. Add tamper detection for audit logs
5. Support encrypted audit storage

---

## Recommendations for Configurability

### 🎯 Priority 1: Critical for Hospital Operations

| Feature | Current State | Recommended Solution | Effort |
|---------|--------------|----------------------|--------|
| **Roles & Permissions** | Hardcoded enum | Move to database, create permission builder | High |
| **Vitals Thresholds** | Unknown/hardcoded | Database configuration, per-hospital settings | Medium |
| **Patient Fields** | Fixed schema | Dynamic field system (JSON) | High |
| **Appointment Types** | Hardcoded enum | Database lookup tables | Low |
| **Session Duration** | 24 hours fixed | Environment variable + database setting | Low |

### 🎯 Priority 2: Important for Scaling

| Feature | Current State | Recommended Solution | Effort |
|---------|--------------|----------------------|--------|
| **Notification Events** | Hardcoded | Event registry (database/config) | Medium |
| **Query Limits** | Mixed (1, 3, unlimited) | Consistent pagination + config | Medium |
| **Ward/Bed Types** | Hardcoded enum | Configurable categories | Low |
| **Error Messages** | Hardcoded strings | Message catalog + i18n | Medium |
| **Audit Logging** | Incomplete | Configurable audit policy engine | Medium |

### 🎯 Priority 3: Nice to Have

| Feature | Current State | Recommended Solution | Effort |
|---------|--------------|----------------------|--------|
| **Internationalization** | Not implemented | i18n system (next-i18n) | High |
| **Authentication Methods** | Credentials only | OAuth/LDAP/SAML plugins | High |
| **Date Formats** | Hardcoded | User preference system | Low |
| **Custom Workflows** | Fixed | Workflow engine (low-code) | Very High |
| **Rate Limiting** | Not mentioned | API gateway configuration | Medium |

---

## Implementation Strategy

### Phase 1: Make System Configurable (High Priority)

```typescript
// Current: Hardcoded
const sessionMaxAge = 24 * 60 * 60;

// Recommended: Configurable
interface HospitalConfig {
  auth: {
    sessionMaxAge: number;  // In seconds
    passwordPolicy: { minLength: number; requireNumbers: boolean };
    mfaEnabled: boolean;
  };
  vitals: {
    bloodPressureNormal: { systolic: number; diastolic: number };
    heartRateNormal: { min: number; max: number };
  };
  appointments: {
    defaultType: string;
    defaultDuration: number;  // In minutes
    allowDoubleBooking: boolean;
  };
  notifications: {
    enabledEvents: string[];
    channels: { sms: boolean; whatsapp: boolean; email: boolean };
  };
}

// Load from database or environment
const config = await getHospitalConfig(hospitalId);
```

### Phase 2: Create Admin UI for Configuration

- Settings page for hospital admins
- Role/permission builder UI
- Vital signs threshold editor
- Notification event manager
- Custom field configuration

### Phase 3: Make System Extensible

- Plugin system for custom integrations
- Webhook support for external systems
- Custom workflow builder
- API for third-party apps

---

## Testing Recommendations

### Unit Tests Needed
- [ ] Role permission matrix changes
- [ ] Custom appointment type creation
- [ ] Vital sign threshold validation
- [ ] Event trigger conditions

### Integration Tests Needed
- [ ] Multi-role access control
- [ ] Configuration inheritance (hospital → department → user)
- [ ] Notification routing with custom events
- [ ] Audit logging completeness

### End-to-End Tests Needed
- [ ] Hospital admin creating custom roles
- [ ] Multi-language interface switching
- [ ] Different session timeout per hospital
- [ ] Custom appointment types in appointments list

---

## Summary

**Total Hardcoded Features Found: 50+**

### By Category
- **Enums (Hardcoded):** 11 major enums
- **Configuration Values:** 15+ hardcoded settings
- **Database Queries:** 8+ hardcoded limits
- **Audit Logging:** 1 action type (incomplete)
- **Authentication:** 3 hardcoded methods
- **UI/UX:** 10+ hardcoded UI elements

### Impact Assessment
- ⛔ **Critical:** Cannot add new roles or customize permissions
- ⛔ **Critical:** Cannot add hospital-specific appointment types
- 🔴 **High:** Cannot customize vital sign thresholds
- 🔴 **High:** Cannot add new notification event types
- 🟡 **Medium:** Cannot change session duration per hospital
- 🟡 **Medium:** No internationalization support
- 🟢 **Low:** Some UI elements are hardcoded

### Recommended Action
**Before deploying to production hospitals, prioritize making the system configurable for:**
1. Roles & Permissions (CRITICAL)
2. Appointment Types (HIGH)
3. Vital Thresholds (HIGH)
4. Notification Events (MEDIUM)
5. Session Configuration (MEDIUM)

---

## Appendix: Hardcoded Values Checklist

- [ ] Review all enum definitions (schema.prisma)
- [ ] Audit authentication configuration (src/lib/auth.ts)
- [ ] Check permission matrix for flexibility (src/lib/rbac.ts)
- [ ] Verify notification events are extensible (src/lib/notifications/engine.ts)
- [ ] Review API route role checks (src/app/api/**/route.ts)
- [ ] Audit query limits (all database queries)
- [ ] Check UI routing (src/app/dashboard/layout.tsx)
- [ ] Verify error message handling (all error responses)
- [ ] Check date/time formatting (all date displays)
- [ ] Audit business logic numbers (vital sign thresholds, timeouts)

---

**Document Prepared For:** Hospital IT Administrators & Developers  
**Intended Use:** Understanding current limitations and planning customization needs  
**Next Review:** After each major feature addition
