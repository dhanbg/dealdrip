import { pgTable, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { discountTypeEnum } from './enums';
import { orders } from './orders.schema';

export const coupons = pgTable('coupons', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  type: discountTypeEnum('type').notNull().default('PERCENTAGE'),
  value: integer('value').notNull(),
  description: text('description').notNull(),
  minSubtotal: integer('min_subtotal'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const couponsRelations = relations(coupons, ({ many }) => ({
  orders: many(orders),
}));

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
