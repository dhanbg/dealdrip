import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, desc, gt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  PaymentMethod,
  PaymentInitiationResult,
  PaymentVerificationResult,
} from './types';
import { codProvider } from './providers/cod';
import { esewaProvider } from './providers/esewa';
import { npsProvider } from './providers/nps';
import {
  sendCodOrderConfirmationEmail,
  sendPaymentSuccessEmail,
} from '@/lib/email';

export function getProvider(method: PaymentMethod) {
  switch (method) {
    case 'cod':
      return codProvider;
    case 'esewa':
      return esewaProvider;
    case 'nps':
      return npsProvider;
    default:
      throw new Error(`Unsupported payment method: ${method}`);
  }
}

/**
 * Initiates payment parameters for an order
 */
export async function initiatePaymentForOrder(params: {
  orderReference: string;
  method: PaymentMethod;
  callbackBaseUrl: string;
}): Promise<PaymentInitiationResult> {
  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.orderReference, params.orderReference),
    with: {
      items: true,
      payments: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${params.orderReference} not found.`);
  }

  if (order.paymentStatus === 'paid') {
    throw new Error(`Order ${params.orderReference} has already been paid.`);
  }

  // Create temporary stock reservation for online payments (30-minute expiry)
  if (params.method === 'esewa' || params.method === 'nps') {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
    for (const item of order.items) {
      if (item.variantId) {
        await db.insert(schema.stockReservations).values({
          id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          orderId: order.id,
          variantId: item.variantId,
          quantity: item.quantity,
          expiresAt,
          status: 'active',
        });
      }
    }
  }

  const provider = getProvider(params.method);
  const result = await provider.initiatePayment({
    orderId: order.id,
    orderReference: order.orderReference,
    amount: order.total,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    callbackBaseUrl: params.callbackBaseUrl,
  });

  // Record payment attempt in payments table
  if (result.success) {
    await db.insert(schema.payments).values({
      id: result.paymentId,
      orderId: order.id,
      provider: params.method,
      status: 'pending',
      amount: order.total,
      currency: 'NPR',
      metadata: {
        orderReference: order.orderReference,
        initiatedAt: new Date().toISOString(),
        formAction: result.formAction,
      },
    });
  }

  return result;
}

/**
 * Authoritatively processes payment callback/verification with strict idempotency
 */
export async function processPaymentVerification(params: {
  provider: PaymentMethod;
  orderReference: string;
  rawPayload?: any;
  providerTransactionId?: string;
}): Promise<PaymentVerificationResult> {
  const provider = getProvider(params.provider);

  // 1. Delegate provider signature and status inquiry verification
  const verifyResult = await provider.verifyPayment({
    orderReference: params.orderReference,
    rawPayload: params.rawPayload,
    providerTransactionId: params.providerTransactionId,
  });

  const orderRef = verifyResult.orderReference || params.orderReference;


  // 2. Load order from database
  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.orderReference, orderRef),
    with: {
      items: true,
      payments: true,
    },
  });

  if (!order) {
    return {
      success: false,
      orderReference: orderRef,
      paymentId: '',
      status: 'failed',
      amount: 0,
      error: `Order ${orderRef} was not found in database.`,
    };
  }

  // 3. Idempotency Check: if already marked paid and confirmed, do not double-process
  if (order.paymentStatus === 'paid' && order.status === 'confirmed') {
    return {
      success: true,
      orderReference: order.orderReference,
      paymentId: verifyResult.paymentId || order.id,
      status: 'paid',
      amount: order.total,
      alreadyProcessed: true,
      providerTransactionId: verifyResult.providerTransactionId,
    };
  }

  // 4. Verify Amount Security Check (Requirement 17)
  if (verifyResult.success && verifyResult.status === 'paid') {
    if (Math.round(verifyResult.amount) !== Math.round(order.total)) {
      console.error(
        `PAYMENT SECURITY ALERT: Amount mismatch on order ${orderRef}. Provider sent: ${verifyResult.amount}, Authoritative order total: ${order.total}`
      );

      // Record failed payment due to amount mismatch
      await db.update(schema.payments)
        .set({
          status: 'failed',
          metadata: {
            error: 'AMOUNT_MISMATCH',
            providerAmount: verifyResult.amount,
            expectedAmount: order.total,
          },
          updatedAt: new Date(),
        })
        .where(eq(schema.payments.orderId, order.id));

      return {
        success: false,
        orderReference: orderRef,
        paymentId: verifyResult.paymentId,
        status: 'failed',
        amount: verifyResult.amount,
        error: 'Payment amount mismatch between gateway and database.',
      };
    }

    // 5. Successful Payment Transaction: Update payment, finalize reservations, and transition order
    await db.update(schema.payments)
      .set({
        status: 'paid',
        providerTransactionId: verifyResult.providerTransactionId || null,
        providerReference: verifyResult.providerReference || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.payments.orderId, order.id));

    // Commit stock reservations
    await db.update(schema.stockReservations)
      .set({ status: 'committed' })
      .where(eq(schema.stockReservations.orderId, order.id));

    // Transition order state to confirmed
    await db.update(schema.orders)
      .set({
        status: 'confirmed',
        paymentStatus: 'paid',
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, order.id));

    // 6. Send Payment Confirmation Email (Idempotent)
    if (!order.paymentConfirmationEmailSent) {
      await sendPaymentSuccessEmail({
        orderReference: order.orderReference,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        paymentMethod: order.paymentMethod,
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        subtotal: order.subtotal,
        total: order.total,
        deliveryAddress: order.deliveryAddress,
        items: order.items.map((i) => ({
          productName: i.productNameSnapshot,
          variantName: i.variantNameSnapshot || undefined,
          sku: i.skuSnapshot || undefined,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.lineTotal,
        })),
      });

      await db.update(schema.orders)
        .set({ paymentConfirmationEmailSent: true })
        .where(eq(schema.orders.id, order.id));
    }

    revalidatePath('/admin/orders');
    revalidatePath('/account/orders');
    revalidatePath(`/order-confirmation/${order.orderReference}`);

    return {
      success: true,
      orderReference: order.orderReference,
      paymentId: verifyResult.paymentId,
      status: 'paid',
      amount: order.total,
      providerTransactionId: verifyResult.providerTransactionId,
    };
  } else {
    // Payment failed or was cancelled by user
    await db.update(schema.payments)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(schema.payments.orderId, order.id));

    // Release temporary stock reservation
    await db.update(schema.stockReservations)
      .set({ status: 'released' })
      .where(eq(schema.stockReservations.orderId, order.id));

    return {
      success: false,
      orderReference: orderRef,
      paymentId: verifyResult.paymentId,
      status: 'failed',
      amount: verifyResult.amount,
      error: verifyResult.error || 'Payment was not completed.',
    };
  }
}

/**
 * Rechecks payment status with external gateway (Admin & reconciliation view)
 */
export async function recheckPaymentStatusService(orderReference: string) {
  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.orderReference, orderReference),
    with: {
      payments: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${orderReference} not found`);
  }

  const latestPayment = order.payments[0];
  if (!latestPayment) {
    throw new Error('No payment records for this order');
  }

  if (latestPayment.provider === 'cod') {
    return { success: true, status: order.paymentStatus, message: 'COD verified upon delivery' };
  }

  const provider = getProvider(latestPayment.provider as PaymentMethod);
  const result = await provider.checkStatus({
    orderReference: order.orderReference,
    paymentId: latestPayment.id,
    amount: order.total,
  });

  if (result.success && result.status === 'paid' && order.paymentStatus !== 'paid') {
    await processPaymentVerification({
      provider: latestPayment.provider as PaymentMethod,
      orderReference,
      rawPayload: { verifiedViaRecheck: true },
    });
  }

  return result;
}
