import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';

// GET /api/admin/telemetry — Aggregate hospital stats
export const GET = withAuth(async () => {
  try {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Aggregate queries
    const [
      appointmentsThisWeek,
      appointmentsLastWeek,
      totalBeds,
      occupiedBeds,
      revenueThisWeek,
      revenueLastWeek,
      notificationsSent,
      dailyAppointments,
      inventoryItems,
    ] = await Promise.all([
      prisma.appointment.count({ where: { scheduledAt: { gte: weekAgo } } }),
      prisma.appointment.count({ where: { scheduledAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
      prisma.bed.count(),
      prisma.bed.count({ where: { status: 'OCCUPIED' } }),
      prisma.billing.aggregate({ where: { createdAt: { gte: weekAgo }, status: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.billing.aggregate({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo }, status: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.notification.count({ where: { createdAt: { gte: weekAgo } } }),
      // Daily appointment breakdown for the week
      Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const dayStart = new Date(now);
          dayStart.setDate(dayStart.getDate() - (6 - i));
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayEnd.getDate() + 1);
          return prisma.appointment.count({
            where: { scheduledAt: { gte: dayStart, lt: dayEnd } },
          }).then(count => ({
            day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
            value: count,
          }));
        })
      ),
      // Inventory burn rate (items with recent transactions)
      prisma.inventoryItem.findMany({
        where: { isActive: true },
        select: {
          name: true,
          quantity: true,
          reorderLevel: true,
          transactions: {
            where: { createdAt: { gte: weekAgo }, type: 'STOCK_OUT' },
            select: { quantity: true },
          },
        },
        take: 10,
      }),
    ]);

    const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const revenueThisWeekVal = revenueThisWeek._sum.totalAmount || 0;
    const revenueLastWeekVal = revenueLastWeek._sum.totalAmount || 0;
    const revenuePctChange = revenueLastWeekVal > 0
      ? Math.round(((revenueThisWeekVal - revenueLastWeekVal) / revenueLastWeekVal) * 100)
      : 0;
    const apptPctChange = appointmentsLastWeek > 0
      ? Math.round(((appointmentsThisWeek - appointmentsLastWeek) / appointmentsLastWeek) * 100)
      : 0;

    const avgAppointments = appointmentsThisWeek > 0
      ? Math.round((appointmentsThisWeek / 7) * 10) / 10
      : 0;

    const inventoryBurn = inventoryItems.map(item => ({
      item: item.name,
      rate: item.transactions.reduce((sum, t) => sum + t.quantity, 0),
      currentQty: item.quantity,
      reorderLevel: item.reorderLevel,
    })).sort((a, b) => b.rate - a.rate).slice(0, 5);

    return NextResponse.json({
      stats: {
        avgAppointmentsPerDay: avgAppointments,
        appointmentsPctChange: apptPctChange,
        bedOccupancy: occupancyPct,
        weeklyRevenue: revenueThisWeekVal,
        revenuePctChange,
        notificationsSent,
      },
      dailyAppointments,
      inventoryBurn,
    });
  } catch (error) {
    console.error('[API] Telemetry error:', error);
    return NextResponse.json({
      stats: { avgAppointmentsPerDay: 0, appointmentsPctChange: 0, bedOccupancy: 0, weeklyRevenue: 0, revenuePctChange: 0, notificationsSent: 0 },
      dailyAppointments: [],
      inventoryBurn: [],
    });
  }
}, ['ADMIN']);
