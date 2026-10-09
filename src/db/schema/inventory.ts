import { pgTable, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { productVariants } from './catalog';

export const inventoryAdjustments = pgTable('inventory_adjustments', {
  id: text('id').primaryKey(),
  variantId: text('variant_id').notNull().references(() => productVariants.id),
  quantityDelta: integer('quantity_delta').notNull(),
  resultingStock: integer('resulting_stock').notNull(),
  reason: text('reason').notNull(), // 'initial_seed' | 'manual_adjustment' | 'order_committed' | 'order_cancelled' | 'restock'
  referenceId: text('reference_id'), // e.g. Order reference or audit ID
  notes: text('notes'),
  createdBy: text('created_by'), // admin user ID or 'system'
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('adj_variant_idx').on(table.variantId),
  index('adj_created_at_idx').on(table.createdAt),
]);

export const stockReservations = pgTable('stock_reservations', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull(),
  variantId: text('variant_id').notNull().references(() => productVariants.id),
  quantity: integer('quantity').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  status: text('status').notNull().default('active'), // 'active' | 'committed' | 'released'
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('res_order_idx').on(table.orderId),
  index('res_variant_idx').on(table.variantId),
  index('res_expires_idx').on(table.expiresAt),
]);

export const inventoryAdjustmentsRelations = relations(inventoryAdjustments, ({ one }) => ({
  variant: one(productVariants, {
    fields: [inventoryAdjustments.variantId],
    references: [productVariants.id],
  }),
}));

export const stockReservationsRelations = relations(stockReservations, ({ one }) => ({
  variant: one(productVariants, {
    fields: [stockReservations.variantId],
    references: [productVariants.id],
  }),
}));
