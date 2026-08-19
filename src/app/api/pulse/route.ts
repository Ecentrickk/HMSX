import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';

/**
 * Webhook for Medical Hardware (LAN)
 * Medical devices like patient monitors can be configured to POST JSON payloads to this local endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    // API Key verification for hardware (In a real scenario, the LAN router/switch might restrict this, 
    // or the hardware daemon will have an API key configured)
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== process.env.HARDWARE_API_KEY && process.env.NODE_ENV === 'production') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { patientId, heartRate, oxygenSat, bloodPressureSystolic, bloodPressureDiastolic, temp } = await req.json();

    if (!patientId) {
      return new NextResponse('Missing patientId', { status: 400 });
    }

    // Since recordedById is required by schema, we will find an ADMIN or SYSTEM user to attribute the hardware log to
    let systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!systemUser) systemUser = await prisma.user.findFirst(); // Fallback

    if (!systemUser) {
      return new NextResponse('System user not found for recording', { status: 500 });
    }

    // Record the live vitals directly to the database.
    // NOTE: For true real-time (60fps), you would bypass the DB and pipe this directly to a Redis Pub/Sub 
    // or WebSocket server. We are storing it here as a historical record.
    await prisma.vitals.create({
      data: {
        patient: { connect: { id: patientId } },
        recordedBy: { connect: { id: systemUser.id } },
        heartRate: heartRate || null,
        oxygenSat: oxygenSat || null,
        bloodPressureSystolic: bloodPressureSystolic || null,
        bloodPressureDiastolic: bloodPressureDiastolic || null,
        recordedAt: new Date()
      }
    });

    console.log(`[Hardware Pulse] Recorded vitals for patient ${patientId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Hardware Pulse Error:', error);
    return NextResponse.json({ error: 'Failed to record vitals' }, { status: 500 });
  }
}
