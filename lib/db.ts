// lib/db.ts
import { PrismaClient } from "@prisma/client";

// Declare a global variable to hold the Prisma client instance.
// This ensures that the same instance is used across hot reloads in development.
declare global {
  var prisma: PrismaClient | undefined;
}

console.log('DATABASE_URL used by Prisma:', process.env.DATABASE_URL)

let client: PrismaClient

try {
  client =
    global.prisma ||
    new PrismaClient({
      log: ["query", "warn", "error"],
    });

  if (process.env.NODE_ENV !== "production") {
    global.prisma = client;
  }
} catch (error) {
  console.error("Failed to initialize Prisma Client:", error);
  // Exit the process or handle the error appropriately
  // In a Next.js app, you might not want to exit the process during development
  // but logging is crucial.
  throw new Error("Prisma Client failed to initialize.");
}

export const prisma = client;

// Export the Prisma client instance as the default export.
export default client;