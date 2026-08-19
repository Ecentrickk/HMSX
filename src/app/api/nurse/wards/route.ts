import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';

// GET /api/nurse/wards — Fetch wards with beds, patients, and latest vitals
export const GET = withAuth(async () => {
  try {
    const wards = await prisma.ward.findMany({
      include: {
        beds: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                vitals: {
                  orderBy: { recordedAt: 'desc' },
                  take: 1,
                  select: {
                    heartRate: true,
                    bloodPressureSystolic: true,
                    bloodPressureDiastolic: true,
                    oxygenSat: true,
                    temperature: true,
                    recordedAt: true,
                  },
                },
              },
            },
            assignedNurse: { select: { id: true, name: true } },
          },
          orderBy: { bedNumber: 'asc' },
        },
      },
      orderBy: { floor: 'asc' },
    });

    return NextResponse.json({ wards });
  } catch (error) {
    console.error('[API] Error fetching wards:', error);
    return NextResponse.json({ error: 'Failed to fetch wards' }, { status: 500 });
  }
}, ['NURSE', 'ADMIN', 'DOCTOR']);
