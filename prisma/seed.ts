// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@mbolepay.com" },
    update: {},
    create: {
      email: "admin@mbolepay.com",
      name: "Admin",
      password: await bcrypt.hash("Admin123456!", 10),
      role: "ADMIN",
    },
  })
  console.log("✓ Created Admin:", superAdmin.name, superAdmin.email, `(${superAdmin.role})`)

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Test User",
      password: await bcrypt.hash("Test123456", 10),
      role: "USER",
    },
  })
  console.log("✓ Created Test User:", user.name, user.email, `(${user.role})`)

  console.log("\n✓ Seeding complete!")
  console.log("\nLogin credentials:")
  console.log("Super Admin: admin@mbolepay.com / Admin123456!")
  console.log("Test User: test@example.com / Test123456")
}

main()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
