import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local since tsx doesn't auto-load it like Next.js
config({ path: resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Seeding H1MS database...\n');

  // ─── Clear existing data ───────────────────────────────
  console.log('  [x] Clearing existing data...');
  await prisma.staffNotification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.medicationSchedule.deleteMany();
  await prisma.medicationItem.deleteMany();
  await prisma.billingLineItem.deleteMany();
  await prisma.billing.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.vitals.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.medicalHistory.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.admission.deleteMany();
  await prisma.hospitalService.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  // ─── Users (Demo Accounts) ────────────────────────────
  console.log('  [+] Creating demo users...');
  const passwordHash = await bcrypt.hash('demo123', 12);

  const doctor = await prisma.user.create({
    data: {
      email: 'doctor@h1ms.com', passwordHash, name: 'Dr. Sarah Wilson',
      role: 'DOCTOR', department: 'Cardiology', phone: '+91-9800000001',
    },
  });

  const doctor2 = await prisma.user.create({
    data: {
      email: 'james@h1ms.com', passwordHash, name: 'Dr. James Chen',
      role: 'DOCTOR', department: 'Neurology', phone: '+91-9800000002',
    },
  });

  const doctor3 = await prisma.user.create({
    data: {
      email: 'priya@h1ms.com', passwordHash, name: 'Dr. Priya Sharma',
      role: 'DOCTOR', department: 'Pediatrics', phone: '+91-9800000003',
    },
  });

  const nurse = await prisma.user.create({
    data: {
      email: 'nurse@h1ms.com', passwordHash, name: 'Emily Rodriguez',
      role: 'NURSE', department: 'ICU', phone: '+91-9800000004',
    },
  });

  const nurse2 = await prisma.user.create({
    data: {
      email: 'michael@h1ms.com', passwordHash, name: 'Michael Brown',
      role: 'NURSE', department: 'General', phone: '+91-9800000005',
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      email: 'receptionist@h1ms.com', passwordHash, name: 'Amanda Foster',
      role: 'RECEPTIONIST', department: 'Front Desk', phone: '+91-9800000006',
    },
  });

  const pharmacist = await prisma.user.create({
    data: {
      email: 'pharmacist@h1ms.com', passwordHash, name: 'David Kim',
      role: 'PHARMACIST', department: 'Pharmacy', phone: '+91-9800000007',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@h1ms.com', passwordHash, name: 'Admin User',
      role: 'ADMIN', department: 'IT', phone: '+91-9800000008',
    },
  });

  const accountant = await prisma.user.create({
    data: {
      email: 'accountant@h1ms.com', passwordHash, name: 'Robert Finance',
      role: 'ACCOUNTANT', department: 'Billing', phone: '+91-9800000009',
    },
  });

  console.log('  [+] Created 9 users');

  // ─── Patients ─────────────────────────────────────────
  console.log('  [+] Creating patients...');
  const patients = await Promise.all([
    prisma.patient.create({
      data: { name: 'Rajesh Kumar', uhid: 'H1MS-SEED-001', registrationNumber: 'REG-001', phone: '+91-9876543210', email: 'rajesh@email.com', dateOfBirth: new Date('1980-01-15'), gender: 'MALE', bloodGroup: 'A+', address: '123 Main St, Bangalore', emergencyContact: 'Priya Kumar', emergencyPhone: '+91-9876543220' },
    }),
    prisma.patient.create({
      data: { name: 'Anita Desai', uhid: 'H1MS-SEED-002', registrationNumber: 'REG-002', phone: '+91-9876543211', email: 'anita@email.com', dateOfBirth: new Date('1992-07-22'), gender: 'FEMALE', bloodGroup: 'O+', address: '15 Park Street, Mumbai', emergencyContact: 'Rahul Desai', emergencyPhone: '+91-9876543221' },
    }),
    prisma.patient.create({
      data: { name: 'Vikram Singh', uhid: 'H1MS-SEED-003', registrationNumber: 'REG-003', phone: '+91-9876543212', dateOfBirth: new Date('1974-11-08'), gender: 'MALE', bloodGroup: 'B+', address: '88 Defence Colony, Bangalore', emergencyContact: 'Meena Singh', emergencyPhone: '+91-9876543222' },
    }),
    prisma.patient.create({
      data: { name: 'Meera Patel', uhid: 'H1MS-SEED-004', registrationNumber: 'REG-004', phone: '+91-9876543213', dateOfBirth: new Date('1998-05-30'), gender: 'FEMALE', bloodGroup: 'AB+', address: '23 Jubilee Hills, Hyderabad', emergencyContact: 'Amit Patel', emergencyPhone: '+91-9876543223' },
    }),
    prisma.patient.create({
      data: { name: 'Suresh Rao', uhid: 'H1MS-SEED-005', registrationNumber: 'REG-005', phone: '+91-9876543214', dateOfBirth: new Date('1963-09-18'), gender: 'MALE', bloodGroup: 'O-', address: '7 Anna Nagar, Chennai', emergencyContact: 'Lakshmi Rao', emergencyPhone: '+91-9876543224' },
    }),
    prisma.patient.create({
      data: { name: 'Kavitha Nair', uhid: 'H1MS-SEED-006', registrationNumber: 'REG-006', phone: '+91-9876543215', dateOfBirth: new Date('1985-12-03'), gender: 'FEMALE', bloodGroup: 'A-', address: '55 Koramangala, Bangalore' },
    }),
  ]);

  console.log(`  [+] Created ${patients.length} patients`);

  // ─── Wards & Beds ─────────────────────────────────────
  console.log('  [+] Creating wards and beds...');
  const wardData = [
    { name: 'General Ward A', floor: 1, totalBeds: 20, type: 'GENERAL' as const },
    { name: 'General Ward B', floor: 1, totalBeds: 20, type: 'GENERAL' as const },
    { name: 'ICU', floor: 2, totalBeds: 10, type: 'ICU' as const },
    { name: 'Pediatric Ward', floor: 2, totalBeds: 15, type: 'PEDIATRIC' as const },
    { name: 'Surgical Ward', floor: 3, totalBeds: 25, type: 'SURGICAL' as const },
    { name: 'Maternity Ward', floor: 3, totalBeds: 15, type: 'MATERNITY' as const },
    { name: 'Emergency', floor: 1, totalBeds: 15, type: 'EMERGENCY' as const },
  ];

  for (const wd of wardData) {
    const ward = await prisma.ward.create({ data: wd });
    // Create beds one at a time (MongoDB compatible)
    for (let i = 1; i <= Math.min(wd.totalBeds, 8); i++) {
      await prisma.bed.create({
        data: {
          wardId: ward.id,
          bedNumber: `${ward.name.split(' ')[0].substring(0, 3).toUpperCase()}-${i}`,
          status: i <= 3 ? 'OCCUPIED' : i === 4 ? 'MAINTENANCE' : 'AVAILABLE',
          patientId: i <= 3 && patients[i - 1] ? patients[i - 1].id : null,
          assignedNurseId: i <= 3 ? nurse.id : null,
        },
      });
    }
  }

  console.log('  [+] Created 7 wards with beds');

  // ─── Hospital Services ────────────────────────────────
  console.log('  [+] Creating hospital services...');
  const services = await Promise.all([
    prisma.hospitalService.create({ data: { name: 'General Consultation', code: 'SRV-001', category: 'CONSULTATION', unitPrice: 500, unit: 'per visit' } }),
    prisma.hospitalService.create({ data: { name: 'Specialist Consultation', code: 'SRV-002', category: 'CONSULTATION', unitPrice: 800, unit: 'per visit' } }),
    prisma.hospitalService.create({ data: { name: 'Complete Blood Count (CBC)', code: 'LAB-001', category: 'LABORATORY', unitPrice: 350, unit: 'per test', taxRate: 5 } }),
    prisma.hospitalService.create({ data: { name: 'Chest X-Ray', code: 'RAD-001', category: 'RADIOLOGY', unitPrice: 600, unit: 'per scan', taxRate: 5 } }),
    prisma.hospitalService.create({ data: { name: 'ECG', code: 'RAD-002', category: 'RADIOLOGY', unitPrice: 400, unit: 'per test' } }),
    prisma.hospitalService.create({ data: { name: 'ICU Bed Charge', code: 'BED-ICU', category: 'ROOM_CHARGE', unitPrice: 5000, unit: 'per day' } }),
    prisma.hospitalService.create({ data: { name: 'General Ward Bed', code: 'BED-GEN', category: 'ROOM_CHARGE', unitPrice: 1500, unit: 'per day' } }),
  ]);
  console.log(`  [+] Created ${services.length} hospital services`);

  // ─── Admissions ───────────────────────────────────────
  console.log('  [+] Creating admissions...');
  const admissions = await Promise.all([
    prisma.admission.create({
      data: {
        patientId: patients[2].id,
        admissionType: 'IPD',
        uhid: 'H1MS-2026-00001',
        attendingDoctorId: doctor.id,
        wardId: wardData.find(w => w.type === 'ICU') ? (await prisma.ward.findFirst({ where: { type: 'ICU' } }))?.id : undefined,
        bedId: (await prisma.bed.findFirst({ where: { patientId: patients[2].id } }))?.id,
        department: 'Cardiology',
        status: 'ACTIVE',
      },
    }),
    prisma.admission.create({
      data: {
        patientId: patients[0].id,
        admissionType: 'OPD',
        uhid: 'H1MS-2026-00002',
        attendingDoctorId: doctor.id,
        department: 'Cardiology',
        status: 'ACTIVE',
      },
    }),
  ]);
  console.log(`  [+] Created ${admissions.length} admissions`);

  // ─── Medical History ──────────────────────────────────
  console.log('  [+] Creating medical history...');
  await Promise.all([
    prisma.medicalHistory.create({
      data: {
        patientId: patients[0].id,
        recordedById: doctor.id,
        category: 'ALLERGY',
        title: 'Penicillin Allergy',
        description: 'Patient reports severe hives and shortness of breath when taking Penicillin.',
        date: new Date('2010-05-15'),
        severity: 'Severe',
        isOngoing: true,
      },
    }),
    prisma.medicalHistory.create({
      data: {
        patientId: patients[2].id,
        recordedById: doctor.id,
        category: 'SURGICAL_HISTORY',
        title: 'CABG',
        description: 'Coronary artery bypass grafting (CABG) performed.',
        date: new Date('2022-11-10'),
        severity: 'Major',
        isOngoing: false,
      },
    }),
  ]);
  console.log('  [+] Created medical history records');

  // ─── Appointments ─────────────────────────────────────
  console.log('  [+] Creating appointments...');
  const now = new Date();
  const today9 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0);
  const today930 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30);
  const today10 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0);
  const today1030 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30);
  const today11 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0);

  const appointments = await Promise.all([
    prisma.appointment.create({
      data: { patientId: patients[0].id, doctorId: doctor.id, scheduledAt: today9, status: 'COMPLETED', type: 'CONSULTATION', createdById: receptionist.id },
    }),
    prisma.appointment.create({
      data: { patientId: patients[1].id, doctorId: doctor2.id, scheduledAt: today930, status: 'COMPLETED', type: 'FOLLOW_UP', createdById: receptionist.id },
    }),
    prisma.appointment.create({
      data: { patientId: patients[2].id, doctorId: doctor.id, scheduledAt: today10, status: 'IN_PROGRESS', type: 'ROUTINE_CHECKUP', createdById: receptionist.id },
    }),
    prisma.appointment.create({
      data: { patientId: patients[3].id, doctorId: doctor3.id, scheduledAt: today1030, status: 'SCHEDULED', type: 'CONSULTATION', createdById: receptionist.id },
    }),
    prisma.appointment.create({
      data: { patientId: patients[4].id, doctorId: doctor2.id, scheduledAt: today11, status: 'SCHEDULED', type: 'FOLLOW_UP', createdById: receptionist.id },
    }),
  ]);

  console.log(`  [+] Created ${appointments.length} appointments`);

  // ─── Vitals ───────────────────────────────────────────
  console.log('  [+] Recording vitals...');
  await Promise.all([
    prisma.vitals.create({ data: { patientId: patients[0].id, recordedById: nurse.id, bloodPressureSystolic: 120, bloodPressureDiastolic: 80, heartRate: 72, temperature: 98.4, oxygenSat: 98, weight: 75 } }),
    prisma.vitals.create({ data: { patientId: patients[1].id, recordedById: nurse.id, bloodPressureSystolic: 118, bloodPressureDiastolic: 76, heartRate: 78, temperature: 98.6, oxygenSat: 99, weight: 62 } }),
    prisma.vitals.create({ data: { patientId: patients[2].id, recordedById: nurse.id, bloodPressureSystolic: 150, bloodPressureDiastolic: 95, heartRate: 95, temperature: 100.2, oxygenSat: 88, weight: 82 } }),
    prisma.vitals.create({ data: { patientId: patients[3].id, recordedById: nurse2.id, bloodPressureSystolic: 110, bloodPressureDiastolic: 70, heartRate: 80, temperature: 98.6, oxygenSat: 99, weight: 58 } }),
    prisma.vitals.create({ data: { patientId: patients[4].id, recordedById: nurse.id, bloodPressureSystolic: 142, bloodPressureDiastolic: 88, heartRate: 84, temperature: 98.8, oxygenSat: 93, weight: 70 } }),
  ]);
  console.log('  [+] Recorded vitals for 5 patients');

  // ─── Diagnoses ────────────────────────────────────────
  console.log('  [+] Creating diagnoses...');
  const diagnoses = await Promise.all([
    prisma.diagnosis.create({ data: { patientId: patients[0].id, doctorId: doctor.id, diagnosisString: 'Essential hypertension with mild left ventricular hypertrophy', icdCode: 'I10', notes: 'Patient presents with elevated BP readings over 3 visits. Lifestyle modification advised.' } }),
    prisma.diagnosis.create({ data: { patientId: patients[1].id, doctorId: doctor2.id, diagnosisString: 'Type 2 diabetes mellitus without complications', icdCode: 'E11.9', notes: 'HbA1c elevated at 7.2%. Adjusting medication regimen.' } }),
    prisma.diagnosis.create({ data: { patientId: patients[2].id, doctorId: doctor.id, diagnosisString: 'Coronary artery disease, post-CABG, stable angina', icdCode: 'I25.1', notes: 'Post-surgery recovery progressing well. Cardiac rehab recommended.' } }),
  ]);
  console.log(`  [+] Created ${diagnoses.length} diagnoses`);

  // ─── Prescriptions ────────────────────────────────────
  console.log('  [+] Creating prescriptions...');
  await prisma.prescription.create({
    data: {
      patientId: patients[0].id, doctorId: doctor.id, diagnosisId: diagnoses[0].id,
      isSigned: true, signedAt: new Date(),
      medications: {
        create: [
          { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'Take in the morning' },
          { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '30 days', instructions: 'Take with meals' },
        ],
      },
    },
  });

  await prisma.prescription.create({
    data: {
      patientId: patients[2].id, doctorId: doctor.id, diagnosisId: diagnoses[2].id,
      isSigned: true, signedAt: new Date(),
      medications: {
        create: [
          { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', duration: '90 days' },
          { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', duration: '90 days', instructions: 'Take at bedtime' },
          { name: 'Clopidogrel', dosage: '75mg', frequency: 'Once daily', duration: '30 days' },
        ],
      },
    },
  });

  await prisma.prescription.create({
    data: {
      patientId: patients[1].id, doctorId: doctor2.id, diagnosisId: diagnoses[1].id,
      isSigned: false,
      medications: {
        create: [
          { name: 'Insulin Glargine', dosage: '20 units', frequency: 'Once at bedtime', duration: '30 days', instructions: 'Subcutaneous injection' },
        ],
      },
    },
  });

  console.log('  [+] Created 3 prescriptions (2 signed, 1 draft)');

  // ─── Reports ──────────────────────────────────────────
  console.log('  [+] Creating reports...');
  await Promise.all([
    prisma.report.create({
      data: {
        patientId: patients[2].id, doctorId: doctor.id, type: 'Cardiology', title: 'Cardiac Assessment Report',
        content: 'Patient underwent comprehensive cardiac evaluation. ECG shows normal sinus rhythm. Echocardiogram reveals mild LVH. Stress test negative for ischemia.',
        isSigned: true, isLocked: true, signedAt: new Date(),
      },
    }),
    prisma.report.create({
      data: {
        patientId: patients[1].id, doctorId: doctor2.id, type: 'Pathology', title: 'Blood Work Analysis',
        content: 'HbA1c: 7.2% (target <7%). Fasting glucose: 142 mg/dL. Lipid panel within normal limits. Kidney function stable.',
        isSigned: false,
      },
    }),
  ]);
  console.log('  [+] Created 2 reports');

  // ─── Inventory ────────────────────────────────────────
  console.log('  [+] Stocking inventory...');
  const inventoryData = [
    { name: 'Amoxicillin 500mg', category: 'MEDICATION' as const, sku: 'MED-001', quantity: 12, unit: 'strips', reorderLevel: 50, price: 85, supplier: 'Sun Pharma', expiryDate: new Date('2027-03-15') },
    { name: 'Paracetamol 650mg', category: 'MEDICATION' as const, sku: 'MED-002', quantity: 340, unit: 'tablets', reorderLevel: 100, price: 12, supplier: 'Cipla', expiryDate: new Date('2027-08-20') },
    { name: 'Amlodipine 5mg', category: 'MEDICATION' as const, sku: 'MED-003', quantity: 180, unit: 'tablets', reorderLevel: 80, price: 25, supplier: 'Lupin', expiryDate: new Date('2027-05-10') },
    { name: 'Metformin 500mg', category: 'MEDICATION' as const, sku: 'MED-004', quantity: 220, unit: 'tablets', reorderLevel: 100, price: 18, supplier: "Dr. Reddy's", expiryDate: new Date('2027-06-30') },
    { name: 'Insulin Glargine 100U/ml', category: 'MEDICATION' as const, sku: 'MED-005', quantity: 15, unit: 'vials', reorderLevel: 20, price: 1250, supplier: 'Sanofi', expiryDate: new Date('2026-12-01') },
    { name: 'Aspirin 75mg', category: 'MEDICATION' as const, sku: 'MED-006', quantity: 450, unit: 'tablets', reorderLevel: 150, price: 10, supplier: 'USV', expiryDate: new Date('2027-09-01') },
    { name: 'Atorvastatin 20mg', category: 'MEDICATION' as const, sku: 'MED-007', quantity: 8, unit: 'strips', reorderLevel: 40, price: 95, supplier: 'Ranbaxy', expiryDate: new Date('2027-04-15') },
    { name: 'Surgical Gloves (L)', category: 'PPE' as const, sku: 'PPE-001', quantity: 500, unit: 'pairs', reorderLevel: 200, price: 8, supplier: 'MedLine' },
    { name: 'N95 Mask', category: 'PPE' as const, sku: 'PPE-002', quantity: 250, unit: 'units', reorderLevel: 100, price: 45, supplier: '3M' },
    { name: 'IV Cannula 20G', category: 'SURGICAL_SUPPLY' as const, sku: 'SUR-001', quantity: 45, unit: 'units', reorderLevel: 50, price: 65, supplier: 'BD', expiryDate: new Date('2028-01-15') },
    { name: 'Suture Kit 3-0', category: 'SURGICAL_SUPPLY' as const, sku: 'SUR-002', quantity: 30, unit: 'kits', reorderLevel: 25, price: 180, supplier: 'Ethicon', expiryDate: new Date('2028-06-20') },
    { name: 'Pulse Oximeter Probe', category: 'DIAGNOSTIC_EQUIPMENT' as const, sku: 'DIA-001', quantity: 8, unit: 'units', reorderLevel: 5, price: 3500, supplier: 'Nellcor' },
  ];

  for (const item of inventoryData) {
    await prisma.inventoryItem.create({ data: item });
  }
  console.log('  [+] Created 12 inventory items');

  // ─── Medication Schedules ─────────────────────────────
  console.log('  [+] Creating medication schedules...');
  const st = new Date();
  const medSchedules = [
    { patientId: patients[0].id, nurseId: nurse.id, medicationName: 'Amlodipine 5mg', dosage: '1 tablet', scheduledTime: new Date(st.getFullYear(), st.getMonth(), st.getDate(), 6, 0), status: 'ADMINISTERED' as const, administeredAt: new Date(st.getFullYear(), st.getMonth(), st.getDate(), 6, 5) },
    { patientId: patients[2].id, nurseId: nurse.id, medicationName: 'Aspirin 75mg', dosage: '1 tablet', scheduledTime: new Date(st.getFullYear(), st.getMonth(), st.getDate(), 6, 0), status: 'ADMINISTERED' as const, administeredAt: new Date(st.getFullYear(), st.getMonth(), st.getDate(), 6, 10) },
    { patientId: patients[0].id, nurseId: nurse.id, medicationName: 'Metformin 500mg', dosage: '1 tablet', scheduledTime: new Date(st.getFullYear(), st.getMonth(), st.getDate(), 8, 0), status: 'ADMINISTERED' as const, administeredAt: new Date(st.getFullYear(), st.getMonth(), st.getDate(), 8, 2) },
    { patientId: patients[4].id, nurseId: nurse.id, medicationName: 'Salbutamol Inhaler', dosage: '2 puffs', scheduledTime: new Date(st.getFullYear(), st.getMonth(), st.getDate(), 8, 0), status: 'OVERDUE' as const },
    { patientId: patients[3].id, nurseId: nurse2.id, medicationName: 'Folic Acid 5mg', dosage: '1 tablet', scheduledTime: new Date(st.getFullYear(), st.getMonth(), st.getDate(), 10, 0), status: 'PENDING' as const },
    { patientId: patients[2].id, nurseId: nurse.id, medicationName: 'Clopidogrel 75mg', dosage: '1 tablet', scheduledTime: new Date(st.getFullYear(), st.getMonth(), st.getDate(), 14, 0), status: 'PENDING' as const },
  ];

  for (const ms of medSchedules) {
    await prisma.medicationSchedule.create({ data: ms });
  }
  console.log('  [+] Created 6 medication schedules');

  // ─── Billings ─────────────────────────────────────────
  console.log('  [+] Creating billings...');
  const billing1 = await prisma.billing.create({
    data: { 
      invoiceNumber: 'INV-20260709-00001',
      patientId: patients[0].id, 
      appointmentId: appointments[0].id, 
      totalAmount: 1250, 
      taxTotal: 0,
      status: 'PAID', 
      generatedById: receptionist.id,
      paidAmount: 1250,
      paymentMethod: 'Credit Card'
    },
  });
  
  await prisma.billingLineItem.createMany({
    data: [
      { billingId: billing1.id, serviceId: services[0].id, serviceName: services[0].name, quantity: 1, unitPrice: 500, totalAmount: 500 },
      { billingId: billing1.id, serviceId: services[2].id, serviceName: services[2].name, quantity: 1, unitPrice: 350, totalAmount: 350, taxAmount: 17.5 },
      { billingId: billing1.id, serviceId: services[4].id, serviceName: services[4].name, quantity: 1, unitPrice: 400, totalAmount: 400 },
    ]
  });

  const billing2 = await prisma.billing.create({
    data: { 
      invoiceNumber: 'INV-20260709-00002',
      patientId: patients[1].id, 
      appointmentId: appointments[1].id, 
      totalAmount: 800, 
      taxTotal: 0,
      status: 'PENDING', 
      generatedById: receptionist.id 
    },
  });

  await prisma.billingLineItem.create({
    data: { billingId: billing2.id, serviceId: services[1].id, serviceName: services[1].name, quantity: 1, unitPrice: 800, totalAmount: 800 }
  });

  console.log('  [+] Created 2 billings with line items');

  // ─── Staff Notifications (Demo) ──────────────────────
  console.log('  [+] Creating demo staff notifications...');
  await prisma.staffNotification.createMany({
    data: [
      { recipientId: doctor.id, type: 'APPOINTMENT_ALERT', title: 'New appointment: Rajesh Kumar', message: 'Rajesh Kumar has been scheduled for a consultation today.', link: '/dashboard/doctor/patients' },
      { recipientId: doctor.id, type: 'VITALS_CRITICAL', title: 'CRITICAL: Vikram Singh', message: 'SpO2: 88% (Normal: >90%). Immediate attention required.', link: '/dashboard/doctor/patients' },
      { recipientId: nurse.id, type: 'TASK_ASSIGNED', title: 'New medication task: Rajesh Kumar', message: 'Dr. Sarah Wilson signed a prescription for Rajesh Kumar. Medications: Amlodipine 5mg, Metformin 500mg.', link: '/dashboard/nurse/medications' },
      { recipientId: nurse.id, type: 'TASK_ASSIGNED', title: 'New medication task: Vikram Singh', message: 'Dr. Sarah Wilson signed a prescription for Vikram Singh. Medications: Aspirin 75mg, Atorvastatin 20mg.', link: '/dashboard/nurse/medications' },
      { recipientId: pharmacist.id, type: 'PRESCRIPTION_ALERT', title: 'Prescription ready: Rajesh Kumar', message: 'A signed prescription from Dr. Sarah Wilson is ready for fulfillment. 2 medication(s).', link: '/dashboard/pharmacy/prescriptions' },
      { recipientId: pharmacist.id, type: 'INVENTORY_LOW', title: 'Low stock: Amoxicillin 500mg', message: 'Amoxicillin 500mg is below reorder level. Current: 12, Reorder at: 50. Please restock.', link: '/dashboard/pharmacy/inventory' },
      { recipientId: receptionist.id, type: 'GENERAL', title: 'Patient registered: Kavitha Nair', message: 'Kavitha Nair has been registered. Schedule an appointment to assign a doctor.', link: '/dashboard/receptionist/appointments' },
    ],
  });
  console.log('  [+] Created 7 staff notifications');

  console.log('\n========================================');
  console.log('  H1MS Database Seeded Successfully!');
  console.log('========================================');
  console.log('');
  console.log('  Demo Credentials (all passwords: demo123)');
  console.log('  -------------------------------------------');
  console.log('  Doctor:       doctor@h1ms.com');
  console.log('  Nurse:        nurse@h1ms.com');
  console.log('  Receptionist: receptionist@h1ms.com');
  console.log('  Pharmacist:   pharmacist@h1ms.com');
  console.log('  Accountant:   accountant@h1ms.com');
  console.log('  Admin:        admin@h1ms.com');
  console.log('');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('[SEED] Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
