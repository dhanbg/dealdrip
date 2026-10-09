'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  updateOrderStatusAdmin,
  getAllOrdersAdmin,
} from '@/db/queries/orders';
import {
  adjustStockAdmin,
  toggleProductActiveAdmin,
  updateProductDetailsAdmin,
} from '@/db/queries/admin';

async function assertAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Authentication required.');
  }

  // Authoritative server-side role check
  if ((session.user as any).role !== 'admin') {
    throw new Error('Access denied. Administrator privileges required.');
  }

  return session.user;
}

export async function updateOrderStatusAction(orderId: string, nextStatus: string) {
  try {
    await assertAdmin();
    await updateOrderStatusAdmin(orderId, nextStatus);
    revalidatePath('/admin/orders');
    revalidatePath('/account/orders');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adjustStockAction(
  variantId: string,
  newStock: number,
  reason: string,
  notes?: string
) {
  try {
    const admin = await assertAdmin();
    await adjustStockAdmin(variantId, newStock, reason, admin.id, notes);
    revalidatePath('/admin/inventory');
    revalidatePath('/admin/products');
    revalidatePath('/#collection');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleProductActiveAction(productId: string, active: boolean) {
  try {
    await assertAdmin();
    await toggleProductActiveAdmin(productId, active);
    revalidatePath('/admin/products');
    revalidatePath('/#collection');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateProductDetailsAction(productId: string, data: {
  name: string;
  basePrice: number;
  description: string;
  badge?: string;
  featured?: boolean;
}) {
  try {
    await assertAdmin();
    await updateProductDetailsAdmin(productId, data);
    revalidatePath('/admin/products');
    revalidatePath('/#collection');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
