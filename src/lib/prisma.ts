import { PrismaClient } from '@prisma/client';

export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL?.trim());

if (!isDatabaseConfigured) {
  console.error(
    '[Prisma] DATABASE_URL is not set. Auth and data features will be disabled. ' +
      'Set DATABASE_URL in Vercel project settings or in .env.local for local dev.'
  );
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
