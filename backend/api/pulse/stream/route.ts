import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';

// GET /api/pulse/stream — Server-Sent Events for real-time dashboard
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Initial data burst
      try {
        const [
          patientCount,
          appointmentsToday,
          availableBeds,
          occupiedBeds,
          staffOnDuty,
        ] = await Promise.all([
          prisma.patient.count(),
          prisma.appointment.count({
            where: {
              scheduledAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lt: new Date(new Date().setHours(23, 59, 59, 999)),
              },
            },
          }),
          prisma.bed.count({ where: { status: 'AVAILABLE' } }),
          prisma.bed.count({ where: { status: 'OCCUPIED' } }),
          prisma.user.count({ where: { isActive: true } }),
        ]);

        sendEvent({
          type: 'pulse_update',
          data: {
            activePatients: patientCount,
            appointmentsToday,
            bedStats: { available: availableBeds, occupied: occupiedBeds },
            staffOnDuty,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        sendEvent({
          type: 'pulse_update',
          data: {
            activePatients: 0,
            appointmentsToday: 0,
            bedStats: { available: 0, occupied: 0 },
            staffOnDuty: 0,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Periodic updates every 10 seconds
      const interval = setInterval(() => {
        sendEvent({
          type: 'heartbeat',
          data: { timestamp: new Date().toISOString() },
        });
      }, 10000);

      // Clean up on disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
