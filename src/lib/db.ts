import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Lazy proxy to avoid PrismaClient instantiation at module-eval time (breaks Next.js build).
// The adapter import and client creation happen only on first actual database access.
function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    // Dynamic require to avoid PrismaPg validating the URL at import time during static generation
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require("@prisma/adapter-pg");
    const adapter = new PrismaPg({ connectionString });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
