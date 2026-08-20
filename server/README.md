# Deal Drip NestJS API

Backend service providing order management, product data, coupon validation, and payment verification for the Deal Drip Next.js storefront.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Run the Development Server
```bash
npm run start:dev
```
The server will start at `http://localhost:4000/api`.

### 3. API Documentation
Open `http://localhost:4000/api/docs` in your browser for the interactive Swagger OpenAPI explorer.

## 📋 API Endpoints

- **Health**: `GET /api/health`
- **Products**:
  - `GET /api/products` (Full product specs & inventory)
  - `GET /api/products/plans` (Single vs Duo package pricing)
  - `GET /api/products/plans/:id`
- **Orders**:
  - `POST /api/orders` (Submit customer checkout order)
  - `GET /api/orders` (List recent orders)
  - `GET /api/orders/:id` (Fetch order details & tracking history)
  - `PATCH /api/orders/:id/status` (Update status: PENDING, CONFIRMED, DISPATCHED, DELIVERED, etc.)
- **Coupons**:
  - `POST /api/coupons/validate` (Validate promo codes: `DEALDRIP10`, `DRIP10`, `NEPAL500`, `VIP20`)
  - `GET /api/coupons/active`
- **Payments**:
  - `GET /api/payments/methods` (Available payment methods)
  - `POST /api/payments/verify` (Simulate/verify payment)
