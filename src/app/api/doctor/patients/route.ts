import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';

// GET /api/doctor/patients — Retrieve only THIS doctor's patients
// A patient belongs to a doctor if they have an appointment with them
export const GET = withAuth(async (req, { session }) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const all = searchParams.get('all') === 'true'; // ?all=true for full list

    // Build the where clause
    const where: any = {};

    // If not requesting all, only show patients with appointments for this doctor
    if (!all) {
      where.appointments = {
        some: { doctorId: session.user.id },
      };
    }

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const patients = await prisma.patient.findMany({
      where,
      include: {
        vitals: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
        appointments: {
          where: { doctorId: session.user.id },
          orderBy: { scheduledAt: 'desc' },
          take: 1,
          select: { id: true, scheduledAt: true, status: true, type: true },
        },
        admissions: {
          where: { status: 'ACTIVE' },
          orderBy: { admissionDate: 'desc' },
          take: 1,
          select: { admissionType: true, status: true },
        },
        diagnoses: {
          where: { doctorId: session.user.id },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        prescriptions: {
          where: { doctorId: session.user.id },
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: { medications: true },
        },
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ patients });
  } catch (error) {
    console.error('[API] Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}, ['DOCTOR', 'ADMIN']);
