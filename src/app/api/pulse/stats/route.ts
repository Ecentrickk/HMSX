import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { auth } from '@/server/config/auth';

export const dynamic = 'force-dynamic';

// GET /api/pulse/stats — aggregated dashboard stats
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      patientCount,
      appointmentsToday,
      completedToday,
      staffOnDuty,
      totalBeds,
      occupiedBeds,
      recentAppointments,
      activeStaff,
      wards,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.appointment.count({
        where: { scheduledAt: { gte: today, lt: tomorrow } },
      }),
      prisma.appointment.count({
        where: { scheduledAt: { gte: today, lt: tomorrow }, status: 'COMPLETED' },
      }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.bed.count(),
      prisma.bed.count({ where: { status: 'OCCUPIED' } }),
      prisma.appointment.findMany({
        where: { scheduledAt: { gte: today, lt: tomorrow } },
        include: {
          patient: { select: { name: true } },
          doctor: { select: { name: true, department: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
      }),
      prisma.user.findMany({
        where: { isActive: true },
        select: { name: true, role: true, department: true },
        take: 12,
      }),
      prisma.ward.findMany({
        include: { beds: { select: { status: true } } },
      }),
    ]);

    const wardStats = wards.map(w => ({
      name: w.name,
      floor: w.floor,
      type: w.type,
      total: w.beds.length,
      occupied: w.beds.filter(b => b.status === 'OCCUPIED').length,
    }));

    return NextResponse.json({
      stats: {
        activePatients: patientCount,
        appointmentsToday,
        completedAppointments: completedToday,
        staffOnDuty,
        totalBeds,
        occupiedBeds,
      },
      appointments: recentAppointments.map(a => ({
        patient: a.patient.name,
        doctor: a.doctor.name,
        time: a.scheduledAt,
        type: a.type,
        status: a.status,
      })),
      staff: activeStaff.map(s => ({
        name: s.name,
        role: s.role,
        department: s.department || 'General',
        status: 'online',
      })),
      wards: wardStats,
    });
  } catch (error) {
    console.error('Pulse stats error:', error);
    return NextResponse.json({
      stats: { activePatients: 0, appointmentsToday: 0, completedAppointments: 0, staffOnDuty: 0, totalBeds: 0, occupiedBeds: 0 },
      appointments: [],
      staff: [],
      wards: [],
    });
  }
}
