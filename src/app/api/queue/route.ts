import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { logger } from '@/server/config/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get beginning and end of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        }
      },
      select: {
        id: true,
        status: true,
        type: true,
        scheduledAt: true,
        patient: { select: { name: true } },
        doctor: { select: { name: true, department: true } },
      },
      orderBy: [
        // Emergencies get priority sort
        { type: 'asc' }, 
        { scheduledAt: 'asc' }
      ]
    });

    // Group by Department and then Doctor for the queue display
    const queue = appointments.reduce((acc: any, curr) => {
      const dept = curr.doctor.department || 'General';
      if (!acc[dept]) acc[dept] = {};

      const docName = `Dr. ${curr.doctor.name}`;
      if (!acc[dept][docName]) acc[dept][docName] = [];
      
      const isEmergency = curr.type === 'EMERGENCY';
      
      // Calculate estimated wait time (very rough heuristic: 15 mins per patient ahead of them in SCHEDULED state)
      // For a real hospital, this would be much more complex.
      const patientsAhead = acc[dept][docName].filter((p: any) => p.status === 'SCHEDULED' && !p.isEmergency).length;
      const waitTimeMins = isEmergency ? 0 : patientsAhead * 15;

      acc[dept][docName].push({
        token: curr.id.slice(-4).toUpperCase(),
        patient: curr.patient.name,
        time: new Date(curr.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: curr.status,
        isEmergency,
        estimatedWaitMins: waitTimeMins
      });
      return acc;
    }, {});

    return NextResponse.json({ queue });
  } catch (error) {
    logger.error('[API] Failed to fetch queue:', error);
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
  }
}
