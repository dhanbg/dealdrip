import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderRef = searchParams.get('orderRef') || '';
  return NextResponse.redirect(
    new URL(`/checkout/payment-failed?orderRef=${orderRef}&reason=cancelled_by_user`, req.url)
  );
}
