import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl =
  process.env.NEON_AUTH_BASE_URL ||
  "https://ep-proud-dust-b3veypni.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth";

const secret =
  process.env.NEON_AUTH_COOKIE_SECRET ||
  "dealdrip_neon_auth_secret_session_key_2026_super_secure_32char_min";

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret,
    sessionDataTtl: 300, // 5 minutes session cache TTL
  },
});
