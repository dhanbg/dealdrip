'use server';

import { createOrder, revalidateCartServer, CartInputItem } from '@/db/queries/orders';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { initiatePaymentForOrder } from '@/lib/payments/service';
import { sendCodOrderConfirmationEmail } from '@/lib/email';
import { PaymentInitiationResult } from '@/lib/payments/types';

export interface SubmitOrderPayload {
  customer: {
    fullName: string;
    phone: string;
    email: string;
  };
  deliveryAddress: {
    country: 'Nepal';
    province: string;
    district: string;
    municipality: string;
    ward: string;
    areaTole: string;
    streetLandmark?: string;
    deliveryInstructions?: string;
  };
  paymentMethod: 'cod' | 'esewa' | 'nps';
  items: CartInputItem[];
  notes?: string;
}

export async function submitOrderAction(payload: SubmitOrderPayload) {
  try {
    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'Your cart is empty.' };
    }

    // Optional session detection for logged-in users
    let userId: string | undefined = undefined;
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch {
      // Guest checkout proceeds safely without session
    }

    // 1. Execute transactional order creation with authoritative revalidation
    const result = await createOrder({
      userId,
      customerName: payload.customer.fullName,
      customerEmail: payload.customer.email,
      customerPhone: payload.customer.phone,
      paymentMethod: payload.paymentMethod,
      deliveryAddress: payload.deliveryAddress,
      items: payload.items,
      notes: payload.notes,
    });

    let paymentInit: PaymentInitiationResult | undefined = undefined;

    // 2. Handle Payment Flow
    if (payload.paymentMethod === 'cod') {
      // Send COD order confirmation email asynchronously
      sendCodOrderConfirmationEmail({
        orderReference: result.orderReference,
        customerName: payload.customer.fullName,
        customerEmail: payload.customer.email,
        customerPhone: payload.customer.phone,
        paymentMethod: 'cod',
        paymentStatus: 'unpaid',
        orderStatus: 'pending_confirmation',
        subtotal: result.subtotal,
        total: result.total,
        deliveryAddress: payload.deliveryAddress,
        items: result.items.map((i) => ({
          productName: i.productName,
          variantName: i.variantName,
          sku: i.sku,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.lineTotal,
        })),
      }).catch((err) => console.warn('COD email dispatch error:', err));
    } else {
      // Online payment (eSewa / NPS)
      const headersList = await headers();
      const host = headersList.get('host') || 'localhost:3000';
      const proto = headersList.get('x-forwarded-proto') || 'http';
      const callbackBaseUrl = `${proto}://${host}`;

      paymentInit = await initiatePaymentForOrder({
        orderReference: result.orderReference,
        method: payload.paymentMethod,
        callbackBaseUrl,
      });

      if (!paymentInit.success) {
        return {
          success: false,
          error: paymentInit.error || `Failed to initialize ${payload.paymentMethod.toUpperCase()} payment gateway.`,
        };
      }
    }

    // Revalidate paths for inventory & orders
    revalidatePath('/admin/orders');
    revalidatePath('/admin/inventory');
    revalidatePath('/account/orders');

    return {
      success: true,
      orderReference: result.orderReference,
      status: result.status,
      paymentStatus: result.paymentStatus,
      paymentMethod: result.paymentMethod,
      total: result.total,
      currency: result.currency,
      paymentInit,
    };
  } catch (err: any) {
    console.error('Order creation failed:', err);
    return {
      success: false,
      error: err.message || 'An error occurred while creating your order. Please try again.',
    };
  }
}

export async function validateCartServerAction(items: CartInputItem[]) {
  try {
    const reval = await revalidateCartServer(items);
    return { success: true, revalidation: reval };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
