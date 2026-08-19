# Hospital Customization Guide - H1MS Configuration Options

**Purpose:** Help hospital IT administrators understand which H1MS features can be customized and how difficult each customization is.

**Audience:** Hospital IT Managers, System Administrators, DevOps Engineers

---

## Quick Reference: Customization Difficulty Levels

| Level | Time | Risk | Requires | Example |
|-------|------|------|----------|---------|
| 🟢 **Easy** | 5 min | Low | Environment variable change | Change port number, database URL |
| 🟡 **Medium** | 1-2 hours | Medium | Code rebuild, container restart | Change session timeout, add custom field |
| 🔴 **Hard** | 4-8 hours | High | Database migration, backup required | Add new role, add new appointment type |
| ⛔ **Very Hard** | 1-2 days | Very High | Full code refactoring | Implement custom RBAC system |

---

## 🟢 Easy Customizations (Environment Variables)

These can be changed without redeploying the application.

### 1. Change Application Port

**Difficulty:** 🟢 Easy | **Time:** 5 minutes | **Risk:** Low

#### Current Hardcoded Value
```
Port: 3000
```

#### How to Customize
```bash
# Windows - Edit the environment file
# In release/start-h1ms.bat
set PORT=8080

# Or set environment variable before running
$env:PORT = "8080"
npm start
```

#### Impact
- Allows running multiple H1MS instances on same server
- Doesn't require database changes
- No code rebuild needed

---

### 2. Change Database Connection

**Difficulty:** 🟢 Easy | **Time:** 10 minutes | **Risk:** Low

#### Current Configuration
```
DATABASE_URL="mongodb://localhost:27017/h1ms"
```

#### How to Customize
```bash
# Edit .env.local file for your MongoDB
DATABASE_URL="mongodb://localhost:27017/hospital_a_db"
```

#### Impact
- Each hospital can use their own MongoDB instance
- Data isolation between hospitals
- Backup & recovery independent per hospital

---

### 3. Change Application URL

**Difficulty:** 🟢 Easy | **Time:** 5 minutes | **Risk:** Low

#### Current Hardcoded Value
```
NEXTAUTH_URL="http://localhost:3000"
```

#### How to Customize
```bash
# .env.local
NEXTAUTH_URL="https://hms.hospital-a.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
```

#### Impact
- Allows custom domain names
- Required for production deployment
- Affects OAuth callback URLs

---

### 4. Change Firebase Configuration

**Difficulty:** 🟢 Easy | **Time:** 15 minutes | **Risk:** Low

#### Current Hardcoded Value
```javascript
// Firebase not integrated (mock only)
```

#### How to Customize
```typescript
// src/lib/notifications/engine.ts
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
```

#### Impact
- Push notifications to mobile apps
- Real-time messaging capability
- Per-hospital Firebase project possible

---

### 5. Change WhatsApp API Provider

**Difficulty:** 🟢 Easy | **Time:** 20 minutes | **Risk:** Low

#### Current Hardcoded Value
```typescript
// src/lib/notifications/whatsapp-mock.ts
// Currently mocked, no real WhatsApp integration
```

#### How to Customize
```typescript
// Switch to Twilio, MessageBird, or Vonage
const twilioClient = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Or implement custom provider
await customWhatsAppProvider.send({
  to: phoneNumber,
  message: messageContent
});
```

#### Impact
- Real WhatsApp notifications instead of mock
- Different provider per hospital
- Cost implications (per message)

---

## 🟡 Medium Customizations (Code Changes + Rebuild)

These require code changes and recompilation, but no database migration.

### 1. Change Session Timeout Duration

**Difficulty:** 🟡 Medium | **Time:** 1 hour | **Risk:** Medium

#### Current Hardcoded Value
```typescript
// src/lib/auth.ts
session: {
  maxAge: 24 * 60 * 60,  // 24 hours in seconds
}
```

#### How to Customize

**Option A: Environment Variable (Recommended)**
```typescript
// src/lib/auth.ts
session: {
  maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400'),  // Default 24 hours
}

// .env.local
SESSION_MAX_AGE=43200  // 12 hours for Hospital A
SESSION_MAX_AGE=604800  // 7 days for Hospital B
```

