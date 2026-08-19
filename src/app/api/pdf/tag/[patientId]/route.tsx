import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { renderToStream } from '@react-pdf/renderer';
import { PatientTagPDF } from '@/shared/templates/PatientTagPDF';
import { auth } from '@/server/config/auth';
import QRCode from 'qrcode';

export async function GET(req: NextRequest, { params }: { params: { patientId: string } }) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: params.patientId }
    });

    if (!patient) return new NextResponse('Patient not found', { status: 404 });

    // Generate QR Code containing the Patient ID
    // In our system, scanning the ID routes to their unified profile which has all current/future reports
    const qrCodeBase64 = await QRCode.toDataURL(patient.id, {
      margin: 1,
      width: 150,
      color: { dark: '#000000', light: '#ffffff' }
    });

    const stream = await renderToStream(React.createElement(PatientTagPDF, { data: patient, qrCodeBase64 }) as any);

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="tag_${patient.name.replace(/\s+/g, '_')}.pdf"`
      }
    });
  } catch (error) {
    console.error('Patient Tag PDF Generation Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
