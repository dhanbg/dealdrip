# Deal Drip Store — Production Integrations & Gateway Guide (Prompt 8)

**Brand:** Deal Drip Store  
**Domain:** `https://dealdrip.store`  
**Media Delivery Domain:** `https://media.dealdrip.store`  
**Market:** Nepal Only (NPR / Rs.)  

---

## 1. Cloudflare R2 Media Storage Architecture

### Overview
Deal Drip uses Cloudflare R2 S3-compatible object storage for production product images, 3D GLB models, and homepage environment backdrops.

### S3 API Configuration
- **S3 Endpoint:** `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`
- **Region:** `auto`
- **Bucket Name:** `dealdrip-media`
- **Client SDK:** `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`

### Custom Domain Setup (`media.dealdrip.store`)
1. Log in to the Cloudflare Dashboard and navigate to **R2 > Overview > dealdrip-media**.
2. Click the **Settings** tab.
3. Under **Public access > Custom Domains**, click **Connect Domain**.
4. Enter `media.dealdrip.store` and confirm. Cloudflare will automatically provision SSL/TLS and route DNS within the `dealdrip.store` zone.
5. Set `NEXT_PUBLIC_MEDIA_URL=https://media.dealdrip.store` in production environment variables.

### CORS Configuration
In the Cloudflare R2 bucket settings under **CORS Policy**, add:
```json
[
  {
    "AllowedOrigins": [
      "https://dealdrip.store",
      "https://www.dealdrip.store",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### Media Object Key Structure
- Products Images: `products/{productId}/images/{timestamp}-{filename}.webp`
- 3D Models: `products/{productId}/models/{timestamp}-{filename}.glb`
- Environment Images: `environments/home/{theme}-{timestamp}.webp`

### Local to R2 Migration Utility
To migrate existing static models and images to your R2 bucket:
```bash
npm run db:migrate-r2
```
*Note: This script uploads assets, verifies public accessibility, and safely updates database media records without deleting local development fallbacks.*

---

## 2. eSewa ePay v2 Integration

### Architecture & Standards
Deal Drip implements eSewa's **official ePay v2 recommended flow**:
- Form POST with HMAC-SHA256 signature to eSewa gateway
- Customer redirected to eSewa login and OTP authorization
- On completion, eSewa redirects to success/failure callback with base64 encoded data
- **Server Verification Rule:** Deal Drip **never** marks an order paid solely from a browser redirect. The server performs an authoritative status query against eSewa's status API before transitioning state to `paid` and decrementing stock.

### Testing / Sandbox Credentials
- **Merchant Code (Product Code):** `EPAYTEST`
- **Secret Key:** `8gBm/:&EnhH.1/q`
- **Gateway Form URL:** `https://rc-epay.esewa.com.np/api/epay/main/v2/form`
- **Status Check URL:** `https://rc.esewa.com.np/api/epay/transaction/status/`

### Signing Specification
- Fields to sign: `total_amount=${amount},transaction_uuid=${uuid},product_code=${code}`
- Algorithm: `HMAC-SHA256`
- Encoding: `Base64`

### Callback Routes
- **Success Return:** `https://dealdrip.store/api/payments/esewa/callback?data=<BASE64_JSON>`
- **Failure Return:** `https://dealdrip.store/api/payments/esewa/failure?orderRef=<REF>`
- **Status Inquiry Endpoint:**
  `GET https://rc.esewa.com.np/api/epay/transaction/status/?product_code=...&total_amount=...&transaction_uuid=...`

### Transitioning to Production eSewa
1. Complete merchant agreement with eSewa (Nepal).
2. Request production merchant code and production HMAC secret key.
3. Whitelist `https://dealdrip.store/api/payments/esewa/callback` with eSewa support.
4. Set production environment variables:
   ```env
   ESEWA_PRODUCT_CODE=<YOUR_PRODUCTION_MERCHANT_CODE>
   ESEWA_SECRET_KEY=<YOUR_PRODUCTION_SECRET_KEY>
   ESEWA_GATEWAY_URL=https://epay.esewa.com.np/api/epay/main/v2/form
   ESEWA_STATUS_CHECK_URL=https://epay.esewa.com.np/api/epay/transaction/status/
   ```

---

## 3. Nepal Payment Solutions (NPS / OnePG Gateway) Integration

### Architecture & Specification (Developer Guidelines 2025)
Deal Drip implements the official OnePG Payment Gateway API specification:
- **Authentication Header:** `Authorization: Basic <Base64(apiusername:password)>`
- **Signature Algorithm:** `HMAC-SHA512` of alphabetically sorted payload values with secret key (`hex` lowercase output)
- **Step 1 - Process ID Generation:** Server requests `POST https://apisandbox.nepalpayment.com/GetProcessId`
- **Step 2 - Gateway Submission:** Client form POST to `https://gatewaysandbox.nepalpayment.com/Payment/Index`
- **Step 3 - Webhook Listener:** Server-to-server listener at `/api/payments/nps/notification`
- **Step 4 - Response Redirection:** Client return at `/api/payments/nps/response`
- **Step 5 - Authoritative Status Verification:** Server queries `POST https://apisandbox.nepalpayment.com/CheckTransactionStatus` before marking an order as `paid`.

