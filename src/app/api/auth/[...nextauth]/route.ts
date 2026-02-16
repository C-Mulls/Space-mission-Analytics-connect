import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { isDatabaseConfigured } from '@/lib/prisma';

export const runtime = 'nodejs';

const handler = NextAuth(authOptions);

function authUnavailable() {
  return NextResponse.json(
    {
      error: 'Auth is temporarily unavailable. Database is not configured (DATABASE_URL missing). Add DATABASE_URL in Vercel project settings and redeploy.',
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
