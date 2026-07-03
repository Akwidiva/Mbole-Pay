import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from '@/lib/db'
import { createLogger } from "@/lib/observability/logger";
import { authSignInEvents } from "@/lib/observability/metrics";

const logger = createLogger("auth.nextauth")

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
          authSignInEvents.inc({ provider: "credentials", result: "failed", role: "unknown" })
          logger.warn("Credentials sign-in rejected: missing email or password")
          throw new Error("Email and password are required")
        }

        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user?.password) {
          authSignInEvents.inc({ provider: "credentials", result: "failed", role: "unknown" })
          logger.warn("Credentials sign-in rejected: account not found", { email: credentials.email })
          throw new Error("Email/password account not found")
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          authSignInEvents.inc({ provider: "credentials", result: "failed", role: user.role })
          logger.warn("Credentials sign-in rejected: invalid password", { email: credentials.email, role: user.role })
          throw new Error("Invalid email or password")
        }

        if ((user as any).suspended) {
          authSignInEvents.inc({ provider: "credentials", result: "failed", role: user.role })
          logger.warn("Credentials sign-in rejected: account suspended", { email: credentials.email })
          throw new Error("This account has been suspended. Contact support for assistance.")
        }

        authSignInEvents.inc({ provider: "credentials", result: "success", role: user.role })
        logger.info("Credentials sign-in succeeded", { email: credentials.email, role: user.role })

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          username: (user as any).username ?? null,
          phone: user.phone ?? null,
          role: user.role,
          kycStatus: (user as any).kycStatus ?? "NONE",
          image: (user as any).image ?? null,
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
          logger.warn("SignIn callback rejected: no email provided", { user })
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
        if ((dbUser as any).suspended) {
          logger.warn("SignIn callback rejected: account suspended", { email: user.email })
          return false
        }
        // Store user id, username, role, and kycStatus in token
        (user as any).id = dbUser.id;
        (user as any).username = (dbUser as any).username ?? null;
        (user as any).phone = dbUser.phone ?? null;
        (user as any).role = dbUser.role;
        (user as any).kycStatus = (dbUser as any).kycStatus ?? "NONE";
        (user as any).image = (dbUser as any).image ?? null;
        return true;
      } catch (e) {
        logger.error("SignIn callback error", { error: String(e) })
        // Still allow sign in even if DB operation fails
        return true
      }
    },
    async jwt({ token, user, trigger }: any) {
      if (user?.email) {
        token.email = user.email
        token.id = user.id
        token.username = user.username
        token.phone = user.phone
        token.name = user.name
        token.role = user.role
        token.kycStatus = user.kycStatus ?? "NONE"
        token.picture = user.image ?? null
      }
      // Refresh role, kycStatus, and image from DB when session.update() is called
      if (trigger === "update" && token.id) {
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, kycStatus: true, image: true } as any,
          })
          if (fresh) {
            token.role = (fresh as any).role ?? token.role
            token.kycStatus = (fresh as any).kycStatus ?? "NONE"
            token.picture = (fresh as any).image ?? token.picture
          }
        } catch { /* non-fatal */ }
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
        session.user.kycStatus = token.kycStatus as string | null
        session.user.image = token.picture as string | null
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