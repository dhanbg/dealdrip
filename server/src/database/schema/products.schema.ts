import { pgTable, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orders } from './orders.schema';

export const products = pgTable('products', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique().default('deal-drip-speaker'),
  title: text('title').notNull(),
  currency: text('currency').notNull().default('NPR'),
  features: text('features').array().notNull(),
  inventoryRemaining: integer('inventory_remaining').notNull().default(48),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const productPlans = pgTable('product_plans', {
  id: text('id').primaryKey(), // 'single' | 'duo'
  name: text('name').notNull(),
  badge: text('badge').notNull(),
  price: integer('price').notNull(),
  originalPrice: integer('original_price').notNull(),
  discountPercentage: integer('discount_percentage').notNull(),
  includes: text('includes').notNull(),
  inStock: boolean('in_stock').notNull().default(true),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
});

export const productsRelations = relations(products, ({ many }) => ({
  plans: many(productPlans),
}));

export const productPlansRelations = relations(productPlans, ({ one, many }) => ({
  product: one(products, {
    fields: [productPlans.productId],
    references: [products.id],
  }),
  orders: many(orders),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductPlan = typeof productPlans.$inferSelect;
export type NewProductPlan = typeof productPlans.$inferInsert;
