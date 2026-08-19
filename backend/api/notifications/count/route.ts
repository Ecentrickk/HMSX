import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { auth } from '@/server/config/auth';

export const dynamic = 'force-dynamic';

// GET /api/notifications/count — Lightweight unread count for TopBar badge
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const count = await prisma.staffNotification.count({
      where: { recipientId: session.user.id, isRead: false },
    });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
