import {
  PaymentProvider,
  PaymentInitiationParams,
  PaymentInitiationResult,
  PaymentVerificationParams,
  PaymentVerificationResult,
} from '../types';

export class CodPaymentProvider implements PaymentProvider {
  id = 'cod' as const;
  name = 'Cash on Delivery';

  isEnabled(): boolean {
    return true;
  }

  async initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    return {
      success: true,
      paymentId: `pay_cod_${Date.now()}`,
      orderReference: params.orderReference,
      method: 'cod',
      status: 'pending',
    };
  }

  async verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult> {
    // COD is paid upon courier delivery, not through gateway callbacks
    return {
      success: true,
      orderReference: params.orderReference,
      paymentId: `pay_cod_${params.orderReference}`,
      status: 'pending',
      amount: 0,
    };
  }

  async checkStatus(params: { orderReference: string; paymentId: string; amount: number }): Promise<PaymentVerificationResult> {
    return {
      success: true,
      orderReference: params.orderReference,
      paymentId: params.paymentId,
      status: 'pending',
      amount: params.amount,
    };
  }
}

export const codProvider = new CodPaymentProvider();
