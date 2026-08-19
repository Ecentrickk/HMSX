import { NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { withAuth } from '@/server/services/rbac.service';
import bcrypt from 'bcryptjs';

// GET /api/admin/users — list all users
export const GET = withAuth(async () => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}, ['ADMIN']);

// POST /api/admin/users — create a new user
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const { name, email, password, role, department, phone } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password, and role are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        department: department || null,
        phone: phone || null,
      },
      select: {
        id: true, name: true, email: true, role: true, department: true, isActive: true, createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_CREATED',
        entity: 'User',
        entityId: user.id,
        details: { name: user.name, email: user.email, role: user.role },
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}, ['ADMIN']);
