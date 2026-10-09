import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { NepalAddressSnapshot } from '@/db/schema/orders';
import { formatMoney } from '@/data/catalog';

export interface CartInputItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface RevalidationResult {
  valid: boolean;
  errors: string[];
  priceChanges: Array<{
    productId: string;
    productName: string;
    variantId?: string;
    clientPrice?: number;
    authoritativePrice: number;
  }>;
  stockIssues: Array<{
    productId: string;
    productName: string;
    variantId?: string;
    requestedQty: number;
    availableStock: number;
  }>;
  authoritativeItems: Array<{
    productId: string;
    variantId?: string;
    productName: string;
    variantName?: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    thumbnail: string;
  }>;
  subtotal: number;
  shippingAmount: number;
  total: number;
}

export async function revalidateCartServer(items: CartInputItem[]): Promise<RevalidationResult> {
  const result: RevalidationResult = {
    valid: true,
    errors: [],
    priceChanges: [],
    stockIssues: [],
    authoritativeItems: [],
    subtotal: 0,
    shippingAmount: 0,
    total: 0,
  };

  if (!items || items.length === 0) {
    result.valid = false;
    result.errors.push('Cart is empty.');
    return result;
  }

  for (const item of items) {
    if (!item.productId || item.quantity < 1) {
      result.valid = false;
      result.errors.push(`Invalid cart item specifications.`);
      continue;
    }

    // Query product
    const product = await db.query.products.findFirst({
      where: and(eq(schema.products.id, item.productId), eq(schema.products.active, true)),
      with: {
        variants: true,
      },
    });

    if (!product) {
      result.valid = false;
      result.errors.push(`Product ${item.productId} is no longer available.`);
      continue;
    }

    // Find requested variant or default variant
    let variant = product.variants.find(
      (v) => v.variantCode === item.variantId || v.id === item.variantId
    );

    if (!variant && product.variants.length > 0) {
      variant = product.variants[0];
    }

    if (!variant) {
      result.valid = false;
      result.errors.push(`Variant ${item.variantId || 'default'} for ${product.name} is unavailable.`);
      continue;
    }

    // Check stock
    if (variant.stockQuantity < item.quantity) {
      result.valid = false;
      result.stockIssues.push({
        productId: product.id,
        productName: product.name,
        variantId: variant.variantCode,
        requestedQty: item.quantity,
        availableStock: variant.stockQuantity,
      });
      result.errors.push(
        `Insufficient stock for ${product.name} (${variant.name}). Requested: ${item.quantity}, Available: ${variant.stockQuantity}.`
      );
      continue;
    }

    const authoritativeUnitPrice = variant.priceOverride ?? product.basePrice;
    const lineTotal = authoritativeUnitPrice * item.quantity;
    result.subtotal += lineTotal;

    result.authoritativeItems.push({
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      variantName: variant.name !== 'Standard' ? variant.name : undefined,
      sku: variant.sku,
      quantity: item.quantity,
      unitPrice: authoritativeUnitPrice,
      lineTotal,
      thumbnail: variant.image || product.thumbnail,
    });
  }

  result.total = result.subtotal + result.shippingAmount;
  return result;
}

