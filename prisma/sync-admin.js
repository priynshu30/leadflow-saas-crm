const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@leadflow.in";
  const password = "SuperAdmin@123";
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.superAdmin.upsert({
    where: { email },
    update: {
      passwordHash,
      name: "Platform Super Admin",
    },
    create: {
      name: "Platform Super Admin",
      email,
      passwordHash,
    },
  });

  console.log(`✅ Super Admin synced: ${admin.email} (Password: ${password})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
