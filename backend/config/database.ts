import { PrismaClient } from '@prisma/client';
import { registerNotificationObservers } from '@/server/services/notification.observers';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  observersRegistered: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Register notification observers once on startup
if (!globalForPrisma.observersRegistered) {
  registerNotificationObservers();
  globalForPrisma.observersRegistered = true;
}

// ─── Immutable Signed Records Helper ─────────────────────
// Since Prisma v6 removed $use middleware, we enforce immutability
// at the API route level using this guard function.
export async function guardSignedRecord(
  model: 'report' | 'prescription',
  id: string
): Promise<void> {
  const record = model === 'report'
    ? await prisma.report.findUnique({ where: { id }, select: { isSigned: true } })
    : await prisma.prescription.findUnique({ where: { id }, select: { isSigned: true } });

  if (record?.isSigned) {
    throw new Error(
      `Cannot modify a signed ${model}. Signed records are immutable.`
    );
  }
}
