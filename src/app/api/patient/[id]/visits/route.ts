import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { logger } from '@/server/config/logger';

// GET /api/patient/[id]/visits — Get complete 360° patient profile and visit history
export const GET = withAuth(async (req, { params }) => {
  try {
    const { id } = await params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        // Active admission (if any)
        admissions: {
          where: { status: 'ACTIVE' },
          include: { attendingDoctor: { select: { name: true } } },
        },
        // Medical history
        medicalHistories: {
          orderBy: { date: 'desc' },
          include: { recordedBy: { select: { name: true } } },
        },
        // All past admissions/visits
        appointments: {
          orderBy: { scheduledAt: 'desc' },
          include: { doctor: { select: { name: true, department: true } } },
        },
        // Clinical data
        diagnoses: { orderBy: { createdAt: 'desc' }, include: { doctor: { select: { name: true } } } },
        prescriptions: { orderBy: { createdAt: 'desc' }, include: { doctor: { select: { name: true } } } },
        vitals: { orderBy: { recordedAt: 'desc' }, include: { recordedBy: { select: { name: true } } }, take: 10 },
        reports: { orderBy: { createdAt: 'desc' }, include: { doctor: { select: { name: true } } } },
        certificates: { orderBy: { createdAt: 'desc' }, include: { issuedBy: { select: { name: true } } } },
        // Billing
        billings: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Process data for the 360 view
    const allergies = patient.medicalHistories.filter(h => h.category === 'ALLERGY');
    const chronicConditions = patient.medicalHistories.filter(h => h.category === 'CHRONIC_CONDITION');
    const activeAdmission = patient.admissions.length > 0 ? patient.admissions[0] : null;

    const stats = {
      totalVisits: patient.appointments.length + (patient.admissions.length || 0),
      totalBilled: patient.billings.reduce((sum, b) => sum + b.totalAmount, 0),
      totalOutstanding: patient.billings.reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0),
      lastVisitDate: patient.appointments.length > 0 ? patient.appointments[0].scheduledAt : patient.createdAt,
    };

    return NextResponse.json({
      patient: {
        id: patient.id,
        uhid: patient.uhid,
        name: patient.name,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth,
        bloodGroup: patient.bloodGroup,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        emergencyPhone: patient.emergencyPhone,
        createdAt: patient.createdAt,
      },
      stats,
      activeAdmission,
      alerts: {
        allergies,
        chronicConditions,
      },
      timeline: {
        appointments: patient.appointments,
        diagnoses: patient.diagnoses,
        prescriptions: patient.prescriptions,
        vitals: patient.vitals,
        reports: patient.reports,
        certificates: patient.certificates,
        billings: patient.billings,
      },
    });
  } catch (error) {
    logger.error('[API] Patient 360 profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch patient profile' }, { status: 500 });
  }
}, ['DOCTOR', 'NURSE', 'ADMIN', 'RECEPTIONIST']);
