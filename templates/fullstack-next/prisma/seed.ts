import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.role.createMany({
    data: [
      { name: "admin", description: "Full access" },
      { name: "manager", description: "Limited control" },
      { name: "user", description: "Basic access" },
    ],
    skipDuplicates: true,
  });
}

main().finally(() => prisma.$disconnect());
