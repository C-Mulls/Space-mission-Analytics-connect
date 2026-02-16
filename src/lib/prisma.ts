import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL?.trim()) {
  console.error(
    '[Prisma] DATABASE_URL is not set. NextAuth cannot persist sessions and login will redirect to /login with error=Callback. ' +
      'Set DATABASE_URL in .env.local. For local Postgres via Docker: docker compose up -d then DATABASE_URL=postgresql://spacemission:spacemission@localhost:5432/spacemission?schema=public'
  );
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
