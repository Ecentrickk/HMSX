import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';

export const GET = withAuth(async () => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR', isActive: true },
      select: { id: true, name: true, department: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ doctors });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
  }
}, ['RECEPTIONIST', 'ADMIN', 'DOCTOR', 'NURSE']);
