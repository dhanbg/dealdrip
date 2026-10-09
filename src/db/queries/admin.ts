import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, desc, sql, and, lte } from 'drizzle-orm';

export async function getAdminStats() {
  const allProducts = await db.select().from(schema.products);
  const activeProducts = allProducts.filter((p) => p.active);

  const lowStockVariants = await db.query.productVariants.findMany({
    where: and(eq(schema.productVariants.active, true), lte(schema.productVariants.stockQuantity, 10)),
    with: {
      product: true,
    },
  });

  const allOrders = await db.select().from(schema.orders);
  const pendingOrders = allOrders.filter(
    (o) => o.status === 'pending_confirmation' || o.status === 'pending_payment'
  );

  const recentOrders = await db.query.orders.findMany({
    orderBy: [desc(schema.orders.createdAt)],
    limit: 6,
    with: {
      items: true,
    },
  });

  return {
    totalProducts: allProducts.length,
    activeProducts: activeProducts.length,
    lowStockCount: lowStockVariants.length,
    lowStockVariants,
    totalOrders: allOrders.length,
    pendingOrdersCount: pendingOrders.length,
    recentOrders,
  };
}

export async function getAdminProductsList() {
  return await db.query.products.findMany({
    orderBy: [desc(schema.products.createdAt)],
    with: {
      category: true,
      variants: true,
    },
  });
}

export async function getAdminInventoryList() {
  return await db.query.productVariants.findMany({
    orderBy: [schema.productVariants.stockQuantity],
    with: {
      product: true,
    },
  });
}

export async function adjustStockAdmin(
  variantId: string,
  newStock: number,
  reason: string,
  adminUserId: string,
  notes?: string
) {
  const variant = await db.query.productVariants.findFirst({
    where: eq(schema.productVariants.id, variantId),
  });

  if (!variant) throw new Error('Variant not found');

  const delta = newStock - variant.stockQuantity;

  await db.update(schema.productVariants)
    .set({ stockQuantity: newStock, updatedAt: new Date() })
    .where(eq(schema.productVariants.id, variantId));

  await db.insert(schema.inventoryAdjustments).values({
    id: `adj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    variantId,
    quantityDelta: delta,
    resultingStock: newStock,
    reason: reason || 'manual_adjustment',
    referenceId: 'ADMIN_MANUAL',
    notes: notes || `Admin updated stock from ${variant.stockQuantity} to ${newStock}`,
    createdBy: adminUserId,
  });

  return { success: true };
}

export async function toggleProductActiveAdmin(productId: string, active: boolean) {
  await db.update(schema.products)
    .set({ active, updatedAt: new Date() })
    .where(eq(schema.products.id, productId));
  return { success: true };
}

export async function updateProductDetailsAdmin(productId: string, data: {
  name: string;
  basePrice: number;
  description: string;
  badge?: string;
  featured?: boolean;
}) {
  await db.update(schema.products)
    .set({
      name: data.name,
      basePrice: data.basePrice,
      description: data.description,
      badge: data.badge || null,
      featured: data.featured ?? false,
      updatedAt: new Date(),
    })
    .where(eq(schema.products.id, productId));
  return { success: true };
}

export async function getAdminCustomersList() {
  const users = await db.select().from(schema.user).orderBy(desc(schema.user.createdAt));
  const allOrders = await db.select().from(schema.orders);

  return users.map((u) => ({
    ...u,
    ordersCount: allOrders.filter((o) => o.userId === u.id).length,
  }));
}

