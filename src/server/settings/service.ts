import { prisma } from "@/lib/db";
import { BusinessType } from "@prisma/client";

export async function getBusinessSettings(businessId: number) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      businessType: true,
      field1Label: true,
      field2Label: true,
      field3Label: true,
      field4Label: true,
      defaultCountryCode: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!business) {
    throw new Error("Business not found");
  }

  return business;
}

export async function updateBusinessSettings(
  businessId: number,
  data: {
    name?: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    businessType?: BusinessType;
    field1Label?: string | null;
    field2Label?: string | null;
    field3Label?: string | null;
    field4Label?: string | null;
    defaultCountryCode?: string | null;
  }
) {
  return prisma.business.update({
    where: { id: businessId },
    data,
  });
}
