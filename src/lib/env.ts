import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url().optional(),
    ADMIN_EMAIL: z.string().email().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // Cloudflare R2
    R2_ACCOUNT_ID: z.string().optional().default('40a9054b6e43137e50a437d974f3476d'),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET_NAME: z.string().optional().default('dealdrip-media'),
    R2_ENDPOINT: z.string().optional(),

    // eSewa Gateway (ePay v2 Recommended Intent flow)
    ESEWA_PRODUCT_CODE: z.string().optional().default('EPAYTEST'),
    ESEWA_SECRET_KEY: z.string().optional().default('8gBm/:&EnhH.1/q'),
    ESEWA_GATEWAY_URL: z.string().optional().default('https://rc-epay.esewa.com.np/api/epay/main/v2/form'),
    ESEWA_STATUS_CHECK_URL: z.string().optional().default('https://rc.esewa.com.np/api/epay/transaction/status/'),
    ESEWA_ENABLED: z.string().optional().default('true'),

    // Nepal Payment Solutions (OnePG / NPX Gateway)
    NPS_ENABLED: z.string().optional().default('true'),
    NPS_MERCHANT_ID: z.string().optional().default('9669'),
    NPS_MERCHANT_NAME: z.string().optional().default('ddesAPI'),
    NPS_API_PASSWORD: z.string().optional().default('Deal@134'),
    NPS_SECRET_KEY: z.string().optional().default('NR3T1G7wCrCJMRFm4RI30Q'),
    NPS_API_BASE_URL: z.string().optional().default('https://apisandbox.nepalpayment.com'),
    NPS_GATEWAY_URL: z.string().optional().default('https://gatewaysandbox.nepalpayment.com/Payment/Index'),


    // Transactional Email
    RESEND_API_KEY: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional().default('465'),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().optional().default('Deal Drip Store <order@dealdrip.store>'),
    EMAIL_SUPPORT: z.string().optional().default('support@dealdrip.store'),
    EMAIL_ENABLED: z.string().optional().default('true'),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_MEDIA_URL: z.string().optional().default('https://media.dealdrip.store'),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_ENDPOINT: process.env.R2_ENDPOINT,

    ESEWA_PRODUCT_CODE: process.env.ESEWA_PRODUCT_CODE,
    ESEWA_SECRET_KEY: process.env.ESEWA_SECRET_KEY,
    ESEWA_GATEWAY_URL: process.env.ESEWA_GATEWAY_URL,
    ESEWA_STATUS_CHECK_URL: process.env.ESEWA_STATUS_CHECK_URL,
    ESEWA_ENABLED: process.env.ESEWA_ENABLED,

    NPS_ENABLED: process.env.NPS_ENABLED,
    NPS_MERCHANT_ID: process.env.NPS_MERCHANT_ID,
    NPS_MERCHANT_NAME: process.env.NPS_MERCHANT_NAME || process.env.NPS_API_KEY,
    NPS_API_PASSWORD: process.env.NPS_API_PASSWORD,
    NPS_SECRET_KEY: process.env.NPS_SECRET_KEY,
    NPS_API_BASE_URL: process.env.NPS_API_BASE_URL || process.env.NPS_BASE_URL,
    NPS_GATEWAY_URL: process.env.NPS_GATEWAY_URL,

    RESEND_API_KEY: process.env.RESEND_API_KEY,

    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_SUPPORT: process.env.EMAIL_SUPPORT,
    EMAIL_ENABLED: process.env.EMAIL_ENABLED,

    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_MEDIA_URL: process.env.NEXT_PUBLIC_MEDIA_URL,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
