import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { renderToStream } from '@react-pdf/renderer';
import { FullRecordPDF } from '@/shared/templates/FullRecordPDF';
import { auth } from '@/server/config/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: {
        appointments: { orderBy: { scheduledAt: 'desc' }, take: 5, include: { doctor: true } },
        prescriptions: { orderBy: { createdAt: 'desc' }, take: 5, include: { doctor: true, medications: true } },
        reports: { orderBy: { createdAt: 'desc' }, take: 5, include: { doctor: true } },
      }
    });

    if (!patient) return new NextResponse('Patient not found', { status: 404 });

    const age = Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / 31557600000);

    const pdfData = {
      patient,
      age,
      appointments: patient.appointments,
      prescriptions: patient.prescriptions,
      reports: patient.reports
    };

    const stream = await renderToStream(React.createElement(FullRecordPDF, { data: pdfData }) as any);

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="record_${patient.id.slice(-6)}.pdf"`
      }
    });
  } catch (error) {
    console.error('Record PDF Generation Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
