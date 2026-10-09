import { NextRequest, NextResponse } from 'next/server';
import { processPaymentVerification } from '@/lib/payments/service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = searchParams.get('data');

    if (!data) {
      return NextResponse.redirect(new URL('/checkout/payment-failed?reason=missing_payload', req.url));
    }

    const verification = await processPaymentVerification({
      provider: 'esewa',
      orderReference: '',
      rawPayload: { data },
    });

    if (verification.success && verification.status === 'paid') {
      return NextResponse.redirect(
        new URL(`/order-confirmation/${verification.orderReference}?verified=true`, req.url)
      );
    } else {
      const orderRef = verification.orderReference || 'unknown';
      const reason = encodeURIComponent(verification.error || 'Transaction verification unsuccessful');
      return NextResponse.redirect(
        new URL(`/checkout/payment-failed?orderRef=${orderRef}&reason=${reason}`, req.url)
      );
    }
  } catch (err: any) {
    console.error('eSewa callback handling failed:', err);
    return NextResponse.redirect(
      new URL(`/checkout/payment-failed?reason=${encodeURIComponent(err.message || 'Server error')}`, req.url)
    );
  }
}
