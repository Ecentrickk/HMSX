import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { renderToStream } from '@react-pdf/renderer';
import { HandoffPDF } from '@/shared/templates/HandoffPDF';
import { auth } from '@/server/config/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

    const pdfData = {
      nurseName: session.user.name,
      occupiedBeds,
      pendingMeds
    };

    const stream = await renderToStream(React.createElement(HandoffPDF, { data: pdfData }) as any);

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="shift_handoff_${Date.now()}.pdf"`
      }
    });
  } catch (error) {
    console.error('Handoff PDF Generation Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
