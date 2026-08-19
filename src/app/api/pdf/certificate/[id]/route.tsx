import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { renderToStream } from '@react-pdf/renderer';
import { BirthCertificatePDF } from '@/shared/templates/BirthCertificatePDF';
import { DeathCertificatePDF } from '@/shared/templates/DeathCertificatePDF';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        patient: true,
        issuedBy: true,
        signedBy: true,
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    if (!certificate.isSigned) {
      return NextResponse.json({ error: 'Certificate is not signed yet' }, { status: 400 });
    }

    let stream;
    if (certificate.type === 'BIRTH') {
      stream = await renderToStream(<BirthCertificatePDF data={certificate} />);
    } else if (certificate.type === 'DEATH') {
      stream = await renderToStream(<DeathCertificatePDF data={certificate} />);
    } else {
      return NextResponse.json({ error: 'Unsupported certificate type for PDF' }, { status: 400 });
    }

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Certificate_${certificate.certificateNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[PDF] Error generating certificate:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
