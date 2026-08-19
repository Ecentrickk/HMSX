import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { auth } from '@/server/config/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const doctors = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        department: true,
      },
      orderBy: {
        name: 'asc',
      }
    });

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
  }
}