export function generateOrderReference(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let ref = 'DD-';
  for (let i = 0; i < 8; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

export interface CreateOrderParams {
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: 'cod' | 'esewa' | 'nps';
  deliveryAddress: NepalAddressSnapshot;
  items: CartInputItem[];
  notes?: string;
}

export async function createOrder(params: CreateOrderParams) {
  // 1. Authoritative server revalidation
  const reval = await revalidateCartServer(params.items);
  if (!reval.valid) {
    throw new Error(reval.errors.join(' '));
  }

  const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const orderReference = generateOrderReference();

  // Status mapping
  const orderStatus = params.paymentMethod === 'cod' ? 'pending_confirmation' : 'pending_payment';
  const paymentStatus = params.paymentMethod === 'cod' ? 'unpaid' : 'pending';

  // 2. Insert Order
  await db.insert(schema.orders).values({
    id: orderId,
    orderReference,
    userId: params.userId || null,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone,
    status: orderStatus,
    paymentStatus,
    paymentMethod: params.paymentMethod,
    subtotal: reval.subtotal,
    shippingAmount: reval.shippingAmount,
    total: reval.total,
    currency: 'NPR',
    deliveryAddress: params.deliveryAddress,
    notes: params.notes,
  });

  // 3. Insert Order Items & adjust inventory
  for (const it of reval.authoritativeItems) {
    const itemId = `item_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await db.insert(schema.orderItems).values({
      id: itemId,
      orderId,
      productId: it.productId,
      variantId: it.variantId,
      productNameSnapshot: it.productName,
      variantNameSnapshot: it.variantName,
      skuSnapshot: it.sku,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal,
      thumbnail: it.thumbnail,
    });

    // Update variant stock in DB
    if (it.variantId) {
      const v = await db.query.productVariants.findFirst({
        where: eq(schema.productVariants.id, it.variantId),
      });

      if (v) {
        const nextStock = Math.max(0, v.stockQuantity - it.quantity);
        await db.update(schema.productVariants)
          .set({ stockQuantity: nextStock })
          .where(eq(schema.productVariants.id, it.variantId));

        // Record inventory ledger adjustment
        await db.insert(schema.inventoryAdjustments).values({
          id: `adj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          variantId: it.variantId,
          quantityDelta: -it.quantity,
          resultingStock: nextStock,
          reason: 'order_committed',
          referenceId: orderReference,
          notes: `Deducted for order ${orderReference}`,
          createdBy: params.userId || 'guest',
        });
      }
    }
  }

  // 4. Create Payment Record
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  await db.insert(schema.payments).values({
    id: paymentId,
    orderId,
    provider: params.paymentMethod,
    status: paymentStatus,
    amount: reval.total,
    currency: 'NPR',
    metadata: {
      orderReference,
      createdVia: 'storefront_checkout',
    },
  });

  return {
    success: true,
    orderId,
    orderReference,
    status: orderStatus,
    paymentStatus,
    paymentMethod: params.paymentMethod,
    subtotal: reval.subtotal,
    total: reval.total,
    currency: 'NPR',
    items: reval.authoritativeItems,
  };
}

export async function getOrderByReference(orderReference: string) {
  return await db.query.orders.findFirst({
    where: eq(schema.orders.orderReference, orderReference),
    with: {
      items: true,
      payments: true,
    },
  });
}

export async function getUserOrders(userId: string) {
  return await db.query.orders.findMany({
    where: eq(schema.orders.userId, userId),
    orderBy: [desc(schema.orders.createdAt)],
    with: {
      items: true,
    },
  });
}

export async function getAllOrdersAdmin(limit = 50, offset = 0) {
  return await db.query.orders.findMany({
    orderBy: [desc(schema.orders.createdAt)],
    limit,
    offset,
    with: {
      items: true,
      payments: true,
    },
  });
}

export async function updateOrderStatusAdmin(orderId: string, nextStatus: string) {
  const allowed = [
    'pending_payment',
    'pending_confirmation',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`Invalid status transition: ${nextStatus}`);
  }

  await db.update(schema.orders)
    .set({
      status: nextStatus as any,
      updatedAt: new Date(),
    })
    .where(eq(schema.orders.id, orderId));

  return { success: true };
}

export async function updateOrderPaymentMethodToCod(orderReference: string) {
  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.orderReference, orderReference),
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.paymentStatus === 'paid') {
    throw new Error('Order is already marked as paid');
  }

  await db.update(schema.orders)
    .set({
      paymentMethod: 'cod',
      paymentStatus: 'unpaid',
      status: 'pending_confirmation',
      updatedAt: new Date(),
    })
    .where(eq(schema.orders.orderReference, orderReference));

  // Also update latest payment record if exists
  await db.update(schema.payments)
    .set({
      provider: 'cod',
      status: 'pending',
      updatedAt: new Date(),
    })
    .where(eq(schema.payments.orderId, order.id));

  return { success: true };
}

