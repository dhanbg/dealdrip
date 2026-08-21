import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orderStatusEnum } from './enums';
import { productPlans } from './products.schema';
import { coupons } from './coupons.schema';
import { paymentTransactions } from './payments.schema';

export const orders = pgTable('orders', {
  id: text('id').primaryKey(), // 'DD-2026-92819'
  userId: text('user_id'),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  province: text('province').notNull(),
  city: text('city').notNull(),
  address: text('address').notNull(),
  notes: text('notes'),
  paymentMethod: text('payment_method').notNull(),
  planId: text('plan_id')
    .notNull()
    .references(() => productPlans.id),
  quantity: integer('quantity').notNull().default(1),
  couponCode: text('coupon_code').references(() => coupons.code),
  subtotal: integer('subtotal').notNull(),
  discount: integer('discount').notNull().default(0),
  total: integer('total').notNull(),
  status: orderStatusEnum('status').notNull().default('CONFIRMED'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const trackingEvents = pgTable('tracking_events', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  status: orderStatusEnum('status').notNull(),
  note: text('note'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  plan: one(productPlans, {
    fields: [orders.planId],
    references: [productPlans.id],
  }),
  coupon: one(coupons, {
    fields: [orders.couponCode],
    references: [coupons.code],
  }),
  trackingHistory: many(trackingEvents),
  payments: many(paymentTransactions),
}));

export const trackingEventsRelations = relations(trackingEvents, ({ one }) => ({
  order: one(orders, {
    fields: [trackingEvents.orderId],
    references: [orders.id],
  }),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type TrackingEvent = typeof trackingEvents.$inferSelect;
export type NewTrackingEvent = typeof trackingEvents.$inferInsert;
