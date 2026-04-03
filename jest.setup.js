/**
 * Jest Setup File
 * Global test configuration
 */

// Add custom matchers or setup
expect.extend({});

// Mock Next.js router if needed
jest.mock("next/router", () => ({
  useRouter: () => ({
    query: {},
    pathname: "/",
    push: jest.fn(),
  }),
}));

// Mock next-auth if needed
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: null,
    status: "unauthenticated",
  }),
}));

// Set test environment variables
process.env.DATABASE_URL = "file:./prisma/test.db";
process.env.NEXTAUTH_SECRET = "test-secret-key-for-testing-only";
process.env.NEXTAUTH_URL = "http://localhost:3000";
