import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { isDatabaseConfigured } from '@/lib/prisma';

export const runtime = 'nodejs';

const handler = NextAuth(authOptions);

function authUnavailable() {
  return NextResponse.json(
    {
      error:
        'Auth is temporarily unavailable. Set DATABASE_URL (or POSTGRES_PRISMA_URL / POSTGRES_URL) in Vercel Project Settings → Environment Variables, then redeploy.',
    },
    { status: 503 }
  );
}

export async function GET(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  if (!isDatabaseConfigured) return authUnavailable();
  return handler(req, context);
}

export async function POST(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  if (!isDatabaseConfigured) return authUnavailable();
  return handler(req, context);
}
