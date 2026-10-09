import { formatMoney } from '@/data/catalog';

export interface EmailOrderData {
  orderReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  subtotal: number;
  total: number;
  deliveryAddress: {
    country: string;
    province: string;
    district: string;
    municipality: string;
    ward: string;
    areaTole: string;
    streetLandmark?: string;
  };
  items: Array<{
    productName: string;
    variantName?: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

export function renderCodOrderEmailHtml(data: EmailOrderData): string {
  const itemsHtml = data.items
    .map(
      (it) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #222;">
        <strong>${it.productName}</strong> ${it.variantName ? `<br><span style="font-size: 12px; color: #888;">Finish: ${it.variantName}</span>` : ''}
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #222; text-align: center;">${it.quantity}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #222; text-align: right;">${formatMoney(it.lineTotal)}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Deal Drip — Order Received</title>
</head>
<body style="margin: 0; padding: 24px; background: #0a0b0d; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #12141a; border: 1px solid #232732; border-radius: 12px; padding: 32px;">
    <!-- Brand Header -->
    <div style="border-bottom: 1px solid #232732; padding-bottom: 20px; margin-bottom: 24px; text-align: center;">
      <h1 style="color: #fff; font-size: 22px; font-weight: 800; letter-spacing: 0.05em; margin: 0 0 6px 0;">DEAL DRIP STORE</h1>
      <p style="color: #94a3b8; font-size: 13px; margin: 0;">Objects For What’s Next · Nepal Market</p>
    </div>

    <!-- Order Status Notice -->
    <div style="background: rgba(223, 255, 79, 0.08); border: 1px solid rgba(223, 255, 79, 0.25); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #dfff4f; letter-spacing: 0.05em;">Order Placed · Cash on Delivery</span>
      <h2 style="font-size: 18px; color: #fff; margin: 4px 0 0 0;">Thank you, ${data.customerName}!</h2>
      <p style="font-size: 13px; color: #cbd5e1; margin: 4px 0 0 0;">
        Your order has been recorded in our system. Payment of <strong>${formatMoney(data.total)}</strong> is due in cash upon doorstep delivery.
      </p>
    </div>

    <!-- Reference Pill -->
    <div style="background: #0e1014; border: 1px solid #232732; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px; display: flex; justify-content: space-between;">
      <span style="color: #94a3b8; font-size: 13px;">Order Reference:</span>
      <strong style="color: #dfff4f; font-family: monospace; font-size: 15px;">${data.orderReference}</strong>
    </div>

    <!-- Items Table -->
    <h3 style="font-size: 14px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin: 0 0 12px 0;">Order Summary</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e2e8f0; margin-bottom: 20px;">
      <thead>
        <tr style="border-bottom: 1px solid #333; color: #888; font-size: 12px; text-align: left;">
          <th style="padding-bottom: 8px;">Product</th>
          <th style="padding-bottom: 8px; text-align: center;">Qty</th>
          <th style="padding-bottom: 8px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Totals -->
    <div style="border-top: 1px solid #232732; padding-top: 12px; margin-bottom: 24px; font-size: 14px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #94a3b8;">
        <span>Subtotal</span>
        <span>${formatMoney(data.subtotal)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #94a3b8;">
        <span>Delivery (Nepal Doorstep)</span>
        <span style="color: #4ade80;">Calculated at checkout</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #fff;">
        <span>Total Amount</span>
        <span style="color: #dfff4f;">${formatMoney(data.total)}</span>
      </div>
    </div>

    <!-- Delivery Destination -->
    <div style="background: #0e1014; border: 1px solid #232732; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #cbd5e1; line-height: 1.6;">
      <strong style="color: #fff; display: block; margin-bottom: 4px;">Nepal Delivery Destination:</strong>
      ${data.deliveryAddress.areaTole}, Ward ${data.deliveryAddress.ward}<br>
      ${data.deliveryAddress.municipality}, ${data.deliveryAddress.district}<br>
      ${data.deliveryAddress.province}, Nepal<br>
      Phone: <strong>${data.customerPhone}</strong>
    </div>

    <!-- Support Footer -->
    <div style="border-top: 1px solid #232732; padding-top: 16px; text-align: center; font-size: 12px; color: #64748b;">
      <p style="margin: 0 0 4px 0;">Need help with your order? Contact <a href="mailto:support@dealdrip.store" style="color: #dfff4f; text-decoration: none;">support@dealdrip.store</a></p>
      <p style="margin: 0;">Deal Drip Store · Kathmandu, Nepal · https://dealdrip.store</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function renderOnlinePaymentSuccessEmailHtml(data: EmailOrderData): string {
  const itemsHtml = data.items
    .map(
      (it) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #222;">
        <strong>${it.productName}</strong> ${it.variantName ? `<br><span style="font-size: 12px; color: #888;">Finish: ${it.variantName}</span>` : ''}
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #222; text-align: center;">${it.quantity}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #222; text-align: right;">${formatMoney(it.lineTotal)}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Deal Drip — Payment Verified</title>
</head>
<body style="margin: 0; padding: 24px; background: #0a0b0d; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #12141a; border: 1px solid #232732; border-radius: 12px; padding: 32px;">
    <!-- Brand Header -->
    <div style="border-bottom: 1px solid #232732; padding-bottom: 20px; margin-bottom: 24px; text-align: center;">
      <h1 style="color: #fff; font-size: 22px; font-weight: 800; letter-spacing: 0.05em; margin: 0 0 6px 0;">DEAL DRIP STORE</h1>
      <p style="color: #94a3b8; font-size: 13px; margin: 0;">Objects For What’s Next · Nepal Market</p>
    </div>

    <!-- Verified Badge -->
    <div style="background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4ade80; letter-spacing: 0.05em;">Payment Verified · ${data.paymentMethod.toUpperCase()}</span>
      <h2 style="font-size: 18px; color: #fff; margin: 4px 0 0 0;">Payment Successful, ${data.customerName}!</h2>
      <p style="font-size: 13px; color: #cbd5e1; margin: 4px 0 0 0;">
        Your digital payment of <strong>${formatMoney(data.total)}</strong> has been verified. Your hardware order is confirmed and transitioning to courier fulfillment.
      </p>
    </div>

    <!-- Reference Pill -->
    <div style="background: #0e1014; border: 1px solid #232732; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px; display: flex; justify-content: space-between;">
      <span style="color: #94a3b8; font-size: 13px;">Order Reference:</span>
      <strong style="color: #dfff4f; font-family: monospace; font-size: 15px;">${data.orderReference}</strong>
    </div>

    <!-- Items Table -->
    <h3 style="font-size: 14px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin: 0 0 12px 0;">Purchased Items</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e2e8f0; margin-bottom: 20px;">
      <thead>
        <tr style="border-bottom: 1px solid #333; color: #888; font-size: 12px; text-align: left;">
          <th style="padding-bottom: 8px;">Product</th>
          <th style="padding-bottom: 8px; text-align: center;">Qty</th>
          <th style="padding-bottom: 8px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Totals -->
    <div style="border-top: 1px solid #232732; padding-top: 12px; margin-bottom: 24px; font-size: 14px;">
      <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #fff;">
        <span>Amount Paid</span>
        <span style="color: #4ade80;">${formatMoney(data.total)}</span>
      </div>
    </div>

    <!-- Delivery Destination -->
    <div style="background: #0e1014; border: 1px solid #232732; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #cbd5e1; line-height: 1.6;">
      <strong style="color: #fff; display: block; margin-bottom: 4px;">Delivery Destination:</strong>
      ${data.deliveryAddress.areaTole}, Ward ${data.deliveryAddress.ward}<br>
      ${data.deliveryAddress.municipality}, ${data.deliveryAddress.district}, ${data.deliveryAddress.province}
    </div>

    <!-- Support Footer -->
    <div style="border-top: 1px solid #232732; padding-top: 16px; text-align: center; font-size: 12px; color: #64748b;">
      <p style="margin: 0 0 4px 0;">Questions? Reach out to <a href="mailto:support@dealdrip.store" style="color: #dfff4f; text-decoration: none;">support@dealdrip.store</a></p>
      <p style="margin: 0;">Deal Drip Store · Kathmandu, Nepal · https://dealdrip.store</p>
    </div>
  </div>
</body>
</html>
  `;
}
