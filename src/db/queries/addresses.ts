import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export interface AddressInput {
  fullName: string;
  phone: string;
  province: string;
  district: string;
  municipality: string;
  ward: string;
  areaTole: string;
  streetLandmark?: string;
  deliveryInstructions?: string;
  isDefault?: boolean;
}

export async function getUserAddresses(userId: string) {
  return await db.query.addresses.findMany({
    where: eq(schema.addresses.userId, userId),
    orderBy: [schema.addresses.createdAt],
  });
}

export async function createUserAddress(userId: string, input: AddressInput) {
  const addressId = `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // If set to default, unset other defaults
  if (input.isDefault) {
    await db.update(schema.addresses)
      .set({ isDefault: false })
      .where(eq(schema.addresses.userId, userId));
  }

  await db.insert(schema.addresses).values({
    id: addressId,
    userId,
    fullName: input.fullName,
    phone: input.phone,
    province: input.province,
    district: input.district,
    municipality: input.municipality,
    ward: input.ward,
    areaTole: input.areaTole,
    streetLandmark: input.streetLandmark || null,
    deliveryInstructions: input.deliveryInstructions || null,
    isDefault: input.isDefault || false,
  });

  return { success: true, id: addressId };
}

export async function updateUserAddress(addressId: string, userId: string, input: Partial<AddressInput>) {
  if (input.isDefault) {
    await db.update(schema.addresses)
      .set({ isDefault: false })
      .where(eq(schema.addresses.userId, userId));
  }

  await db.update(schema.addresses)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.addresses.id, addressId), eq(schema.addresses.userId, userId)));

  return { success: true };
}

export async function deleteUserAddress(addressId: string, userId: string) {
  await db.delete(schema.addresses)
    .where(and(eq(schema.addresses.id, addressId), eq(schema.addresses.userId, userId)));

  return { success: true };
}
