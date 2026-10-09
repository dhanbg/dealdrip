import { pgTable, text, timestamp, boolean, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('category_slug_idx').on(table.slug),
]);

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  file: text('file').notNull(), // GLB model filename base e.g. 'speaker-web'
  shortDescription: text('short_description'),
  description: text('description').notNull(),
  categoryId: text('category_id').notNull().references(() => categories.id),
  finish: text('finish'),
  color: text('color'),
  badge: text('badge'),
  basePrice: integer('base_price').notNull(), // integer NPR, e.g. 3000
  compareAtPrice: integer('compare_at_price'),
  currency: text('currency').notNull().default('NPR'),
  active: boolean('active').notNull().default(true),
  featured: boolean('featured').notNull().default(false),
  thumbnail: text('thumbnail').notNull(),
  features: jsonb('features').$type<string[]>().default([]).notNull(),
  defaultVariant: text('default_variant'),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('product_slug_idx').on(table.slug),
  index('product_category_idx').on(table.categoryId),
  index('product_active_idx').on(table.active),
  index('product_featured_idx').on(table.featured),
]);

export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantCode: text('variant_code').notNull(), // e.g. 'black', 'white', 'sage'
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  active: boolean('active').notNull().default(true),
  priceOverride: integer('price_override'), // optional override in NPR
  stockQuantity: integer('stock_quantity').notNull().default(50),
  image: text('image'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('variant_sku_idx').on(table.sku),
  index('variant_product_idx').on(table.productId),
  index('variant_active_idx').on(table.active),
]);

export const productMedia = pgTable('product_media', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: text('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  type: text('type').notNull().default('image'), // 'image' | 'model' | 'gallery'
  url: text('url').notNull(),
  fileKey: text('file_key'), // Cloudflare R2 object key e.g. 'products/speaker/images/xyz.webp'
  mimeType: text('mime_type'),
  sizeBytes: integer('size_bytes'),
  altText: text('alt_text'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('media_product_idx').on(table.productId),
  index('media_variant_idx').on(table.variantId),
]);

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
  media: many(productMedia),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  media: many(productMedia),
}));

export const productMediaRelations = relations(productMedia, ({ one }) => ({
  product: one(products, {
    fields: [productMedia.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [productMedia.variantId],
    references: [productVariants.id],
  }),
}));
