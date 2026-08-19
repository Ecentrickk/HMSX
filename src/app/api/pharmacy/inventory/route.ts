import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';

// GET /api/pharmacy/inventory — List inventory items
export const GET = withAuth(async (req, { session }) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const lowOnly = searchParams.get('lowOnly') === 'true';

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const result = lowOnly
      ? items.filter(i => i.quantity <= i.reorderLevel)
      : items;

    return NextResponse.json({ items: result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}, ['PHARMACIST', 'ADMIN']);

// POST /api/pharmacy/inventory — Add new inventory item
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const item = await prisma.inventoryItem.create({
      data: {
        name: body.name,
        category: body.category || 'MEDICATION',
        sku: body.sku,
        quantity: body.quantity || 0,
        unit: body.unit || 'units',
        reorderLevel: body.reorderLevel || 10,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        supplier: body.supplier,
        price: body.price || 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'INVENTORY_ITEM_CREATED',
        entity: 'InventoryItem',
        entityId: item.id,
        details: { name: item.name, quantity: item.quantity },
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}, ['PHARMACIST', 'ADMIN']);
