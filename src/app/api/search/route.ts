import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { auth } from '@/server/config/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchStr = q.toLowerCase();

    // Execute parallel searches across domains using Prisma
    // We limit to 5 per domain to keep the UI snappy and relevant
    const [patients, appointments, prescriptions, staff] = await Promise.all([
      // Search Patients (by name or phone)
      prisma.patient.findMany({
        where: {
          OR: [
            { name: { contains: searchStr, mode: 'insensitive' } },
            { phone: { contains: searchStr, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: { id: true, name: true, phone: true }
      }),

      // Search Appointments (by ID or patient name)
      prisma.appointment.findMany({
        where: {
          OR: [
            { id: { contains: searchStr, mode: 'insensitive' } },
            { patient: { name: { contains: searchStr, mode: 'insensitive' } } }
          ]
        },
        take: 5,
        select: { id: true, scheduledAt: true, type: true, patient: { select: { name: true } } }
      }),

      // Search Prescriptions (by medication name)
      prisma.prescription.findMany({
        where: {
          medications: {
            some: {
              name: { contains: searchStr, mode: 'insensitive' }
            }
          }
        },
        take: 5,
        select: { id: true, patient: { select: { name: true } } }
      }).catch(() => []), // Fallback

      // Search Staff (by name or role)
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchStr, mode: 'insensitive' } },
            { email: { contains: searchStr, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: { id: true, name: true, role: true }
      })
    ]);

    // Format results for the Command Palette
    const results = [
      ...patients.map((p) => ({
        id: `p_${p.id}`,
        title: p.name,
        subtitle: `Phone: ${p.phone}`,
        type: 'PATIENT',
        url: `/dashboard/patient/${p.id}`
      })),
      ...appointments.map((a: any) => ({
        id: `a_${a.id}`,
        title: `Appointment with ${a.patient?.name}`,
        subtitle: `${new Date(a.scheduledAt).toLocaleDateString()} - ${a.type}`,
        type: 'APPOINTMENT',
        url: `/dashboard/receptionist/appointments?id=${a.id}`
      })),
      ...prescriptions.map((px: any) => ({
        id: `px_${px.id}`,
        title: `Prescription for ${px.patient?.name}`,
        subtitle: `Prescription ID: ${px.id.slice(-6)}`,
        type: 'PRESCRIPTION',
        url: `/dashboard/pharmacy/prescriptions/${px.id}`
      })),
      ...staff.map((s) => ({
        id: `s_${s.id}`,
        title: s.name,
        subtitle: s.role,
        type: 'STAFF',
        url: `/dashboard/admin/users?id=${s.id}`
      }))
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