**Option B: Database Configuration (Better)**
```typescript
// Requires database table: hospital_settings
const hospitalConfig = await db.hospital_settings.findUnique({
  where: { hospitalId: req.hospital.id }
});

session: {
  maxAge: hospitalConfig.sessionMaxAge || 86400
}
```

#### Steps to Implement
1. Edit `src/lib/auth.ts`
2. Add environment variable check
3. Rebuild application: `npm run build`
4. Redeploy container
5. No database changes needed

#### Impact
- Short timeout = more security, more logins
- Long timeout = better UX, less security
- Different timeout per hospital possible

---

### 2. Add New Patient Custom Fields

**Difficulty:** 🟡 Medium | **Time:** 2 hours | **Risk:** Medium

#### Current Hardcoded Fields
```typescript
// src/app/api/receptionist/patients/route.ts
const newPatient = {
  name: string,
  phone: string,
  email: string,
  dateOfBirth: Date,
  gender: Gender,
  bloodGroup: string,
  address: string,
  emergencyContact: string,
  emergencyPhone: string,
};
```

#### How to Customize

**Step 1: Update Database Schema**
```prisma
// prisma/schema.prisma
model Patient {
  // ... existing fields ...
  
  // New custom fields for your hospital
  insurance_id: String?
  occupation: String?
  nationality: String?
  patient_class: String?  // VIP, Regular, Charity
  medical_notes: String?
  customData: Json?  // Store arbitrary JSON
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Step 2: Create Migration**
```bash
npx prisma migrate dev --name add_patient_custom_fields
```

**Step 3: Update API Routes**
```typescript
// src/app/api/receptionist/patients/route.ts
const newPatient = {
  name,
  phone,
  email,
  dateOfBirth,
  gender,
  bloodGroup,
  address,
  emergencyContact,
  emergencyPhone,
  insurance_id,      // New field
  occupation,        // New field
  nationality,       // New field
  patient_class,     // New field
};
```

**Step 4: Update UI Components**
```typescript
// src/components/patient-form.tsx
// Add new form fields for custom attributes
```

**Step 5: Rebuild & Deploy**
```bash
npm run build
docker-compose up -d
```

#### Impact
- Each hospital can add different custom fields
- Requires database migration (plan downtime)
- Affects all API responses
- UI must be updated separately

---

### 3. Change Vital Signs Thresholds

**Difficulty:** 🟡 Medium | **Time:** 1-2 hours | **Risk:** Medium

#### Current Hardcoded Values
```typescript
// Likely hardcoded in vital sign validation
const CRITICAL_HEART_RATE_HIGH = 120;
const CRITICAL_HEART_RATE_LOW = 40;
const CRITICAL_BP_SYSTOLIC = 180;
// ... etc
```

#### How to Customize

**Step 1: Create Configuration Table**
```prisma
model VitalSignsThreshold {
  id String @id @default(cuid())
  hospitalId String
  
  heartRate_min Int
  heartRate_max Int
  heartRate_critical_low Int
  heartRate_critical_high Int
  
  bloodPressure_systolic_min Int
  bloodPressure_systolic_max Int
  bloodPressure_diastolic_min Int
  bloodPressure_diastolic_max Int
  
  temperature_min Float
  temperature_max Float
  temperature_critical Float
  
  respiratoryRate_min Int
  respiratoryRate_max Int
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([hospitalId])
}
```

**Step 2: Migrate Database**
```bash
npx prisma migrate dev --name add_vital_thresholds
```

**Step 3: Update Vital Validation Logic**
```typescript
// src/lib/vitals-validation.ts
async function validateVitals(hospitalId: string, vitals: VitalsInput) {
  const thresholds = await db.vitalSignsThreshold.findUnique({
    where: { hospitalId }
  });
  
  if (vitals.heartRate > thresholds.heartRate_critical_high) {
    return { isCritical: true, reason: 'Critical heart rate' };
  }
  // ... more validations
}
```

**Step 4: Create Admin UI**
```typescript
// src/app/dashboard/admin/vital-settings/page.tsx
// Allow admins to customize thresholds
```

#### Impact
- Different hospitals have different medical standards
- Affects alert generation (critical vitals)
- Improves clinical accuracy
- Requires admin UI implementation

---

### 4. Change Notification Channels

**Difficulty:** 🟡 Medium | **Time:** 2-3 hours | **Risk:** Medium

#### Current Hardcoded Behavior
```typescript
// src/lib/notifications/engine.ts
// SMS & WhatsApp notifications triggered automatically
// Cannot disable specific channels per hospital
```

#### How to Customize

**Step 1: Create Notification Preferences**
```prisma
model NotificationPreference {
  id String @id @default(cuid())
  hospitalId String
  
  // Channel preferences
  enableSMS Boolean @default(true)
  enableWhatsApp Boolean @default(true)
  enableEmail Boolean @default(true)
  enableInApp Boolean @default(true)
  
  // Event-specific preferences
  enablePrescriptionNotifications Boolean
  enableAppointmentReminders Boolean
  enableVitalsAlerts Boolean
  enableBillingNotifications Boolean
  
  // Quiet hours
  quietHoursStart String?  // "18:00"
  quietHoursEnd String?    // "09:00"
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Step 2: Migrate Database**
```bash
npx prisma migrate dev --name add_notification_preferences
```

**Step 3: Update Notification Engine**
```typescript
async function sendNotification(
  hospitalId: string,
  event: HospitalEvent,
  recipient: User
) {
  const prefs = await db.notificationPreference.findUnique({
    where: { hospitalId }
  });
  
  if (prefs.enableSMS) {
    await sendSMS(recipient.phone, message);
  }
  if (prefs.enableEmail) {
    await sendEmail(recipient.email, message);
  }
  // ... etc
}
```

#### Impact
- Hospitals can disable expensive channels (SMS)
- Quiet hours prevent notifications at night
- Reduces notification fatigue
- Per-hospital preferences possible

---

### 5. Add Custom Email Templates

**Difficulty:** 🟡 Medium | **Time:** 1-2 hours | **Risk:** Low

#### Current Hardcoded Behavior
```typescript
// Email templates likely hardcoded with generic text
// Hospital branding not supported
```

#### How to Customize

**Step 1: Create Email Template System**
```prisma
model EmailTemplate {
  id String @id @default(cuid())
  hospitalId String
  templateType String  // "APPOINTMENT_CONFIRMATION", "BILLING", etc.
  
  subject String
  htmlBody String
  textBody String
  
  // Template variables: {{patientName}}, {{appointmentTime}}, etc.
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([hospitalId, templateType])
}
```

**Step 2: Create Admin Template Editor**
```typescript
// src/app/dashboard/admin/email-templates/page.tsx
// WYSIWYG email template editor
```

**Step 3: Update Email Sending**
```typescript
async function sendAppointmentConfirmation(
  hospitalId: string,
  patient: Patient,
  appointment: Appointment
) {
  const template = await db.emailTemplate.findUnique({
    where: {
      hospitalId_templateType: {
        hospitalId,
        templateType: 'APPOINTMENT_CONFIRMATION'
      }
    }
  });
  
  const html = template.htmlBody
    .replace('{{patientName}}', patient.name)
    .replace('{{appointmentTime}}', appointment.scheduledAt.toString());
  
  await sendEmail(patient.email, { subject: template.subject, html });
}
```

#### Impact
- Hospital branding in all emails
- Multilingual templates
- Legal compliance (terms, privacy)
- Improves patient experience

---

## 🔴 Hard Customizations (Database Migrations)

These require database changes and careful planning.

### 1. Add New Hospital Roles

**Difficulty:** 🔴 Hard | **Time:** 4-6 hours | **Risk:** High

#### Current Hardcoded Value
```typescript
// prisma/schema.prisma
enum Role {
  DOCTOR
  NURSE
  RECEPTIONIST
  PHARMACIST
  ADMIN
}

// src/lib/rbac.ts
const PERMISSION_MATRIX: Record<Role, ...> = {
  DOCTOR: {...},
  NURSE: {...},
  // ... 5 roles only, cannot add more
}
```

#### The Problem
- Can only add roles by modifying code + schema
- All users must fit into one of these 5 roles
- Hospital organizational structures vary

#### How to Customize

**Option 1: Convert Enum to Database (Recommended)**

**Step 1: Create Roles Table**
```prisma
model Role {
  id String @id @default(cuid())
  hospitalId String
  name String  // "Doctor", "Lab Technician", "Radiologist"
  description String?
  
  // Link to users
  users User[]
  
  // Link to permissions
  permissions Permission[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([hospitalId, name])
}

model Permission {
  id String @id @default(cuid())
  roleId String
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  resource String  // "patient_metadata", "appointments", etc.
  action String    // "read", "create", "update", etc.
  
  createdAt DateTime @default(now())
  
  @@unique([roleId, resource, action])
}

model User {
  // ... existing fields ...
  roleId String
  role Role @relation(fields: [roleId], references: [id])
}
```

**Step 2: Create Migration**
```bash
# Backup first!
mongodump --uri "mongodb://..." --out ./backup

# Run migration
npx prisma migrate dev --name convert_roles_to_table
```

**Step 3: Seed Default Roles**
```typescript
// prisma/seed.ts
const roles = [
  { name: 'DOCTOR', permissions: [...] },
  { name: 'NURSE', permissions: [...] },
  { name: 'RECEPTIONIST', permissions: [...] },
  { name: 'PHARMACIST', permissions: [...] },
  { name: 'ADMIN', permissions: [...] },
  // Can now add new roles:
  { name: 'LAB_TECHNICIAN', permissions: [...] },
  { name: 'RADIOLOGIST', permissions: [...] },
];

for (const role of roles) {
  await db.role.create({
    data: {
      hospitalId,
      name: role.name,
      permissions: {
        create: role.permissions
      }
    }
  });
}
```

**Step 4: Update RBAC System**
```typescript
// src/lib/rbac.ts - Completely rewrite to use database
async function hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { role: { include: { permissions: true } } }
  });
  
  return user.role.permissions.some(
    p => p.resource === resource && p.action === action
  );
}
```

**Step 5: Create Role Management UI**
```typescript
// src/app/dashboard/admin/roles/page.tsx
// Allow admins to create/edit roles and permissions
```

**Step 6: Rebuild & Deploy**
```bash
npm run build
npm run db:migrate
npm run db:seed
docker-compose up -d
```

#### Deployment Checklist
- [ ] Full database backup created
- [ ] Test migration on staging database
- [ ] Notify hospital IT team of maintenance window
- [ ] Plan 30-60 minute downtime
- [ ] Have rollback plan ready
- [ ] Test all role-based access after migration
- [ ] Audit logs updated

#### Impact
- **Complete RBAC system now in database**
- Hospital can add unlimited custom roles
- Permissions can be adjusted without code changes
- Roles can be created via admin UI
- Significant architectural change

---

### 2. Add New Appointment Types

**Difficulty:** 🔴 Hard | **Time:** 3-4 hours | **Risk:** High

#### Current Hardcoded Value
```typescript
// prisma/schema.prisma
enum AppointmentType {
  CONSULTATION
  FOLLOW_UP
  EMERGENCY
  ROUTINE_CHECKUP
  PROCEDURE
}
```

#### The Problem
- Can only add appointment types by modifying schema
- Each hospital needs different types (TELEMED, SURGERY, IMAGING)
- Changing requires code deployment + migration

#### How to Customize

**Step 1: Create AppointmentType Table**
```prisma
model AppointmentType {
  id String @id @default(cuid())
  hospitalId String
  name String  // "Surgery", "Telemedicine", "Lab Test"
  description String?
  durationMinutes Int @default(30)
  requiresConfirmation Boolean @default(true)
  requiresRescheduleNotification Boolean @default(true)
  
  appointments Appointment[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([hospitalId, name])
}

model Appointment {
  // ... change from enum to foreign key
  typeId String  // was: type: AppointmentType
  type AppointmentType @relation(fields: [typeId], references: [id])
  // ... rest of fields
}
```

**Step 2: Create Migration**
```bash
# Backup first
mongodump --uri "mongodb://..." --out ./backup

# Run migration
npx prisma migrate dev --name convert_appointment_types_to_table
```

**Step 3: Seed Default Types**
```typescript
// prisma/seed.ts
const appointmentTypes = [
  { name: 'CONSULTATION', durationMinutes: 30 },
  { name: 'FOLLOW_UP', durationMinutes: 15 },
  { name: 'EMERGENCY', durationMinutes: 60 },
  { name: 'ROUTINE_CHECKUP', durationMinutes: 20 },
  { name: 'PROCEDURE', durationMinutes: 90 },
];

for (const type of appointmentTypes) {
  await db.appointmentType.create({
    data: { hospitalId, ...type }
  });
}
```

**Step 4: Update API Routes**
```typescript
// src/app/api/receptionist/appointments/route.ts
// Update to reference AppointmentType table instead of enum

const appointment = await db.appointment.create({
  data: {
    typeId: req.body.typeId,  // was: type: req.body.type
    patientId: req.body.patientId,
    doctorId: req.body.doctorId,
    scheduledAt: req.body.scheduledAt,
    // ...
  }
});
```

**Step 5: Create Admin UI**
```typescript
// src/app/dashboard/admin/appointment-types/page.tsx
// Allow admins to add/edit appointment types
```

#### Deployment Checklist
- [ ] Full database backup
- [ ] Test migration on staging
- [ ] All appointment types have IDs after migration
- [ ] API endpoints updated and tested
- [ ] UI updated for new structure
- [ ] Frontend dropdown working
- [ ] Reports still generate correctly

#### Impact
- Each hospital can define their own appointment types
- Duration per appointment type
- Different confirmation requirements possible
- Better reporting and analytics

---

### 3. Extend Billing System

**Difficulty:** 🔴 Hard | **Time:** 6-8 hours | **Risk:** High

#### Current Hardcoded Values
```typescript
// Limited billing status enum
enum BillingStatus {
  PENDING
  PAID
  PARTIALLY_PAID
  OVERDUE
  CANCELLED
}

// No insurance/claims support
// No refund tracking
// No payment plans
```

#### The Problem
- Cannot track insurance claims (major business need)
- Cannot handle partial payments with plans
- No refund tracking
- No multiple payment methods

#### How to Customize

**Step 1: Create Extended Billing Schema**
```prisma
model Bill {
  id String @id @default(cuid())
  hospitalId String
  patientId String
  patient Patient @relation(fields: [patientId], references: [id])
  
  billDate DateTime @default(now())
  totalAmount Float
  amountPaid Float @default(0)
  amountRemaining Float
  
  status BillingStatus
  statusHistory BillStatus[]
  
  // Insurance claim
  insuranceClaim InsuranceClaim?
  
  // Payment plan
  paymentPlan PaymentPlan?
  
  // Individual charges
  charges Charge[]
}

model Charge {
  id String @id @default(cuid())
  billId String
  bill Bill @relation(fields: [billId], references: [id])
  
  description String  // "Consultation", "Medication", "Lab Test"
  amount Float
  quantity Int @default(1)
  
  createdAt DateTime @default(now())
}

model InsuranceClaim {
  id String @id @default(cuid())
  billId String @unique
  bill Bill @relation(fields: [billId], references: [id])
  
  insuranceProvider String
  claimNumber String
  claimAmount Float
  claimStatus String  // "SUBMITTED", "APPROVED", "REJECTED", "PARTIAL"
  
  createdAt DateTime @default(now())
}

model PaymentPlan {
  id String @id @default(cuid())
  billId String @unique
  bill Bill @relation(fields: [billId], references: [id])
  
  totalAmount Float
  monthlyPayment Float
  numberOfPayments Int
  startDate DateTime
  payments Payment[]
}

model Payment {
  id String @id @default(cuid())
  paymentPlanId String
  paymentPlan PaymentPlan @relation(fields: [paymentPlanId], references: [id])
  
  amount Float
  paymentDate DateTime?
  status String  // "PENDING", "PAID", "FAILED"
  
  createdAt DateTime @default(now())
}
```

**Step 2: Create Migration**
```bash
npx prisma migrate dev --name extend_billing_system
```

**Step 3: Create Billing APIs**
```typescript
// src/app/api/receptionist/billing/route.ts
// POST - Create bill with charges
// POST - Submit insurance claim
// POST - Create payment plan
// GET - Get bill details
// PUT - Record payment
```

**Step 4: Create Billing UI**
```typescript
// src/app/dashboard/receptionist/billing/
// Bill creation form
// Payment tracking
// Insurance claim submission
// Payment plan editor
```

#### Deployment Checklist
- [ ] Backup all billing data
- [ ] Test migration
- [ ] Verify existing bills migrated correctly
- [ ] New billing APIs tested
- [ ] UI fully functional
- [ ] Export/reporting working
- [ ] Compliance audit (HIPAA, etc.)

#### Impact
- Complete billing system overhaul
- Insurance integration
- Payment plans
- Better financial tracking
- Revenue cycle management

---

## ⛔ Very Hard Customizations (Architecture Changes)

These require significant architectural changes.

### 1. Implement Multi-Tenancy

**Difficulty:** ⛔ Very Hard | **Time:** 2-3 weeks | **Risk:** Very High | **Cost:** Significant

#### Current Situation
- Single-hospital system (hardcoded assumptions)
- Database has no hospital isolation
- All users share same database

#### What This Means
- Cannot support multiple hospitals in one installation
- Each hospital needs separate installation
- Expensive for SaaS model

#### How to Implement

**Architecture Change:**
```typescript
// Every table needs hospital_id
model Patient {
  id String @id
  hospitalId String  // ← New field
  name String
  // ...
  
  @@index([hospitalId])
  @@unique([hospitalId, id])
}

// Middleware to inject hospital context
middleware.ts:
  1. Extract hospitalId from subdomain (hospital-a.h1ms.com)
  2. Verify user belongs to this hospital
  3. Add hospitalId to all queries automatically
  4. Prevent data leakage between hospitals
```

**Database Strategy:**
- Option 1: Separate MongoDB per hospital (simple, expensive)
- Option 2: Single MongoDB with per-hospital collections (data isolation)
- Option 3: Shared MongoDB with row-level security (complex, efficient)

**Timeline:** 2-3 weeks
**Effort:** Full team (2-3 developers)
**Cost:** $20k-40k

---

### 2. Implement Audit Log & Compliance

**Difficulty:** ⛔ Very Hard | **Time:** 1-2 weeks | **Risk:** High | **Cost:** Significant

#### Current Situation
- Minimal audit logging
- No HIPAA compliance
- No data encryption

#### Requirements for Compliance
- All data access logged (WHO, WHEN, WHAT, WHERE)
- Audit logs immutable (cannot be deleted)
- Encryption at rest & in transit
- Access controls logged
- Failed access attempts logged

#### How to Implement

```typescript
model AuditLog {
  id String @id
  timestamp DateTime @default(now())
  userId String
  action String
  resourceType String
  resourceId String
  before Object?  // Previous values
  after Object?   // New values
  ipAddress String
  userAgent String
  result String  // "SUCCESS", "FAILURE"
  errorMessage String?
  
  // Immutable - index for fast queries
  @@index([timestamp, userId, resourceType])
}

// Middleware to log all changes
const auditMiddleware = async (req, res) => {
  const startTime = Date.now();
  
  // Capture request
  const requestData = {
    method: req.method,
    path: req.path,
    body: req.body,
    userId: req.user?.id
  };
  
  // Execute request
  res.on('finish', () => {
    // Log to audit table
    await db.auditLog.create({
      data: {
        userId: req.user?.id,
        action: `${req.method} ${req.path}`,
        result: res.statusCode < 400 ? 'SUCCESS' : 'FAILURE',
        duration: Date.now() - startTime,
        statusCode: res.statusCode
      }
    });
  });
};
```

**Timeline:** 1-2 weeks
**Effort:** 1-2 developers
**Cost:** $10k-20k

---

## Decision Tree: Which Customization Should You Do?

```
START
  │
  ├─ Do you need to change port/URL/database?
  │  └─ YES → Easy Customization (5 min)
  │
  ├─ Do you need different session timeout?
  │  └─ YES → Medium Customization (1 hour)
  │
  ├─ Do you need custom appointment types?
  │  └─ YES → Hard Customization (4 hours)
  │
  ├─ Do you need different roles?
  │  └─ YES → Hard Customization (6 hours)
  │
  ├─ Do you need multiple hospitals in one system?
  │  └─ YES → Very Hard (2-3 weeks)
  │
  ├─ Do you need HIPAA/compliance?
  │  └─ YES → Very Hard (1-2 weeks)
  │
  └─ Do you need complete custom workflows?
     └─ YES → Very Hard (4+ weeks)
```

---

## Support Resources

### For Easy Customizations
- See `.env.local` template
- Read comments in configuration files
- No support needed

### For Medium Customizations
- Check TypeScript types for schema
- Read existing migrations examples
- Contact: deployment-team@h1ms.io

### For Hard Customizations
- Review Prisma schema documentation
- Understand impact on API routes
- **Recommended:** Use professional services
- Contact: customization-services@h1ms.io

### For Very Hard Customizations
- Not recommended without professional help
- Full development team required
- Contact: enterprise-support@h1ms.io

---

## Deployment Checklist Template

### Before Making Changes
- [ ] Full database backup created
- [ ] Test environment prepared
- [ ] Team informed of maintenance window
- [ ] Rollback plan documented

### After Making Changes
- [ ] Test all affected features
- [ ] Run unit tests: `npm test`
- [ ] Run integration tests: `npm run test:integration`
- [ ] Check no data loss: `npm run validate:migration`
- [ ] Verify performance: `npm run load-test`

### After Deployment
- [ ] Monitor error logs
- [ ] Verify all users can login
- [ ] Check role-based access working
- [ ] Confirm notifications working
- [ ] Audit logs clean

---

## Appendix: Common Customizations by Hospital Type

### Small Clinic (10-50 patients/day)
**Recommended Customizations:**
- ✅ Custom patient fields (insurance ID)
- ✅ Custom appointment types (only "Consultation" + "Checkup")
- ✅ Custom session timeout (24 hours is fine)
- ❌ Multi-tenancy (not needed)

### Medium Hospital (100-500 patients/day)
**Recommended Customizations:**
- ✅ All small clinic customizations
- ✅ Extended billing system
- ✅ Custom roles (Lab Technician, Radiologist)
- ✅ Advanced notification preferences
- ❌ Multi-tenancy (not needed)

### Large Hospital (500+ patients/day)
**Recommended Customizations:**
- ✅ All medium hospital customizations
- ✅ Multi-tenancy (multiple departments)
- ✅ HIPAA compliance
- ✅ Advanced audit logging
- ✅ Custom workflows
- ✅ SSO/LDAP integration

### Health System (Multiple Hospitals)
**Recommended Customizations:**
- ✅ Multi-tenancy (required)
- ✅ Central admin dashboard
- ✅ Cross-hospital reporting
- ✅ Enterprise audit logging
- ✅ Advanced security
- ✅ Capacity planning tools
- ✅ Master data management

---

## FAQ

**Q: Can we add a new role without database migration?**  
A: No, currently all roles are hardcoded. To add a role, you must:
1. Modify enum in schema.prisma
2. Update PERMISSION_MATRIX in rbac.ts
3. Run database migration
4. Rebuild application

**Q: How long does a database migration take?**  
A: Depends on data size:
- 10k records: 1-2 minutes
- 100k records: 5-10 minutes
- 1M records: 30-60 minutes
- Recommend running during low-traffic hours

**Q: Can we customize roles per department?**  
A: Not currently. This would require:
1. Convert roles to database table (Hard)
2. Add department hierarchy (Very Hard)
3. Implement role inheritance (Very Hard)

**Q: What happens if migration fails?**  
A: Rollback to previous backup:
```bash
mongorestore --uri "mongodb://..." ./backup
```

**Q: Can we run multiple instances?**  
A: Yes! Change PORT environment variable on each instance (they need separate databases).

**Q: Is downtime required for migrations?**  
A: Yes. Application must be stopped while database migrates.
- Plan 30-60 minutes for medium hospital
- Plan 2-4 hours for large hospital

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Audience:** Hospital IT Administrators  
**Next Review:** After each customization implementation
