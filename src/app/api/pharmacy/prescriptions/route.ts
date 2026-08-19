import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { notificationEngine, HospitalEvent } from '@/server/services/notification.engine';

// GET /api/pharmacy/prescriptions — Get prescription queue (medications only, NO diagnosis)
export const GET = withAuth(async (req, { session }) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { isSigned: true },
      // ENCAPSULATION: Only select medication-related fields
      // diagnosisString is NEVER included in pharmacist queries
      select: {
        id: true,
        patientId: true,
        signedAt: true,
        isSigned: true,
        notes: true,
        createdAt: true,
        patient: {
          select: {
            name: true,
            phone: true,
            // NO medical history, NO diagnosis, NO vitals
          },
        },
        doctor: {
          select: {
            name: true,
            department: true,
          },
        },
        medications: {
          select: {
            id: true,
            name: true,
            dosage: true,
            frequency: true,
            duration: true,
            instructions: true,
          },
        },
        // BLOCKED: No diagnosis relation included
        // Pharmacist cannot access diagnosisString
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ prescriptions });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  }
}, ['PHARMACIST', 'ADMIN']);

// POST /api/pharmacy/prescriptions — Mark prescription as fulfilled
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const { prescriptionId, medicationIds } = body;

    // Record inventory transactions for each fulfilled medication
    for (const medId of medicationIds) {
      const medication = await prisma.medicationItem.findUnique({
        where: { id: medId },
      });

      if (medication) {
        // Find matching inventory item
        const inventoryItem = await prisma.inventoryItem.findFirst({
          where: {
            name: { contains: medication.name.split(' ')[0], mode: 'insensitive' },
            category: 'MEDICATION',
          },
        });

        if (inventoryItem) {
          await prisma.inventoryTransaction.create({
            data: {
              itemId: inventoryItem.id,
              type: 'STOCK_OUT',
              quantity: 1,
              prescriptionId,
              performedById: session.user.id,
              notes: `Dispensed for prescription ${prescriptionId}`,
            },
          });

          // Deduct from inventory
          const updated = await prisma.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: { quantity: { decrement: 1 } },
          });

          // Check if inventory is low → emit INVENTORY_LOW event
          if (updated.quantity <= updated.reorderLevel) {
            await notificationEngine.emit(HospitalEvent.INVENTORY_LOW, {
              itemId: updated.id,
              itemName: updated.name,
              currentQty: updated.quantity,
              reorderLevel: updated.reorderLevel,
            });
          }
        }
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PRESCRIPTION_FULFILLED',
        entity: 'Prescription',
        entityId: prescriptionId,
        details: { medicationIds },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fulfill prescription' },
      { status: 500 }
    );
  }
}, ['PHARMACIST', 'ADMIN']);
