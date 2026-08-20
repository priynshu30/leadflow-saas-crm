const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding multi-tenant demo data to TiDB Cloud...");

  const passwordHash = await bcrypt.hash("password123", 10);
  const adminPasswordHash = await bcrypt.hash("Root@123", 10);

  // 1. Create default Business (LeadFlow CRM)
  const business = await prisma.business.create({
    data: {
      name: "LeadFlow Innovations",
      phone: "09012965100",
      email: "contact@leadflow.in",
      address: "Tech Park, Gurgaon, India",
      businessType: "OTHER",
      field1Label: "Requirement",
      field2Label: "Budget",
      field3Label: "Timeline",
      field4Label: "Source Channel",
      defaultCountryCode: "91",
    },
  });

  // 2. Create User: Priyanshu Kumar
  const user = await prisma.user.create({
    data: {
      businessId: business.id,
      name: "Priyanshu Kumar",
      email: "admin@gmail.com",
      phone: "09012965100",
      passwordHash: adminPasswordHash,
    },
  });

  // 3. Create Super Admin
  await prisma.superAdmin.upsert({
    where: { email: "admin@leadflow.in" },
    update: { passwordHash: adminPasswordHash, name: "Super Admin" },
    create: {
      name: "Super Admin",
      email: "admin@leadflow.in",
      passwordHash: adminPasswordHash,
    },
  });

  // 4. Sample Leads
  await prisma.lead.create({
    data: {
      businessId: business.id,
      assignedUserId: user.id,
      name: "Rahul Verma",
      phone: "9876543210",
      email: "rahul@example.com",
      source: "Website Form",
      status: "INTERESTED",
      field1Label: "Requirement",
      field1Value: "Enterprise CRM Setup",
      field2Label: "Budget",
      field2Value: "₹50,000",
      notes: "Interested in multi-tenant SaaS features.",
    },
  });

  console.log("✅ Seed successfully inserted!");
  console.log(`- Business ID: ${business.id} (${business.name})`);
  console.log(`- User: ${user.name} (${user.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
