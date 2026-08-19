import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

  console.log("-----------------------------------------");
  console.log(" Super Admin Account Created/Updated! ");
  console.log("-----------------------------------------");
  console.log(` Email    : ${admin.email}`);
  console.log(` Password : ${password}`);
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
