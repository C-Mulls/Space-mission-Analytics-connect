import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LoginButton } from '@/components/LoginButton';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');

  const { error } = await searchParams;
  const isCallbackError = error === 'Callback' || error === 'OAuthCallback';
  const isOAuthError = !isCallbackError && (error === 'OAuthSignin' || error === 'OAuthCreateAccount');

  const isProduction =
    process.env.VERCEL === '1' || (process.env.NEXTAUTH_URL ?? '').startsWith('https://');

  const callbackErrorMessage = isProduction ? (
    <>
      <p className="mt-1 text-red-700 dark:text-red-300">
        If <strong>DATABASE_URL</strong> is not set in Vercel: add it under Settings → Environment Variables (use your Neon connection string), then Redeploy.
      </p>
      <p className="mt-2 text-red-700 dark:text-red-300">
        If <strong>DATABASE_URL is already set</strong>, the database may be missing tables. From your machine run:
      </p>
      <code className="mt-1 block text-left text-xs bg-red-100 dark:bg-red-900/40 p-2 rounded break-all">
        DATABASE_URL=&quot;your-neon-url&quot; npx prisma migrate deploy
      </code>
      <p className="mt-2 text-red-700 dark:text-red-300 text-xs">
        Use the same Neon URL as in Vercel. Then try signing in again.
      </p>
    </>
  ) : (
    <p className="mt-1 text-red-700 dark:text-red-300">
      Server is missing database configuration. Set <strong>DATABASE_URL</strong> in{' '}
      <code className="bg-red-100 dark:bg-red-900/40 px-1 rounded">.env</code> or{' '}
      <code className="bg-red-100 dark:bg-red-900/40 px-1 rounded">.env.local</code> and restart the
      dev server. If you don&apos;t have Postgres, run{' '}
      <code className="bg-red-100 dark:bg-red-900/40 px-1 rounded">docker compose up -d</code> then
      use{' '}
      <code className="break-all bg-red-100 dark:bg-red-900/40 px-1 rounded text-xs">
        postgresql://spacemission:spacemission@localhost:5432/spacemission?schema=public
      </code>
    </p>
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-8 text-center">
        <div className="mb-6 flex justify-center">
          <span className="text-5xl" aria-hidden>🚀</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Space Missions Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">
          Sign in to upload CSVs and view your mission analytics.
        </p>
        {isCallbackError && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-left text-sm text-red-800 dark:text-red-200">
            <p className="font-medium">Login failed</p>
            {callbackErrorMessage}
          </div>
        )}
        {(isOAuthError && !isCallbackError) && (
          <div className="mb-6 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-left text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium">Google sign-in failed</p>
            <p className="mt-1 text-amber-700 dark:text-amber-300">
              Check your <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env.local</code>: set{' '}
              <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">GOOGLE_CLIENT_ID</code>,{' '}
              <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">GOOGLE_CLIENT_SECRET</code>,{' '}
              <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">NEXTAUTH_URL</code> and{' '}
              <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">NEXTAUTH_SECRET</code>. In Google Cloud Console, add the correct redirect URI for your environment.
            </p>
          </div>
        )}
        <LoginButton />
      </div>
    </main>
  );
}
