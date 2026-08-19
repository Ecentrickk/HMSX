import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { auth } from '@/server/config/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'NURSE' && session.user.role !== 'ADMIN')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [occupiedBeds, pendingMeds] = await Promise.all([
      prisma.bed.findMany({
        where: { status: 'OCCUPIED' },
        include: { patient: { select: { name: true } }, ward: { select: { name: true } } },
        orderBy: { bedNumber: 'asc' }
      }),
      prisma.medicationSchedule.findMany({
        where: { 
          status: 'PENDING',
          scheduledTime: { gte: startOfToday }
        },
        include: { patient: { select: { name: true } } },
        orderBy: { scheduledTime: 'asc' }
      })
    ]);

    return NextResponse.json({ occupiedBeds, pendingMeds });
  } catch (error) {
    console.error('Failed to fetch handoff data:', error);
    return NextResponse.json({ error: 'Failed to fetch handoff data' }, { status: 500 });
  }
}
