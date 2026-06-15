// lib/db.ts
import { PrismaClient } from "@prisma/client";

// Ensure a single PrismaClient instance in development (hot-reload safe)
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const client =
  global.prisma ||
  new PrismaClient({
    log: ["query", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = client;
}

export const prisma = client;
export default client;
