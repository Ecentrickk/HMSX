import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { billingCreateSchema, parseBody } from '@/server/validations/schemas';
import { logger } from '@/server/config/logger';

// ─── Helper: generate invoice number ─────────────────────
function generateInvoiceNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${date}-${rand}`;
}

// GET /api/receptionist/billing — List all billings with line-item breakdown
export const GET = withAuth(async () => {
  try {
    const billings = await prisma.billing.findMany({
      include: {
        patient: { select: { name: true, phone: true } },
        appointment: { select: { type: true, scheduledAt: true } },
        generatedBy: { select: { name: true } },
        lineItems: {
          include: {
            service: { select: { code: true, category: true, unit: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ billings });
  } catch (error) {
    logger.error('[API] Billing fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch billings' }, { status: 500 });
  }
}, ['RECEPTIONIST', 'ADMIN', 'ACCOUNTANT']);

// POST /api/receptionist/billing — Create a billing record with service line items
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const parsed = parseBody(billingCreateSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const data = parsed.data;

    // Look up each service and calculate totals
    const serviceIds = data.lineItems.map((li) => li.serviceId);
    const services = await prisma.hospitalService.findMany({
      where: { id: { in: serviceIds }, isActive: true },
    });

    const serviceMap = new Map(services.map((s) => [s.id, s]));

    // Validate all services exist
    for (const li of data.lineItems) {
      if (!serviceMap.has(li.serviceId)) {
        return NextResponse.json(
          { error: `Service not found or inactive: ${li.serviceId}` },
          { status: 400 }
        );
      }
    }

    // Calculate line item totals
    let subtotal = 0;
    let taxTotal = 0;
    const lineItemsData = data.lineItems.map((li) => {
      const svc = serviceMap.get(li.serviceId)!;
      const unitPrice = li.unitPrice !== undefined ? li.unitPrice : svc.unitPrice;
      const lineSubtotal = unitPrice * li.quantity;
      const lineDiscount = li.discount || 0;
      const taxableAmount = lineSubtotal - lineDiscount;
      const lineTax = taxableAmount * (svc.taxRate / 100);
      const lineTotal = taxableAmount + lineTax;

      subtotal += lineSubtotal;
      taxTotal += lineTax;

      return {
        serviceId: svc.id,
        serviceName: svc.name,
        quantity: li.quantity,
        unitPrice: unitPrice,
        discount: lineDiscount,
        taxAmount: Math.round(lineTax * 100) / 100,
        totalAmount: Math.round(lineTotal * 100) / 100,
        notes: li.notes || null,
      };
    });

    const overallDiscount = data.discount || 0;
    const totalAmount = Math.round((subtotal + taxTotal - overallDiscount) * 100) / 100;

    // Create billing with line items
    const billing = await prisma.billing.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        patientId: data.patientId,
        appointmentId: data.appointmentId || null,
        admissionId: data.admissionId || null,
        items: data.lineItems.map((li) => serviceMap.get(li.serviceId)!.name),
        totalAmount,
        discount: overallDiscount,
        taxTotal: Math.round(taxTotal * 100) / 100,
        paymentMethod: data.paymentMethod || null,
        generatedById: session.user.id,
        lineItems: {
          create: lineItemsData,
        },
      },
      include: {
        patient: { select: { name: true, phone: true } },
        lineItems: {
          include: {
            service: { select: { code: true, category: true, unit: true } },
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BILLING_CREATED',
        entity: 'Billing',
        entityId: billing.id,
        details: {
          invoiceNumber: billing.invoiceNumber,
          patientName: billing.patient.name,
          amount: billing.totalAmount,
          services: lineItemsData.map((l) => l.serviceName),
        },
      },
    });

    logger.info(`[Billing] Invoice ${billing.invoiceNumber} created for ${billing.patient.name} — ₹${billing.totalAmount}`);

    return NextResponse.json({ billing }, { status: 201 });
  } catch (error) {
    logger.error('[API] Billing create error:', error);
    return NextResponse.json({ error: 'Failed to create billing' }, { status: 500 });
  }
}, ['RECEPTIONIST', 'ADMIN']);

// PATCH /api/receptionist/billing — Update billing status / payment
export const PATCH = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const { billingId, status, paidAmount, paymentMethod } = body;

    if (!billingId) {
      return NextResponse.json({ error: 'Billing ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paidAmount !== undefined) updateData.paidAmount = parseFloat(paidAmount);
    if (paymentMethod) updateData.paymentMethod = paymentMethod;

    // If paying full amount, auto-set status to PAID
    if (paidAmount !== undefined && status === 'PAID') {
      const existing = await prisma.billing.findUnique({ where: { id: billingId } });
      if (existing) {
        updateData.paidAmount = existing.totalAmount;
      }
    }

    const billing = await prisma.billing.update({
      where: { id: billingId },
      data: updateData,
      include: { patient: { select: { name: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BILLING_UPDATED',
        entity: 'Billing',
        entityId: billingId,
        details: { status: billing.status, paidAmount: billing.paidAmount, patientName: billing.patient.name },
      },
    });

    return NextResponse.json({ billing });
  } catch (error) {
    logger.error('[API] Billing update error:', error);
    return NextResponse.json({ error: 'Failed to update billing' }, { status: 500 });
  }
}, ['RECEPTIONIST', 'ADMIN']);
