import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Create departments
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { slug: "AV" },
      update: {},
      create: { name: "Audio/Visual", slug: "AV" },
    }),
    prisma.department.upsert({
      where: { slug: "ENGINEERING" },
      update: {},
      create: { name: "Engineering", slug: "ENGINEERING" },
    }),
    prisma.department.upsert({
      where: { slug: "TECH_SUPPORT" },
      update: {},
      create: { name: "Tech Support", slug: "TECH_SUPPORT" },
    }),
  ])

  console.log(`Seeded ${departments.length} departments`)

  // Create admin user (will be linked to SSO on first login)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      role: "ADMIN",
    },
  })

  console.log(`Seeded admin user: ${admin.email}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
