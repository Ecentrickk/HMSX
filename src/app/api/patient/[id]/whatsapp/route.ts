import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { auth } from '@/server/config/auth';
import { WhatsAppService } from '@/server/services/whatsapp.service';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: params.id }
    });

    if (!patient) return new NextResponse('Patient not found', { status: 404 });

    // Since this is a local system, the API route to generate the PDF is on this server
    // We pass the absolute LAN URL for the local WhatsApp daemon to download
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const pdfUrl = `${protocol}://${host}/api/pdf/record/${patient.id}`;

    const message = `Hello ${patient.name},\nAttached is your requested Full Medical Record from ${process.env.HOSPITAL_NAME || 'Hospital'}.`;
    
    // Dispatch to local WhatsApp Gateway
    await WhatsAppService.sendMessage(patient.phone, message, pdfUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('WhatsApp dispatch error:', error);
    return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 });
  }
}
