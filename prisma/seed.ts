import { PrismaClient, BusinessType, LeadStatus, FollowUpStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with multi-tenant data...");

  // Clear existing records if any
  try {
    await prisma.reminderLog.deleteMany();
    await prisma.leadActivity.deleteMany();
    await prisma.followUp.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.user.deleteMany();
    await prisma.business.deleteMany();
  } catch (e) {
    console.log("Skipping delete, starting fresh.");
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  // Tenant 1: Real Estate Business (Apex Realty)
  const apexRealty = await prisma.business.create({
    data: {
      name: "Apex Realty Gurgaon",
      phone: "9811223344",
      email: "contact@apexrealty.in",
      address: "Golf Course Road, Sector 54, Gurgaon, Haryana",
      businessType: BusinessType.REAL_ESTATE,
      field1Label: "Property Type",
      field2Label: "Location",
      field3Label: "Bedrooms",
      field4Label: "Budget",
      defaultCountryCode: "91",
    },
  });

  const amitUser = await prisma.user.create({
    data: {
      businessId: apexRealty.id,
      name: "Amit Verma",
      email: "amit@apexrealty.in",
      phone: "9811223344",
      passwordHash,
    },
  });

  // Tenant 2: Automobile Dealership (Prime Auto Hub)
  const primeAuto = await prisma.business.create({
    data: {
      name: "Prime Auto Hub",
      phone: "9877001122",
      email: "sales@primeautohub.com",
      address: "Ring Road, Lajpat Nagar, New Delhi",
      businessType: BusinessType.AUTOMOBILE,
      field1Label: "Car Model",
      field2Label: "Budget",
      field3Label: "New/Used",
      field4Label: "Fuel Type",
      defaultCountryCode: "91",
    },
  });

  const rohitUser = await prisma.user.create({
    data: {
      businessId: primeAuto.id,
      name: "Rohit Sharma",
      email: "rohit@primeauto.com",
      phone: "9877001122",
      passwordHash,
    },
  });

  // Seed Leads for Apex Realty (Tenant 1)
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const todayLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 26 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  // Lead 1: Overdue follow-up
  const lead1 = await prisma.lead.create({
    data: {
      businessId: apexRealty.id,
      assignedUserId: amitUser.id,
      name: "Rajesh Khanna",
      phone: "9810012345",
      email: "rajesh.khanna@outlook.com",
      source: "99acres / MagicBricks",
      status: LeadStatus.INTERESTED,
      field1Label: "Property Type",
      field1Value: "3 BHK Luxury Apartment",
      field2Label: "Location",
      field2Value: "Golf Course Ext Rd",
      field3Label: "Bedrooms",
      field3Value: "3 BHK",
      field4Label: "Budget",
      field4Value: "₹2.2 Cr",
      notes: "Looking for ready-to-move property with 2 car parking slots.",
      nextFollowupAt: yesterday,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: lead1.id,
      userId: amitUser.id,
      type: "LEAD_CREATED",
      description: "Lead received from 99acres with high interest in 3BHK.",
    },
  });

  await prisma.followUp.create({
    data: {
      leadId: lead1.id,
      userId: amitUser.id,
      scheduledAt: yesterday,
      note: "Send project brochure and price sheet on WhatsApp.",
      status: FollowUpStatus.PENDING,
    },
  });

  // Lead 2: Due Today
  const lead2 = await prisma.lead.create({
    data: {
      businessId: apexRealty.id,
      assignedUserId: amitUser.id,
      name: "Pooja Singhania",
      phone: "9820054321",
      email: "pooja.s@gmail.com",
      source: "WhatsApp",
      status: LeadStatus.SITE_VISIT,
      field1Label: "Property Type",
      field1Value: "4 BHK Villa / Penthouse",
      field2Label: "Location",
      field2Value: "DLF Phase 5",
      field3Label: "Bedrooms",
      field3Value: "4 BHK",
      field4Label: "Budget",
      field4Value: "₹4.5 Cr",
      notes: "Site visit confirmed for this afternoon. Pick up from clubhouse.",
      nextFollowupAt: todayLater,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: lead2.id,
      userId: amitUser.id,
      type: "CALL",
      description: "Spoke regarding site visit timings. Client requested keys ready at 3 PM.",
    },
  });

  await prisma.followUp.create({
    data: {
      leadId: lead2.id,
      userId: amitUser.id,
      scheduledAt: todayLater,
      note: "Accompany client during DLF Phase 5 villa walkthrough.",
      status: FollowUpStatus.PENDING,
    },
  });

  // Lead 3: Due Tomorrow
  const lead3 = await prisma.lead.create({
    data: {
      businessId: apexRealty.id,
      assignedUserId: amitUser.id,
      name: "Karan Johar",
      phone: "9988776655",
      email: "karan@dharma.com",
      source: "Referral",
      status: LeadStatus.CONTACTED,
      field1Label: "Property Type",
      field1Value: "Commercial Office",
      field2Label: "Location",
      field2Value: "Cyber City",
      field3Label: "Bedrooms",
      field3Value: "3,000 sq ft",
      field4Label: "Budget",
      field4Value: "₹3.5 Lakh / month lease",
      notes: "Corporate lease requirement for digital marketing firm.",
      nextFollowupAt: tomorrow,
    },
  });

  await prisma.followUp.create({
    data: {
      leadId: lead3.id,
      userId: amitUser.id,
      scheduledAt: tomorrow,
      note: "Share commercial floor layout options with team.",
      status: FollowUpStatus.PENDING,
    },
  });

  // Lead 4: Converted Deal
  const lead4 = await prisma.lead.create({
    data: {
      businessId: apexRealty.id,
      assignedUserId: amitUser.id,
      name: "Neha Mehta",
      phone: "9871122334",
      source: "Direct Call",
      status: LeadStatus.CONVERTED,
      field1Label: "Property Type",
      field1Value: "2 BHK Builder Floor",
      field2Label: "Location",
      field2Value: "Sector 57",
      field3Label: "Bedrooms",
      field3Value: "2 BHK",
      field4Label: "Budget",
      field4Value: "₹95 Lakh",
      notes: "Token amount paid and agreement registered.",
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: lead4.id,
      userId: amitUser.id,
      type: "STATUS_CHANGE",
      description: "Deal closed! Booking token received.",
    },
  });

  // Seed Leads for Prime Auto Hub (Tenant 2) - to verify tenant data isolation!
  const autoLead1 = await prisma.lead.create({
    data: {
      businessId: primeAuto.id,
      assignedUserId: rohitUser.id,
      name: "Suresh Raina",
      phone: "9900112233",
      source: "Cardekho / Carwale",
      status: LeadStatus.INTERESTED,
      field1Label: "Car Model",
      field1Value: "Hyundai Creta SX (O)",
      field2Label: "Budget",
      field2Value: "₹18 Lakh",
      field3Label: "New/Used",
      field3Value: "New",
      field4Label: "Fuel Type",
      field4Value: "Diesel Automatic",
      notes: "Looking for exchange with 2018 Swift.",
      nextFollowupAt: todayLater,
    },
  });

  await prisma.followUp.create({
    data: {
      leadId: autoLead1.id,
      userId: rohitUser.id,
      scheduledAt: todayLater,
      note: "Offer test drive and evaluate old Swift car for exchange value.",
      status: FollowUpStatus.PENDING,
    },
  });

  console.log("Database seeded successfully!");
  console.log("Demo Accounts:");
  console.log("1. Apex Realty (Real Estate): amit@apexrealty.in / password123");
  console.log("2. Prime Auto Hub (Automobile): rohit@primeauto.com / password123");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
