// prisma/seed.ts
import { prisma } from "../lib/db"

async function main() {
  const g = await prisma.group.upsert({
    where: { id: "seed-keep" },
    update: {},
    create: { id: "seed-keep", name: "Mbole Savings Group", description: "Default group" },
  })
  console.log("Seeded group:", g.name)
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })