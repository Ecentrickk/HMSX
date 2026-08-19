import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { renderToStream } from '@react-pdf/renderer';
import { ReportPDF } from '@/shared/templates/ReportPDF';
import { auth } from '@/server/config/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: { patient: true, doctor: true }
    });

    if (!report) return new NextResponse('Report not found', { status: 404 });

    const pdfData = {
      id: report.id,
      title: report.title,
      content: report.content,
      type: report.type,
      createdAt: report.createdAt,
      isSigned: report.isSigned,
      patient: { name: report.patient.name },
      doctor: { name: report.doctor.name }
    };

    const stream = await renderToStream(React.createElement(ReportPDF, { data: pdfData }) as any);

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="report_${report.id.slice(-6)}.pdf"`
      }
    });
  } catch (error) {
    console.error('Report PDF Generation Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
