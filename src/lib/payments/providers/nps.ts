import crypto from 'crypto';
import { env } from '@/lib/env';
import {
  PaymentProvider,
  PaymentInitiationParams,
  PaymentInitiationResult,
  PaymentVerificationParams,
  PaymentVerificationResult,
} from '../types';

/**
 * Nepal Payment Solutions (NPS / OnePG Gateway) Provider Implementation
 * Official Developer Guidelines 2025 specification.
 */
export class NpsPaymentProvider implements PaymentProvider {
  id = 'nps' as const;
  name = 'Card / Bank Payment (Nepal Payment Solutions)';

  isEnabled(): boolean {
    return (
      env.NPS_ENABLED !== 'false' &&
      !!(
        env.NPS_MERCHANT_ID &&
        env.NPS_MERCHANT_NAME &&
        env.NPS_API_PASSWORD &&
        env.NPS_SECRET_KEY
      )
    );
  }

  private getMerchantId(): string {
    return env.NPS_MERCHANT_ID || '9669';
  }

  private getMerchantName(): string {
    return env.NPS_MERCHANT_NAME || 'ddesAPI';
  }

  private getApiPassword(): string {
    return env.NPS_API_PASSWORD || 'Deal@134';
  }

  private getSecretKey(): string {
    return env.NPS_SECRET_KEY || 'NR3T1G7wCrCJMRFm4RI30Q';
  }

  private getApiBaseUrl(): string {
    return env.NPS_API_BASE_URL || 'https://apisandbox.nepalpayment.com';
  }

  private getGatewayUrl(): string {
    return env.NPS_GATEWAY_URL || 'https://gatewaysandbox.nepalpayment.com/Payment/Index';
  }

  private getBasicAuthHeader(): string {
    const creds = `${this.getMerchantName()}:${this.getApiPassword()}`;
    return `Basic ${Buffer.from(creds).toString('base64')}`;
  }

  /**
   * Generates HMAC-SHA512 lowercase hex signature per NPS OnePG Specification
   */
  generateSignature(message: string, secretKey: string): string {
    const hmac = crypto.createHmac('sha512', secretKey);
    hmac.update(message, 'utf8');
    return hmac.digest('hex');
  }

  /**
   * Generates ProcessId and builds OnePG Gateway redirect parameters
   */
  async initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    try {
      const merchantId = this.getMerchantId();
      const merchantName = this.getMerchantName();
      const secretKey = this.getSecretKey();
      const baseUrl = this.getApiBaseUrl();
      const gatewayUrl = this.getGatewayUrl();

      const amountStr = String(params.amount);
      const merchantTxnId = params.orderReference;

      // Signature: sorted keys (Amount, MerchantId, MerchantName, MerchantTxnId)
      const messageToSign = `${amountStr}${merchantId}${merchantName}${merchantTxnId}`;
      const signature = this.generateSignature(messageToSign, secretKey);

      const paymentId = `pay_nps_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      // Step 1: Call GetProcessId
      const processIdUrl = `${baseUrl}/GetProcessId`;
      const response = await fetch(processIdUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.getBasicAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          MerchantId: merchantId,
          MerchantName: merchantName,
          Amount: amountStr,
          MerchantTxnId: merchantTxnId,
          Signature: signature,
        }),
      });

      if (!response.ok) {
        throw new Error(`NPS GetProcessId HTTP error: ${response.status} ${response.statusText}`);
      }

      const resData = await response.json();

      if (resData.code !== '0' || !resData.data?.ProcessId) {
        const errorMsg =
          resData.errors?.[0]?.error_message ||
          resData.message ||
          'Failed to obtain OnePG ProcessId';
        throw new Error(`NPS Gateway error: ${errorMsg}`);
      }

      const processId = resData.data.ProcessId;

      // Form submission parameters for redirect to OnePG gateway
      const responseUrl = `${params.callbackBaseUrl}/api/payments/nps/response`;
      const formData: Record<string, string> = {
        MerchantId: merchantId,
        MerchantName: merchantName,
        Amount: amountStr,
        MerchantTxnId: merchantTxnId,
        ProcessId: processId,
        InstrumentCode: '',
        TransactionRemarks: `Deal Drip Store Order ${params.orderReference}`,
        ResponseUrl: responseUrl,
      };

      return {
        success: true,
        paymentId,
        orderReference: params.orderReference,
        method: 'nps',
        status: 'pending',
        formAction: gatewayUrl,
        formData,
      };
    } catch (err: any) {
      console.error('NPS Payment Initiation failed:', err);
      return {
        success: false,
        paymentId: '',
        orderReference: params.orderReference,
        method: 'nps',
        status: 'failed',
        error: err.message || 'NPS Payment initiation failed',
      };
    }
  }

  /**
   * Authoritative transaction verification via CheckTransactionStatus
   */
  async verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult> {
    try {
      const merchantId = this.getMerchantId();
      const merchantName = this.getMerchantName();
      const secretKey = this.getSecretKey();
      const baseUrl = this.getApiBaseUrl();

      const merchantTxnId = params.orderReference;

      // Signature: sorted keys (MerchantId, MerchantName, MerchantTxnId)
      const messageToSign = `${merchantId}${merchantName}${merchantTxnId}`;
      const signature = this.generateSignature(messageToSign, secretKey);

      const statusUrl = `${baseUrl}/CheckTransactionStatus`;
      const response = await fetch(statusUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.getBasicAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          MerchantId: merchantId,
          MerchantName: merchantName,
          MerchantTxnId: merchantTxnId,
          Signature: signature,
        }),
      });

      if (!response.ok) {
        throw new Error(`NPS CheckTransactionStatus HTTP error: ${response.status}`);
      }

      const resData = await response.json();

      if (resData.code !== '0' || !resData.data) {
        return {
          success: false,
          orderReference: params.orderReference,
          paymentId: '',
          status: 'failed',
          amount: 0,
          error: resData.message || resData.errors?.[0]?.error_message || 'Transaction status check failed',
        };
      }

      const txData = resData.data;
      const statusStr = String(txData.Status || '').toLowerCase();
      const amount = Number(txData.Amount || 0);

      if (statusStr === 'success') {
        return {
          success: true,
          orderReference: params.orderReference,
          paymentId: `pay_nps_${txData.GatewayReferenceNo || Date.now()}`,
          status: 'paid',
          amount,
          providerTransactionId: txData.GatewayReferenceNo,
          providerReference: txData.ProcessId,
        };
      } else if (statusStr === 'pending') {
        return {
          success: true,
          orderReference: params.orderReference,
          paymentId: `pay_nps_${txData.GatewayReferenceNo || Date.now()}`,
          status: 'pending',
          amount,
          providerTransactionId: txData.GatewayReferenceNo,
        };
      } else {
        return {
          success: false,
          orderReference: params.orderReference,
          paymentId: '',
          status: 'failed',
          amount,
          error: txData.CbsMessage || 'Transaction failed or was declined',
        };
      }
    } catch (err: any) {
      console.error('NPS VerifyPayment Exception:', err);
      return {
        success: false,
        orderReference: params.orderReference,
        paymentId: '',
        status: 'failed',
        amount: 0,
        error: err.message || 'NPS verification inquiry failed',
      };
    }
  }

  async checkStatus(params: {
    orderReference: string;
    paymentId: string;
    amount: number;
  }): Promise<PaymentVerificationResult> {
    return await this.verifyPayment({
      orderReference: params.orderReference,
    });
  }
}

export const npsProvider = new NpsPaymentProvider();

