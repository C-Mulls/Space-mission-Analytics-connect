/**
 * Returns the redirect URI this app uses for Google OAuth.
 * Open this URL on your deployed app to see exactly what to add in Google Cloud Console.
 * GET /api/debug/callback-url — no secrets, safe in production.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const base = (process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '');
  const redirectUri = base ? `${base}/api/auth/callback/google` : null;

  return NextResponse.json({
    message:
      'Add this exact URL to Google Cloud Console → Credentials → your OAuth client → Authorized redirect URIs',
    NEXTAUTH_URL: base || '(not set)',
    redirect_uri: redirectUri,
    note: 'Copy redirect_uri exactly (no trailing slash). If NEXTAUTH_URL is wrong in Vercel, fix it there and redeploy.',
  });
}
