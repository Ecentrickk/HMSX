import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { auth } from '@/server/config/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'DOCTOR') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { notes, status } = await req.json();

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        notes,
        status
      }
    });

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}
