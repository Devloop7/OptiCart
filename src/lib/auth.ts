import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as NextAuthOptions["adapter"],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    // Credentials (email + password)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user || !user.hashedPassword) return null;

        // Check lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) return null;

        const valid = await bcrypt.compare(credentials.password, user.hashedPassword);
        if (!valid) {
          const attempts = user.failedLoginAttempts + 1;
          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: attempts,
              ...(attempts >= 5 && {
                lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
              }),
            },
          });
          return null;
        }

        // Reset failed attempts on success
        if (user.failedLoginAttempts > 0) {
          await db.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    // Auto-create workspace for new Google sign-in users
    async createUser({ user }) {
      if (!user.id || !user.email) return;

      const slug =
        user.email.split("@")[0].replace(/[^a-z0-9]/g, "-").slice(0, 30) +
        "-" +
        Date.now().toString(36);

      const workspace = await db.workspace.create({
        data: {
          name: `${user.name || "My"}'s Workspace`,
          slug,
        },
      });

      await db.membership.create({
        data: { userId: user.id, workspaceId: workspace.id, role: "OWNER" },
      });

      const freePlan = await db.plan.findUnique({ where: { tier: "FREE" } });
      if (freePlan) {
        await db.subscription.create({
          data: {
            workspaceId: workspace.id,
            planId: freePlan.id,
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 86400000),
          },
        });
      }

      await db.workspaceSupplier.create({
        data: {
          workspaceId: workspace.id,
          platform: "ALIEXPRESS",
          name: "AliExpress",
          isActive: true,
        },
      });

      await db.pricingRule.create({
        data: {
          workspaceId: workspace.id,
          name: "Default 2x Markup",
          multiplier: 2.0,
          fixedAddon: 0,
          minMarginPct: 20,
          isDefault: true,
        },
      });
    },
  },
};
