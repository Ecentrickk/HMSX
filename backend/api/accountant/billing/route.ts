import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { billingCreateSchema, billingStatusSchema, billingPaymentSchema, parseBody } from '@/server/validations/schemas';
import { logger } from '@/server/config/logger';

// Invoice number generator: INV-YYYYMMDD-NNNNN
async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const count = await prisma.billing.count();
  const seq = String(count + 1).padStart(5, '0');
  return `INV-${date}-${seq}`;
}

// GET /api/accountant/billing — List billings with advanced filters
export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: any = {};
    if (status) where.status = status;
    if (patientId) where.patientId = patientId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const billings = await prisma.billing.findMany({
      where,
      include: {
        patient: { select: { name: true, phone: true } },
        appointment: { select: { type: true, scheduledAt: true } },
        generatedBy: { select: { name: true } },
        lineItems: {
          include: {
            service: { select: { name: true, code: true, category: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Aggregate stats
    const stats = {
      totalBilled: billings.reduce((sum, b) => sum + b.totalAmount, 0),
      totalPaid: billings.reduce((sum, b) => sum + b.paidAmount, 0),
      totalOutstanding: billings.reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0),
      count: billings.length,
    };

    return NextResponse.json({ billings, stats });
  } catch (error) {
    logger.error('[API] Billing fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch billings' }, { status: 500 });
  }
}, ['ACCOUNTANT', 'ADMIN', 'RECEPTIONIST']);

// POST /api/accountant/billing — Create billing with line items
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const parsed = parseBody(billingCreateSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { patientId, admissionId, appointmentId, lineItems, discount, paymentMethod } = parsed.data;

    // Resolve services and calculate totals
    const resolvedItems = await Promise.all(
      lineItems.map(async (item) => {
        const service = await prisma.hospitalService.findUnique({ where: { id: item.serviceId } });
        if (!service) throw new Error(`Service ${item.serviceId} not found`);
        if (!service.isActive) throw new Error(`Service "${service.name}" is inactive`);

        const subtotal = service.unitPrice * item.quantity;
        const taxAmount = subtotal * (service.taxRate / 100);
        const itemDiscount = item.discount || 0;
        const totalAmount = subtotal + taxAmount - itemDiscount;

        return {
          serviceId: service.id,
          serviceName: service.name,
          quantity: item.quantity,
          unitPrice: service.unitPrice,
          discount: itemDiscount,
          taxAmount,
          totalAmount,
          notes: item.notes || null,
        };
      })
    );

    const totalAmount = resolvedItems.reduce((sum, i) => sum + i.totalAmount, 0) - (discount || 0);
    const taxTotal = resolvedItems.reduce((sum, i) => sum + i.taxAmount, 0);
    const invoiceNumber = await generateInvoiceNumber();

    const billing = await prisma.billing.create({
      data: {
        invoiceNumber,
        patientId,
        admissionId: admissionId || null,
        appointmentId: appointmentId || null,
        totalAmount,
        discount: discount || 0,
        taxTotal,
        paymentMethod: paymentMethod || null,
        generatedById: session.user.id,
        lineItems: {
          create: resolvedItems,
        },
      },
      include: {
        patient: { select: { name: true } },
        lineItems: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BILLING_CREATED',
        entity: 'Billing',
        entityId: billing.id,
        details: {
          invoiceNumber,
          patientName: billing.patient.name,
          amount: totalAmount,
          itemCount: resolvedItems.length,
        },
      },
    });

    logger.info(`[Billing] Invoice ${invoiceNumber} created: ₹${totalAmount} for ${billing.patient.name}`);

    return NextResponse.json({ billing }, { status: 201 });
  } catch (error: any) {
    logger.error('[API] Billing create error:', error);
    const message = error.message?.includes('not found') || error.message?.includes('inactive')
      ? error.message
      : 'Failed to create billing';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}, ['ACCOUNTANT', 'ADMIN', 'RECEPTIONIST']);

// PATCH /api/accountant/billing — Record payment or update status
export const PATCH = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();

    // Handle payment recording
    if (body.amount) {
      const parsed = parseBody(billingPaymentSchema, body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }

      const { billingId, amount, paymentMethod } = parsed.data;

      const existing = await prisma.billing.findUnique({ where: { id: billingId } });
      if (!existing) {
        return NextResponse.json({ error: 'Billing not found' }, { status: 404 });
      }

      const newPaidAmount = existing.paidAmount + amount;
      const newStatus = newPaidAmount >= existing.totalAmount ? 'PAID' : 'PARTIALLY_PAID';

      const billing = await prisma.billing.update({
        where: { id: billingId },
        data: {
          paidAmount: newPaidAmount,
          paymentMethod,
          status: newStatus,
        },
        include: { patient: { select: { name: true } } },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PAYMENT_RECORDED',
          entity: 'Billing',
          entityId: billingId,
          details: { amount, paymentMethod, newTotal: newPaidAmount, status: newStatus },
        },
      });

      return NextResponse.json({ billing });
    }

    // Handle status update
    const parsed = parseBody(billingStatusSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { billingId, status } = parsed.data;

    const billing = await prisma.billing.update({
      where: { id: billingId },
      data: { status },
      include: { patient: { select: { name: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BILLING_STATUS_UPDATED',
        entity: 'Billing',
        entityId: billingId,
        details: { status, patientName: billing.patient.name },
      },
    });

    return NextResponse.json({ billing });
  } catch (error) {
    logger.error('[API] Billing update error:', error);
    return NextResponse.json({ error: 'Failed to update billing' }, { status: 500 });
  }
}, ['ACCOUNTANT', 'ADMIN']);
