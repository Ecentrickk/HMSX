import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { auth } from '@/server/config/auth';

// GET /api/notifications — Fetch current user's notifications
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const notifications = await prisma.staffNotification.findMany({
      where: { recipientId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PATCH /api/notifications — Mark notifications as read
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await prisma.staffNotification.updateMany({
        where: { recipientId: session.user.id, isRead: false },
        data: { isRead: true },
      });
    } else if (notificationId) {
      await prisma.staffNotification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
