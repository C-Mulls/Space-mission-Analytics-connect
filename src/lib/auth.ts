import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId?.trim() || !googleClientSecret?.trim()) {
  console.error(
    '[NextAuth] Google OAuth: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env. ' +
      'Get them from https://console.cloud.google.com/apis/credentials. ' +
      'Also add redirect URI: http://localhost:3000/api/auth/callback/google'
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    GoogleProvider({
      clientId: googleClientId ?? '',
      clientSecret: googleClientSecret ?? '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Optional: sync user name/image on sign-in; do not throw so adapter can complete
      if (user.email) {
        try {
          await prisma.user.updateMany({
            where: { email: user.email },
            data: {
              name: user.name ?? undefined,
              image: user.image ?? undefined,
            },
          });
        } catch (e) {
          console.error('[NextAuth] signIn event updateMany failed:', (e as Error).message);
        }
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
