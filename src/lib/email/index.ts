import nodemailer, { type Transporter } from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../env';
import {
  EmailOrderData,
  renderCodOrderEmailHtml,
  renderOnlinePaymentSuccessEmailHtml,
} from './templates';

let resendClient: Resend | null = null;
let smtpTransporter: Transporter | null = null;

function getSmtpTransporter(): Transporter | null {

  if (!env.SMTP_USER || !env.SMTP_PASS) return null;
  if (!smtpTransporter) {
    const host = env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(env.SMTP_PORT || '465');
    const secure = port === 465;
    smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS.replace(/\s+/g, ''),
      },

    });
  }
  return smtpTransporter;
}

function getResendClient(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}

async function dispatchEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; messageId?: string; logged?: boolean; error?: string }> {
  if (env.EMAIL_ENABLED === 'false') {
    return { success: true, logged: true };
  }

  // 1. Try Gmail / SMTP if configured
  const smtp = getSmtpTransporter();
  if (smtp) {
    try {
      const from = env.EMAIL_FROM && !env.EMAIL_FROM.includes('@dealdrip.store')
        ? env.EMAIL_FROM
        : `Deal Drip Store <${env.SMTP_USER}>`;

      const info = await smtp.sendMail({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });

      console.log(`[Email SMTP/Gmail] Successfully sent email to ${params.to} [Message ID: ${info.messageId}]`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error('[Email SMTP/Gmail] Failed to send via Gmail SMTP:', err);
      return { success: false, error: err.message };
    }
  }

  // 2. Try Resend if configured
  const resend = getResendClient();
  if (resend) {
    try {
      const from = env.EMAIL_FROM || 'Deal Drip Store <order@dealdrip.store>';
      const { data, error } = await resend.emails.send({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      });

      if (error) {
        console.warn('[Email Resend] Error dispatching email:', error);
        return { success: false, error: error.message };
      }

      console.log(`[Email Resend] Successfully sent email to ${params.to} [ID: ${data?.id}]`);
      return { success: true, messageId: data?.id };
    } catch (err: any) {
      console.error('[Email Resend] Exception sending email:', err);
      return { success: false, error: err.message };
    }
  }

  // 3. Development logger fallback (if neither is configured)
  console.log(`[Email Mock/Dev] Dispatching email to ${params.to}`);
  console.log(`  Subject: ${params.subject}`);
  return { success: true, logged: true };
}

export async function sendCodOrderConfirmationEmail(orderData: EmailOrderData): Promise<{
  success: boolean;
  messageId?: string;
  logged?: boolean;
  error?: string;
}> {
  const html = renderCodOrderEmailHtml(orderData);
  const subject = `Order Placed (Cash on Delivery) — Deal Drip Store [Ref: ${orderData.orderReference}]`;

  return await dispatchEmail({
    to: orderData.customerEmail,
    subject,
    html,
  });
}

export async function sendPaymentSuccessEmail(orderData: EmailOrderData): Promise<{
  success: boolean;
  messageId?: string;
  logged?: boolean;
  error?: string;
}> {
  const html = renderOnlinePaymentSuccessEmailHtml(orderData);
  const subject = `Payment Verified — Deal Drip Store [Ref: ${orderData.orderReference}]`;

  return await dispatchEmail({
    to: orderData.customerEmail,
    subject,
    html,
  });
}
