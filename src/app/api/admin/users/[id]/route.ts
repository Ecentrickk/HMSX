import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import bcrypt from 'bcryptjs';

// PATCH /api/admin/users/[id] — update user
export const PATCH = withAuth(async (req, { session, params }) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, role, department, phone, isActive, password } = body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role;
    if (department !== undefined) data.department = department;
    if (phone !== undefined) data.phone = phone;
    if (isActive !== undefined) data.isActive = isActive;
    if (password) data.passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, department: true, isActive: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_UPDATED',
        entity: 'User',
        entityId: id,
        details: { changes: Object.keys(data) },
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}, ['ADMIN']);

// DELETE /api/admin/users/[id] — deactivate user
export const DELETE = withAuth(async (req, { session, params }) => {
  try {
    const { id } = await params;

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_DEACTIVATED',
        entity: 'User',
        entityId: id,
        details: {},
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
  }
}, ['ADMIN']);
