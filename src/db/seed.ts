import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as dotenv from 'dotenv';
import * as schema from './schema';
import { catalog, chapters } from '../data/catalog';
import { eq } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  console.log('Connecting to Neon PostgreSQL for database seeding...');
  const sql = neon(connectionString);
  const db = drizzle(sql, { schema });

  // 1. Seed Categories
  console.log('Seeding categories...');
  const categoryDefs = [
    { id: 'audio', slug: 'audio', name: 'Audio', description: 'Curated studio and bedside listening objects.', sortOrder: 1 },
    { id: 'gaming', slug: 'gaming', name: 'Gaming', description: 'Precision mechanical keyboards and active thermal coolers.', sortOrder: 2 },
    { id: 'everyday', slug: 'everyday', name: 'Everyday', description: 'Functional lifestyle essentials and durable modular cables.', sortOrder: 3 },
  ];

  for (const cat of categoryDefs) {
    await db.insert(schema.categories)
      .values(cat)
      .onConflictDoUpdate({
        target: schema.categories.slug,
        set: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      });
  }

  // 2. Seed Products & Variants
  console.log('Seeding products and variants...');
  for (const p of catalog) {
    const categoryId = p.category.toLowerCase();
    const isFeatured = ['speaker', 'scarlett3', 'keyboard', 'bottle'].includes(p.id);

    await db.insert(schema.products)
      .values({
        id: p.id,
        slug: p.id,
        name: p.name,
        file: p.file,
        shortDescription: p.badge || p.description.slice(0, 100),
        description: p.description,
        categoryId,
        finish: p.finish,
        color: p.color,
        badge: p.badge,
        basePrice: p.price,
        currency: 'NPR',
        active: true,
        featured: isFeatured,
        thumbnail: `/assets/previews/${p.file}.png?v=7`,
        features: p.features,
        defaultVariant: p.defaultVariant || (p.variants ? p.variants[0]?.id : 'default'),
        seoTitle: `${p.name} — Deal Drip Nepal`,
        seoDescription: p.description,
      })
      .onConflictDoUpdate({
        target: schema.products.slug,
        set: {
          name: p.name,
          basePrice: p.price,
          description: p.description,
          features: p.features,
          featured: isFeatured,
          active: true,
        },
      });

    // Seed variants
    if (p.variants && p.variants.length > 0) {
      for (let i = 0; i < p.variants.length; i++) {
        const v = p.variants[i];
        const variantId = `${p.id}-${v.id}`;
        const sku = `DD-${p.id.toUpperCase()}-${v.id.toUpperCase()}`;
        const stockQty = 50;

        await db.insert(schema.productVariants)
          .values({
            id: variantId,
            productId: p.id,
            variantCode: v.id,
            sku,
            name: v.name,
            color: v.color,
            active: true,
            stockQuantity: stockQty,
            image: v.image || `/assets/previews/${p.file}.png?v=7`,
            sortOrder: i,
          })
          .onConflictDoUpdate({
            target: schema.productVariants.sku,
            set: {
              name: v.name,
              color: v.color,
              image: v.image || `/assets/previews/${p.file}.png?v=7`,
            },
          });

        // Seed initial inventory adjustment entry if none exists
        const existingAdj = await db.select()
          .from(schema.inventoryAdjustments)
          .where(eq(schema.inventoryAdjustments.variantId, variantId))
          .limit(1);

        if (existingAdj.length === 0) {
          await db.insert(schema.inventoryAdjustments).values({
            id: `seed-adj-${variantId}`,
            variantId,
            quantityDelta: stockQty,
            resultingStock: stockQty,
            reason: 'initial_seed',
            referenceId: 'BOOTSTRAP',
            notes: 'Initial catalog inventory seed',
            createdBy: 'system',
          });
        }
      }
    } else {
      // Single default variant for products without multi-color swatches
      const variantId = `${p.id}-default`;
      const sku = `DD-${p.id.toUpperCase()}-STD`;
      const stockQty = 50;

      await db.insert(schema.productVariants)
        .values({
          id: variantId,
          productId: p.id,
          variantCode: 'default',
          sku,
          name: p.finish || 'Standard',
          color: p.color,
          active: true,
          stockQuantity: stockQty,
          image: `/assets/previews/${p.file}.png?v=7`,
          sortOrder: 0,
        })
        .onConflictDoUpdate({
          target: schema.productVariants.sku,
          set: {
            name: p.finish || 'Standard',
            color: p.color,
            image: `/assets/previews/${p.file}.png?v=7`,
          },
        });

      const existingAdj = await db.select()
        .from(schema.inventoryAdjustments)
        .where(eq(schema.inventoryAdjustments.variantId, variantId))
        .limit(1);

      if (existingAdj.length === 0) {
        await db.insert(schema.inventoryAdjustments).values({
          id: `seed-adj-${variantId}`,
          variantId,
          quantityDelta: stockQty,
          resultingStock: stockQty,
          reason: 'initial_seed',
          referenceId: 'BOOTSTRAP',
          notes: 'Initial catalog inventory seed',
          createdBy: 'system',
        });
      }
    }
  }

  console.log('✓ Seeding complete! All categories, products, and variants are initialized with live inventory.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
