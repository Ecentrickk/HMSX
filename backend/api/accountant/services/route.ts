import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import { serviceCreateSchema, serviceUpdateSchema, parseBody } from '@/server/validations/schemas';
import { logger } from '@/server/config/logger';

// GET /api/accountant/services — List hospital services
export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('active') !== 'false';

    const where: any = {};
    if (category) where.category = category;
    if (activeOnly) where.isActive = true;

    const services = await prisma.hospitalService.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ services });
  } catch (error) {
    logger.error('[API] Services fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}, ['ACCOUNTANT', 'ADMIN', 'RECEPTIONIST']);

// POST /api/accountant/services — Create a new service
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const parsed = parseBody(serviceCreateSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const data = parsed.data;

    // Check for duplicate code
    const existing = await prisma.hospitalService.findUnique({ where: { code: data.code } });
    if (existing) {
      return NextResponse.json({ error: `Service code "${data.code}" already exists` }, { status: 409 });
    }

    const service = await prisma.hospitalService.create({
      data: {
        name: data.name,
        code: data.code,
        category: data.category,
        unitPrice: data.unitPrice,
        unit: data.unit,
        description: data.description || null,
        department: data.department || null,
        taxRate: data.taxRate || 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SERVICE_CREATED',
        entity: 'HospitalService',
        entityId: service.id,
        details: { name: data.name, code: data.code, price: data.unitPrice },
      },
    });

    logger.info(`[Service] Created: ${data.name} (${data.code}) @ ₹${data.unitPrice}`);

    return NextResponse.json({ service }, { status: 201 });
  } catch (error: any) {
    logger.error('[API] Service create error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A service with this code already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}, ['ACCOUNTANT', 'ADMIN', 'RECEPTIONIST']);

// PATCH /api/accountant/services — Update a service
export const PATCH = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const parsed = parseBody(serviceUpdateSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { serviceId, ...updates } = parsed.data;

    const service = await prisma.hospitalService.update({
      where: { id: serviceId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.unitPrice !== undefined && { unitPrice: updates.unitPrice }),
        ...(updates.unit && { unit: updates.unit }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.department !== undefined && { department: updates.department }),
        ...(updates.taxRate !== undefined && { taxRate: updates.taxRate }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: updates.isActive === false ? 'SERVICE_DEACTIVATED' : 'SERVICE_UPDATED',
        entity: 'HospitalService',
        entityId: serviceId,
        details: updates,
      },
    });

    return NextResponse.json({ service });
  } catch (error) {
    logger.error('[API] Service update error:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}, ['ACCOUNTANT', 'ADMIN']);

// DELETE /api/accountant/services — Soft-delete (deactivate) a service
export const DELETE = withAuth(async (req, { session }) => {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get('id');

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const service = await prisma.hospitalService.update({
      where: { id: serviceId },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SERVICE_DEACTIVATED',
        entity: 'HospitalService',
        entityId: serviceId,
        details: { name: service.name, code: service.code },
      },
    });

    return NextResponse.json({ service });
  } catch (error) {
    logger.error('[API] Service delete error:', error);
    return NextResponse.json({ error: 'Failed to deactivate service' }, { status: 500 });
  }
}, ['ACCOUNTANT', 'ADMIN']);
