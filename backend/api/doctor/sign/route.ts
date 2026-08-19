import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { auth } from '@/server/config/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'DOCTOR') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { type, id } = await req.json();

    if (type === 'prescription') {
      await prisma.prescription.update({
        where: { id, doctorId: session.user.id },
        data: { isSigned: true, signedAt: new Date() }
      });
    } else if (type === 'report') {
      await prisma.report.update({
        where: { id, doctorId: session.user.id },
        data: { isSigned: true, signedAt: new Date(), isLocked: true }
      });
    } else {
      return new NextResponse('Invalid type', { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Signing error:', error);
    return NextResponse.json({ error: 'Failed to sign document' }, { status: 500 });
  }
}
