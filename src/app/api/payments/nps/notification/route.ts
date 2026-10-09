import { NextRequest, NextResponse } from 'next/server';
import { processPaymentVerification } from '@/lib/payments/service';

/**
 * NPS OnePG Webhook / Notification Listener
 * Receives GET requests from NPS server: ?MerchantTxnId=...&GatewayTxnId=...
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantTxnId = searchParams.get('MerchantTxnId');
    const gatewayTxnId = searchParams.get('GatewayTxnId');

    if (!merchantTxnId) {
      return new NextResponse('Missing MerchantTxnId', { status: 400 });
    }

    const verification = await processPaymentVerification({
      provider: 'nps',
      orderReference: merchantTxnId,
      providerTransactionId: gatewayTxnId || undefined,
    });

    if (verification.alreadyProcessed) {
      return new NextResponse('already received', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return new NextResponse('received', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (err: any) {
    console.error('NPS notification webhook error:', err);
    return new NextResponse('received', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
