import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, ilike, or, asc } from 'drizzle-orm';
import { catalog as fallbackCatalog, getProduct as getFallbackProduct, Product } from '@/data/catalog';

export interface DbProductWithVariants {
  id: string;
  slug: string;
  name: string;
  file: string;
  category: 'Audio' | 'Gaming' | 'Everyday';
  price: number;
  finish: string;
  color: string;
  badge?: string;
  description: string;
  features: string[];
  active: boolean;
  featured: boolean;
  defaultVariant?: string;
  variants: Array<{
    id: string;
    variantCode: string;
    name: string;
    color: string;
    stock: number;
    price: number;
    image?: string;
    active: boolean;
  }>;
}

function mapCategoryName(catId: string): 'Audio' | 'Gaming' | 'Everyday' {
  const lower = catId.toLowerCase();
  if (lower === 'gaming') return 'Gaming';
  if (lower === 'everyday' || lower === 'lifestyle') return 'Everyday';
  return 'Audio';
}

export async function getDbProducts(): Promise<DbProductWithVariants[]> {
  try {
    const rows = await db.query.products.findMany({
      where: eq(schema.products.active, true),
      with: {
        variants: {
          where: eq(schema.productVariants.active, true),
          orderBy: [asc(schema.productVariants.sortOrder)],
        },
      },
    });

    if (rows.length === 0) {
      return getFallbackMappedProducts();
    }

    return rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      file: p.file,
      category: mapCategoryName(p.categoryId),
      price: p.basePrice,
      finish: p.finish || '',
      color: p.color || '#25282c',
      badge: p.badge || undefined,
      description: p.description,
      features: (p.features as string[]) || [],
      active: p.active,
      featured: p.featured,
      defaultVariant: p.defaultVariant || undefined,
      variants: p.variants.map((v) => ({
        id: v.variantCode,
        variantCode: v.variantCode,
        name: v.name,
        color: v.color,
        stock: v.stockQuantity,
        price: v.priceOverride ?? p.basePrice,
        image: v.image || undefined,
        active: v.active,
      })),
    }));
  } catch (err) {
    console.warn('Database query error, using fallback catalog:', err);
    return getFallbackMappedProducts();
  }
}

export async function getDbFeaturedProducts(): Promise<DbProductWithVariants[]> {
  const all = await getDbProducts();
  return all.filter((p) => p.featured);
}

export async function getDbProductBySlug(slug: string): Promise<DbProductWithVariants | null> {
  try {
    const p = await db.query.products.findFirst({
      where: or(eq(schema.products.slug, slug), eq(schema.products.id, slug)),
      with: {
        variants: {
          orderBy: [asc(schema.productVariants.sortOrder)],
        },
      },
    });

    if (!p) {
      const fb = getFallbackProduct(slug);
      if (!fb) return null;
      return mapFallbackToDbProduct(fb);
    }

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      file: p.file,
      category: mapCategoryName(p.categoryId),
      price: p.basePrice,
      finish: p.finish || '',
      color: p.color || '#25282c',
      badge: p.badge || undefined,
      description: p.description,
      features: (p.features as string[]) || [],
      active: p.active,
      featured: p.featured,
      defaultVariant: p.defaultVariant || undefined,
      variants: p.variants.map((v) => ({
        id: v.variantCode,
        variantCode: v.variantCode,
        name: v.name,
        color: v.color,
        stock: v.stockQuantity,
        price: v.priceOverride ?? p.basePrice,
        image: v.image || undefined,
        active: v.active,
      })),
    };
  } catch (err) {
    console.warn('Error fetching product by slug from DB:', err);
    const fb = getFallbackProduct(slug);
    return fb ? mapFallbackToDbProduct(fb) : null;
  }
}

export async function getDbProductsByCategory(category: string): Promise<DbProductWithVariants[]> {
  const all = await getDbProducts();
  if (!category || category === 'All') return all;
  return all.filter((p) => p.category.toLowerCase() === category.toLowerCase());
}

export async function searchDbProducts(query: string): Promise<DbProductWithVariants[]> {
  if (!query.trim()) return [];
  try {
    const term = `%${query.trim()}%`;
    const rows = await db.query.products.findMany({
      where: and(
        eq(schema.products.active, true),
        or(
          ilike(schema.products.name, term),
          ilike(schema.products.description, term),
          ilike(schema.products.categoryId, term)
        )
      ),
      with: {
        variants: {
          where: eq(schema.productVariants.active, true),
        },
      },
    });

    return rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      file: p.file,
      category: mapCategoryName(p.categoryId),
      price: p.basePrice,
      finish: p.finish || '',
      color: p.color || '#25282c',
      badge: p.badge || undefined,
      description: p.description,
      features: (p.features as string[]) || [],
      active: p.active,
      featured: p.featured,
      defaultVariant: p.defaultVariant || undefined,
      variants: p.variants.map((v) => ({
        id: v.variantCode,
        variantCode: v.variantCode,
        name: v.name,
        color: v.color,
        stock: v.stockQuantity,
        price: v.priceOverride ?? p.basePrice,
        image: v.image || undefined,
        active: v.active,
      })),
    }));
  } catch (err) {
    const all = await getDbProducts();
    const q = query.toLowerCase();
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }
}

// Fallback helpers
function getFallbackMappedProducts(): DbProductWithVariants[] {
  return fallbackCatalog.map(mapFallbackToDbProduct);
}

function mapFallbackToDbProduct(p: Product): DbProductWithVariants {
  return {
    id: p.id,
    slug: p.id,
    name: p.name,
    file: p.file,
    category: p.category,
    price: p.price,
    finish: p.finish,
    color: p.color,
    badge: p.badge,
    description: p.description,
    features: p.features,
    active: true,
    featured: ['speaker', 'scarlett3', 'keyboard', 'bottle'].includes(p.id),
    defaultVariant: p.defaultVariant,
    variants: p.variants
      ? p.variants.map((v) => ({
          id: v.id,
          variantCode: v.id,
          name: v.name,
          color: v.color,
          stock: 50,
          price: p.price,
          image: v.image,
          active: true,
        }))
      : [
          {
            id: 'default',
            variantCode: 'default',
            name: p.finish || 'Standard',
            color: p.color,
            stock: 50,
            price: p.price,
            active: true,
          },
        ],
  };
}
