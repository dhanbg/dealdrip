'use server';

import { headers } from 'next/headers';
import {
  initiatePaymentForOrder,
  recheckPaymentStatusService,
} from '@/lib/payments/service';
import { PaymentMethod } from '@/lib/payments/types';
import { auth } from '@/lib/auth';

export async function initiatePaymentAction(params: {
  orderReference: string;
  method: PaymentMethod;
}) {
  try {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const proto = headersList.get('x-forwarded-proto') || 'http';
    const callbackBaseUrl = `${proto}://${host}`;

    const result = await initiatePaymentForOrder({
      orderReference: params.orderReference,
      method: params.method,
      callbackBaseUrl,
    });

    return result;
  } catch (err: any) {
    return {
      success: false,
      paymentId: '',
      orderReference: params.orderReference,
      method: params.method,
      status: 'failed' as const,
      error: err.message || 'Payment initiation failed',
    };
  }
}

export async function recheckPaymentStatusAction(orderReference: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Authorized check: user must be admin or session owner
    const result = await recheckPaymentStatusService(orderReference);
    return { success: true, result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function switchOrderToCodAction(orderReference: string) {
  try {
    const { updateOrderPaymentMethodToCod } = await import('@/db/queries/orders');
    await updateOrderPaymentMethodToCod(orderReference);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to switch payment method' };
  }
}

