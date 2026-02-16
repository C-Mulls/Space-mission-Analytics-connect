import { PrismaClient } from '@prisma/client';

/**
 * Resolve database URL from common provider env vars.
 * Prisma schema uses env("DATABASE_URL"), so we set it if we resolved from another name.
 */
const dbUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.POSTGRES_PRISMA_URL?.trim() ||
  process.env.POSTGRES_URL?.trim() ||
  '';

if (dbUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = dbUrl;
}

export const isDatabaseConfigured = Boolean(dbUrl);

if (!isDatabaseConfigured) {
  console.error(
    '[Prisma] No database URL found. Set one of: DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL. ' +
      'On Vercel: add DATABASE_URL (or link Vercel Postgres) in Project Settings → Environment Variables, then redeploy. ' +
      'Locally: set DATABASE_URL in .env or .env.local.'
  );
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
