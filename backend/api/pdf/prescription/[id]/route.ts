import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { renderToStream } from '@react-pdf/renderer';
import { PrescriptionPDF } from '@/shared/templates/PrescriptionPDF';
import { auth } from '@/server/config/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        doctor: true,
        medications: true,
      }
    });

    if (!prescription) {
      return new NextResponse('Prescription not found', { status: 404 });
    }

    // Calculate age for the template
    const age = Math.floor((new Date().getTime() - new Date(prescription.patient.dateOfBirth).getTime()) / 31557600000);

    const pdfData = {
      id: prescription.id,
      createdAt: prescription.createdAt,
      patient: {
        name: prescription.patient.name,
        age,
        gender: prescription.patient.gender
      },
      doctor: {
        name: prescription.doctor.name,
        department: prescription.doctor.department || 'Medical Officer'
      },
      medications: prescription.medications,
      notes: prescription.notes || undefined
    };

    // Render the React component to a PDF stream
    const stream = await renderToStream(React.createElement(PrescriptionPDF, { data: pdfData }) as any);

    // Next.js NextResponse can accept standard Node.js readable streams
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="prescription_${prescription.id.slice(-6)}.pdf"`
      }
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
