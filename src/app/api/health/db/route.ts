import { NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Health check for database connectivity. Does not leak secrets.
 * GET /api/health/db — returns { ok: true } if Prisma can connect, else { ok: false, error: "..." }
 */
export async function GET() {
  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { ok: false, error: 'Database URL not configured' },
      { status: 503 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Database connection failed' },
      { status: 503 }
    );
  }
}
