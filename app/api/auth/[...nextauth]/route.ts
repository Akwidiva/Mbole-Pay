import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Email and password are required")
        }

        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user?.password) {
          throw new Error("Email/password account not found")
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error("Invalid email or password")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          username: (user as any).username ?? null,
          phone: user.phone ?? null,
          role: user.role,
        } as any
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  jwt: { secret: process.env.NEXTAUTH_SECRET },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      try {
        if (!user?.email) {
          console.error("SignIn: No email provided", user)
          return false
        }
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          create: {
            email: user.email,
            name: user.name ?? (profile as any)?.name ?? "",
          },
          update: {
            name: user.name ?? undefined,
          },
        });
        // Store user id, username, and role in token
        (user as any).id = dbUser.id;
        (user as any).username = (dbUser as any).username ?? null;
        (user as any).phone = dbUser.phone ?? null;
        (user as any).role = dbUser.role;
        return true;
      } catch (e) {
        console.error("SignIn callback error:", e);
        // Still allow sign in even if DB operation fails
        return true
      }
    },
    async jwt({ token, user }: any) {
      if (user?.email) {
        token.email = user.email
        token.id = user.id
        token.username = user.username
        token.phone = user.phone
        token.name = user.name
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.email = token.email as string
        session.user.id = token.id as string
        session.user.username = token.username as string | null
        session.user.phone = token.phone as string | null
        session.user.name = token.name as string | null
        session.user.role = token.role as string
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };