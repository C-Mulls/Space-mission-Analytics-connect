/**
 * Temporary OAuth diagnostic endpoint. Remove or restrict in production.
 * GET /api/debug/oauth — only safe in development; do not log full secrets.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID ?? '';
  const clientSecretSet = Boolean(
    process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_SECRET.trim().length > 0
  );
  const nextAuthUrl = process.env.NEXTAUTH_URL ?? '';

  const clientIdLast6 = clientId.length >= 6 ? clientId.slice(-6) : '(too short or empty)';
  const clientIdSuffix = clientId.endsWith('.apps.googleusercontent.com')
    ? '✓ ends with .apps.googleusercontent.com'
    : '✗ does NOT end with .apps.googleusercontent.com (wrong client type?)';

  return NextResponse.json({
    GOOGLE_CLIENT_ID: {
      set: clientId.length > 0,
      length: clientId.length,
      last6: clientIdLast6,
      suffixCheck: clientIdSuffix,
    },
    GOOGLE_CLIENT_SECRET: { set: clientSecretSet },
    NEXTAUTH_URL: nextAuthUrl || '(not set)',
    hint: 'If client_id looks wrong or suffixCheck fails, create a new Web application OAuth client in GCP and update .env.local.',
  });
}
