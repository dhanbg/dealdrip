export type PaymentStatus =
  | 'created'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 'cod' | 'esewa' | 'nps';

export interface PaymentInitiationParams {
  orderId: string;
  orderReference: string;
  amount: number; // integer NPR
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  callbackBaseUrl: string;
}

export interface PaymentInitiationResult {
  success: boolean;
  paymentId: string;
  orderReference: string;
  method: PaymentMethod;
  status: PaymentStatus;
  // If redirect/form post is required (e.g. eSewa ePay v2)
  formAction?: string;
  formData?: Record<string, string>;
  redirectUrl?: string;
  error?: string;
}

export interface PaymentVerificationParams {
  orderReference: string;
  providerTransactionId?: string;
  rawPayload?: any;
}

export interface PaymentVerificationResult {
  success: boolean;
  orderReference: string;
  paymentId: string;
  status: PaymentStatus;
  amount: number;
  providerTransactionId?: string;
  providerReference?: string;
  alreadyProcessed?: boolean;
  error?: string;
}

export interface PaymentProvider {
  id: PaymentMethod;
  name: string;
  isEnabled(): boolean;
  initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult>;
  verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult>;
  checkStatus(params: { orderReference: string; paymentId: string; amount: number }): Promise<PaymentVerificationResult>;
}