### Merchant & Gateway Configuration (Sandbox / UAT)
- **Merchant ID:** `9669`
- **ApiUsername:** `ddesAPI`
- **Merchant Name:** `Deal Drip Electronic Suppliers`
- **API Base URL:** `https://apisandbox.nepalpayment.com`
- **Gateway Form URL:** `https://gatewaysandbox.nepalpayment.com/Payment/Index`
- **Merchant Portal:** `https://eg-uat.nepalpayment.com/`

### Transitioning to Production OnePG
When switching from UAT to Live production:
1. Contact Nepal Payment Solution to acquire live merchant credentials.
2. Provide your live webhook notification URL: `https://dealdrip.store/api/payments/nps/notification`.
3. Provide your live customer response URL: `https://dealdrip.store/api/payments/nps/response`.
4. Update environment variables in production hosting:
   ```env
   NPS_ENABLED="true"
   NPS_MERCHANT_ID="<PRODUCTION_MERCHANT_ID>"
   NPS_MERCHANT_NAME="<PRODUCTION_API_USERNAME>"
   NPS_API_PASSWORD="<PRODUCTION_API_PASSWORD>"
   NPS_SECRET_KEY="<PRODUCTION_SECRET_KEY>"
   NPS_API_BASE_URL="https://api.nepalpayment.com"
   NPS_GATEWAY_URL="https://gateway.nepalpayment.com/Payment/Index"
   ```


---

## 4. Cash on Delivery (COD) Flow

- Remains 100% active and preserved.
- No external gateway redirect required.
- Initial Order Status: `pending_confirmation`
- Initial Payment Status: `unpaid`
- Items are reserved in database inventory ledger.

---

## 5. Transactional Email Architecture

### Email Providers Supported
1. **Gmail SMTP (Active in development & production):**
   - Host: `smtp.gmail.com`
   - Port: `465` (SSL)
   - Account: `dealdrip.store.np@gmail.com`
   - Authentication: Google App Password
   - From: `Deal Drip Store <dealdrip.store.np@gmail.com>`
   - Status: **Active and Verified**

2. **Resend (Optional Custom Domain Delivery):**
   - From Address: `Deal Drip Store <order@dealdrip.store>`
   - Reply-to: `support@dealdrip.store`


### Required DNS Verification for `dealdrip.store`
Add the following DNS records in the Cloudflare DNS dashboard for `dealdrip.store`:
1. **MX Record**: Points to Resend feedback mail server (if receiving)
2. **TXT Record (SPF)**: `v=spf1 include:amazonses.com ~all` (or Resend designated SPF)
3. **CNAME Records (DKIM)**: 3 DKIM tokens generated in Resend domain settings
4. **TXT Record (DMARC)**: `v=DMARC1; p=quarantine; rua=mailto:dmarc@dealdrip.store`

### Dispatched Email Types
1. **COD Order Received:** Explains order confirmation, delivery address in Nepal, and amount due in cash upon delivery.
2. **Verified Online Payment:** Sent only after authoritative gateway verification confirms funds received.
3. **Idempotency Guarantee:** Orders track `orderConfirmationEmailSent` and `paymentConfirmationEmailSent` flags to prevent duplicate emails.

---

## 6. Payment State Machine & Inventory Reservation

```
[Storefront Checkout]
       │
       ▼
[Reserve Inventory & Create Order]
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
   [COD Order]                   [Online Payment (eSewa / NPS)]
       │                                 │
  status: pending_confirmation           ├─► Customer Redirected to Gateway
  paymentStatus: unpaid                  │
  Email: COD Confirmation Dispatched     ▼
                                 [Gateway Return / Callback]
                                         │
                                         ▼
                                 [Server Status Inquiry API]
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
                 [Verified: PAID]               [Failed / Cancelled]
                         │                               │
                paymentStatus: paid             paymentStatus: failed
                status: confirmed               order remains unpaid
                Atomically finalize stock       Stock reservation released
                Email: Payment Verified         Customer allowed retry
```

---

## 7. Production Launch Checklist (For Prompt 9 Preparation)

- [ ] Cloudflare R2 bucket `dealdrip-media` connected to custom domain `media.dealdrip.store`.
- [ ] Run `npm run db:migrate-r2` to populate R2 assets and update database media references.
- [ ] Receive production eSewa merchant code and HMAC secret key.
- [ ] Whitelist production return URLs with eSewa operations team.
- [ ] Receive Nepal Payment Solutions (NPS) merchant documentation and API keys.
- [ ] Verify Resend domain DNS records (SPF, DKIM, DMARC) for `dealdrip.store`.
- [ ] Set production server-only environment variables in deployment hosting (e.g. Vercel / Cloudflare).
- [ ] Verify no secrets are exposed in `NEXT_PUBLIC_*` or client bundles.
