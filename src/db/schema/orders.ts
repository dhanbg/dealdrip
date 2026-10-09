import { pgTable, text, timestamp, boolean, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth';

export interface NepalAddressSnapshot {
  country: 'Nepal';
  province: string;
  district: string;
  municipality: string;
  ward: string;
  areaTole: string;
  streetLandmark?: string;
  deliveryInstructions?: string;
}

export const addresses = pgTable('addresses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  province: text('province').notNull(),
  district: text('district').notNull(),
  municipality: text('municipality').notNull(),
  ward: text('ward').notNull(),
  areaTole: text('area_tole').notNull(),
  streetLandmark: text('street_landmark'),
  deliveryInstructions: text('delivery_instructions'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('address_user_idx').on(table.userId),
]);

export const orders = pgTable('orders', {
  id: text('id').primaryKey(), // UUID
  orderReference: text('order_reference').notNull().unique(), // e.g. 'DD-73920194'
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }), // nullable for guest checkout
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  status: text('status').notNull().default('pending_confirmation'), // 'pending_payment' | 'pending_confirmation' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: text('payment_status').notNull().default('unpaid'), // 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: text('payment_method').notNull(), // 'cod' | 'esewa' | 'nps'
  subtotal: integer('subtotal').notNull(), // integer NPR
  shippingAmount: integer('shipping_amount').notNull().default(0), // integer NPR
  total: integer('total').notNull(), // integer NPR
  currency: text('currency').notNull().default('NPR'),
  deliveryAddress: jsonb('delivery_address').$type<NepalAddressSnapshot>().notNull(),
  orderConfirmationEmailSent: boolean('order_confirmation_email_sent').notNull().default(false),
  paymentConfirmationEmailSent: boolean('payment_confirmation_email_sent').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('order_reference_idx').on(table.orderReference),
  index('order_user_idx').on(table.userId),
  index('order_status_idx').on(table.status),
  index('order_created_at_idx').on(table.createdAt),
]);

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  variantId: text('variant_id'),
  productNameSnapshot: text('product_name_snapshot').notNull(),
  variantNameSnapshot: text('variant_name_snapshot'),
  skuSnapshot: text('sku_snapshot'),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(), // integer NPR snapshot
  lineTotal: integer('line_total').notNull(), // integer NPR snapshot
  thumbnail: text('thumbnail'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('order_items_order_idx').on(table.orderId),
  index('order_items_product_idx').on(table.productId),
]);

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // 'cod' | 'esewa' | 'nps'
  status: text('status').notNull().default('unpaid'), // 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
  amount: integer('amount').notNull(), // integer NPR
  currency: text('currency').notNull().default('NPR'),
  providerTransactionId: text('provider_transaction_id'),
  providerReference: text('provider_reference'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('payment_order_idx').on(table.orderId),
  index('payment_status_idx').on(table.status),
]);

// Relations
export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(user, {
    fields: [addresses.userId],
    references: [user.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));
