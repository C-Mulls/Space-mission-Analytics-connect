import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/login' },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/upload',
    '/api/datasets/:path*',
    '/api/rows',
    '/api/functions',
  ],
};
