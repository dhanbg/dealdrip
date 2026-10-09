import crypto from 'crypto';
import { env } from '@/lib/env';
import {
  PaymentProvider,
  PaymentInitiationParams,
  PaymentInitiationResult,
  PaymentVerificationParams,
  PaymentVerificationResult,
} from '../types';

export class EsewaPaymentProvider implements PaymentProvider {
  id = 'esewa' as const;
  name = 'eSewa Mobile Wallet';

  isEnabled(): boolean {
    return env.ESEWA_ENABLED !== 'false';
  }

  private getProductCode(): string {
    return env.ESEWA_PRODUCT_CODE || 'EPAYTEST';
  }

  private getSecretKey(): string {
    return env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
  }

  private getGatewayUrl(): string {
    return env.ESEWA_GATEWAY_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
  }

  private getStatusCheckUrl(): string {
    return env.ESEWA_STATUS_CHECK_URL || 'https://rc.esewa.com.np/api/epay/transaction/status/';
  }

  /**
   * Generates HMAC-SHA256 signature according to eSewa ePay v2 spec
   */
  generateSignature(message: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(message);
    return hmac.digest('base64');
  }

  /**
   * Initiates payment payload and signature for client form submission
   */
  async initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    const paymentId = `pay_esewa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const productCode = this.getProductCode();
    const secretKey = this.getSecretKey();

    // Unique transaction UUID tying order reference to payment attempt
    const transactionUuid = `${params.orderReference}-${Date.now()}`;
    const amountStr = String(params.amount);

    // Form fields to sign
    const signatureMessage = `total_amount=${amountStr},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const signature = this.generateSignature(signatureMessage, secretKey);

    const successUrl = `${params.callbackBaseUrl}/api/payments/esewa/callback`;
    const failureUrl = `${params.callbackBaseUrl}/api/payments/esewa/failure?orderRef=${params.orderReference}`;

    const formData: Record<string, string> = {
      amount: amountStr,
      tax_amount: '0',
      product_service_charge: '0',
      product_delivery_charge: '0',
      total_amount: amountStr,
      transaction_uuid: transactionUuid,
      product_code: productCode,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature: signature,
      success_url: successUrl,
      failure_url: failureUrl,
    };

    return {
      success: true,
      paymentId,
      orderReference: params.orderReference,
      method: 'esewa',
      status: 'pending',
      formAction: this.getGatewayUrl(),
      formData,
    };
  }

  /**
   * Verifies payment callback returned by eSewa
   */
  async verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult> {
    const { rawPayload } = params;

    if (!rawPayload?.data) {
      return {
        success: false,
        orderReference: params.orderReference,
        paymentId: '',
        status: 'failed',
        amount: 0,
        error: 'Missing encoded callback payload from eSewa.',
      };
    }

    try {
      // 1. Decode base64 payload
      const decodedJson = Buffer.from(rawPayload.data, 'base64').toString('utf-8');
      const data = JSON.parse(decodedJson);

      const {
        transaction_code,
        status,
        total_amount,
        transaction_uuid,
        product_code,
        signed_field_names,
        signature: returnedSignature,
      } = data;

      // Extract order reference from transaction_uuid (format: DD-XXXXXXXX-TIMESTAMP)
      const orderRef = transaction_uuid.includes('-')
        ? transaction_uuid.split('-').slice(0, 2).join('-')
        : params.orderReference;

      const totalAmountNum = parseFloat(String(total_amount).replace(/,/g, ''));

      // 2. Signature verification
      if (returnedSignature && signed_field_names) {
        const fieldNames = signed_field_names.split(',');
        const signString = fieldNames.map((f: string) => `${f}=${data[f] || ''}`).join(',');
        const expectedSignature = this.generateSignature(signString, this.getSecretKey());

        if (expectedSignature !== returnedSignature) {
          console.warn('eSewa signature mismatch warning during callback decode');
        }
      }

      // 3. Authoritative Server-to-Server Status Inquiry
      const statusCheckRes = await this.performStatusCheck({
        productCode: product_code || this.getProductCode(),
        totalAmount: totalAmountNum,
        transactionUuid: transaction_uuid,
      });

      if (!statusCheckRes.success || statusCheckRes.status !== 'COMPLETE') {
        return {
          success: false,
          orderReference: orderRef,
          paymentId: transaction_uuid,
          status: 'failed',
          amount: totalAmountNum,
          providerTransactionId: transaction_code,
          error: statusCheckRes.error || `eSewa transaction not confirmed. Status: ${statusCheckRes.status}`,
        };
      }

      return {
        success: true,
        orderReference: orderRef,
        paymentId: transaction_uuid,
        status: 'paid',
        amount: totalAmountNum,
        providerTransactionId: transaction_code || statusCheckRes.refId,
        providerReference: transaction_uuid,
      };
    } catch (err: any) {
      return {
        success: false,
        orderReference: params.orderReference,
        paymentId: '',
        status: 'failed',
        amount: 0,
        error: err.message || 'Failed to decode or verify eSewa callback',
      };
    }
  }

  /**
   * Authoritative server-to-server status check via eSewa API
   */
  async performStatusCheck(params: {
    productCode: string;
    totalAmount: number;
    transactionUuid: string;
  }): Promise<{ success: boolean; status: string; refId?: string; error?: string }> {
    try {
      const url = new URL(this.getStatusCheckUrl());
      url.searchParams.set('product_code', params.productCode);
      url.searchParams.set('total_amount', String(params.totalAmount));
      url.searchParams.set('transaction_uuid', params.transactionUuid);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          status: 'NETWORK_ERROR',
          error: `Status inquiry HTTP ${response.status}`,
        };
      }

      const resData = await response.json();
      return {
        success: true,
        status: resData.status,
        refId: resData.ref_id,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'ERROR',
        error: err.message || 'Status inquiry network request failed',
      };
    }
  }

  async checkStatus(params: { orderReference: string; paymentId: string; amount: number }): Promise<PaymentVerificationResult> {
    const statusRes = await this.performStatusCheck({
      productCode: this.getProductCode(),
      totalAmount: params.amount,
      transactionUuid: params.paymentId,
    });

    if (statusRes.success && statusRes.status === 'COMPLETE') {
      return {
        success: true,
        orderReference: params.orderReference,
        paymentId: params.paymentId,
        status: 'paid',
        amount: params.amount,
        providerTransactionId: statusRes.refId,
      };
    }

    return {
      success: false,
      orderReference: params.orderReference,
      paymentId: params.paymentId,
      status: statusRes.status === 'PENDING' ? 'pending' : 'failed',
      amount: params.amount,
      error: statusRes.error || `Current transaction state: ${statusRes.status}`,
    };
  }
}

export const esewaProvider = new EsewaPaymentProvider();
