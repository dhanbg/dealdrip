import { NextRequest, NextResponse } from 'next/server';
import { processPaymentVerification } from '@/lib/payments/service';

/**
 * NPS OnePG Response URL (Customer Redirection)
 * Receives GET requests when customer returns from OnePG Gateway:
 * ?MerchantTxnId=...&GatewayTxnId=...
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantTxnId = searchParams.get('MerchantTxnId');
    const gatewayTxnId = searchParams.get('GatewayTxnId');

    if (!merchantTxnId) {
      return NextResponse.redirect(
        new URL('/checkout/payment-failed?reason=missing_transaction_reference', req.url)
      );
    }

    const verification = await processPaymentVerification({
      provider: 'nps',
      orderReference: merchantTxnId,
      providerTransactionId: gatewayTxnId || undefined,
    });

    if (verification.success && verification.status === 'paid') {
      return NextResponse.redirect(
        new URL(`/order-confirmation/${merchantTxnId}?verified=true`, req.url)
      );
    } else {
      const reason = encodeURIComponent(
        verification.error || 'Transaction verification unsuccessful or cancelled'
      );
      return NextResponse.redirect(
        new URL(`/checkout/payment-failed?orderRef=${merchantTxnId}&reason=${reason}`, req.url)
      );
    }
  } catch (err: any) {
    console.error('NPS response handler error:', err);
    return NextResponse.redirect(
      new URL(`/checkout/payment-failed?reason=${encodeURIComponent(err.message || 'Server error')}`, req.url)
    );
  }
}
