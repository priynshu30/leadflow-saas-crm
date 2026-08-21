const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function checkUser() {
  const email = "admin@gmail.com";
  console.log("Checking user in TiDB Cloud DB for:", email);

  const users = await prisma.user.findMany({
    include: { business: true },
  });

  console.log("Found total users in DB:", users.length);
  users.forEach((u) => {
    console.log(`- ID: ${u.id}, Email: '${u.email}', Name: '${u.name}', BusinessID: ${u.businessId}, BusinessStatus: '${u.business?.status}'`);
  });
}

checkUser()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
