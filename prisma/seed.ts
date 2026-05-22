// prisma/seed.ts
import { prisma } from "../lib/db"
import bcrypt from "bcryptjs"

async function main() {
  // Create test user
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Test User",
      password: await bcrypt.hash("Test123456", 10),
    },
  })
  console.log("Seeded user:", user.name, user.email)

  // Create group
  const group = await prisma.group.upsert({
    where: { id: "seed-analytics" },
    update: {},
    create: {
      id: "seed-analytics",
      name: "Mbole Savings Group",
      description: "Test group for analytics",
      createdBy: user.id,
      amount: 50000,
      frequency: "monthly",
      cycle: 1,
    },
  })
  console.log("Seeded group:", group.name)

  // Add user to group
  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId: group.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      groupId: group.id,
      role: "ADMIN",
      status: "ACTIVE",
    },
  })
  console.log("Added user to group")

  // Create sample contributions
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    for (let j = 0; j < 3; j++) {
      await prisma.contribution.upsert({
        where: {
          id: `seed-contrib-${i}-${j}`,
        },
        update: {},
        create: {
          id: `seed-contrib-${i}-${j}`,
          userId: user.id,
          groupId: group.id,
          amount: 50000,
          status: "PAID",
          paymentMethod: j === 0 ? "MOMO" : j === 1 ? "ORANGE" : "CASH",
          transactionDate: date,
          paidAt: date,
        },
      })
    }
  }
  console.log("Seeded contributions")

  // Create some pending contributions
  for (let i = 0; i < 2; i++) {
    await prisma.contribution.upsert({
      where: {
        id: `seed-pending-${i}`,
      },
      update: {},
      create: {
        id: `seed-pending-${i}`,
        userId: user.id,
        groupId: group.id,
        amount: 50000,
        status: "PENDING",
        paymentMethod: "MOMO",
        transactionDate: new Date(),
      },
    })
  }
  console.log("Seeded pending contributions")
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })