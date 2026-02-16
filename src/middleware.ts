import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/login' },
});

export const config = {
  // No routes in matcher: with database session strategy, Edge middleware cannot
  // verify the session (no Prisma in Edge), so it would redirect every request to
  // /login and cause ERR_TOO_MANY_REDIRECTS. Auth is enforced in pages and API
  // handlers via getServerSession (Node runtime).
  matcher: [],
};
