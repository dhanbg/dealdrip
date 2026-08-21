import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl.includes('your-neon-endpoint')) {
  console.error('❌ DATABASE_URL is not configured with a valid PostgreSQL connection string.');
  process.exit(1);
}

const client = postgres(databaseUrl, { max: 1, ssl: 'require' });
const db = drizzle(client, { schema });

async function seed() {
  console.log('🌱 Starting Deal Drip database seeding via Drizzle ORM...');

  // 1. Seed Product
  const productId = 'deal-drip-speaker-prod-1';
  const existingProduct = await db.query.products.findFirst({
    where: (p, { eq }) => eq(p.slug, 'deal-drip-speaker'),
  });

  let activeProductId = existingProduct?.id || productId;

  if (!existingProduct) {
    const [inserted] = await db
      .insert(schema.products)
      .values({
        id: activeProductId,
        slug: 'deal-drip-speaker',
        title: 'Deal Drip 15W RGB Wireless Charging Bluetooth Speaker with TWS Stereo, Digital Clock & Alarm',
        currency: 'NPR',
        inventoryRemaining: 48,
        features: [
          '15W Qi Fast Wireless Charging with Multi-Protection',
          'Dual Speaker TWS Stereo 360° Pairing',
          '7 Ambient Dynamic RGB Color Modes',
          'Smart Digital LED Clock with Dual Alarms',
          'Bluetooth 5.0 + AUX + TF Card + USB-C',
        ],
      })
      .returning();
    activeProductId = inserted.id;
    console.log(`✅ Inserted product: ${inserted.title}`);
  } else {
    console.log(`ℹ️ Product already exists: ${existingProduct.title}`);
  }

  // 2. Seed Plans
  const plans = [
    {
      id: 'single',
      name: 'Single Unit (Solo Pack)',
      badge: '15W Fast Charge + RGB Atmosphere + 360° HiFi',
      price: 3500,
      originalPrice: 4999,
      discountPercentage: 30,
      includes: '1x Deal Drip G-Speaker, 1x Type-C Fast Cable, 1x Quick Manual',
      inStock: true,
      productId: activeProductId,
    },
    {
      id: 'duo',
      name: 'TWS Stereo Duo Pack (2 Units)',
      badge: 'Double Power • True Wireless Stereo Left/Right Surround',
      price: 6000,
      originalPrice: 9998,
      discountPercentage: 40,
      includes: '2x Deal Drip G-Speakers (TWS Synced), 2x Type-C Fast Cables, 2x Quick Manuals',
      inStock: true,
      productId: activeProductId,
    },
  ];

  for (const plan of plans) {
    await db
      .insert(schema.productPlans)
      .values(plan)
      .onConflictDoUpdate({
        target: schema.productPlans.id,
        set: {
          name: plan.name,
          badge: plan.badge,
          price: plan.price,
          originalPrice: plan.originalPrice,
          discountPercentage: plan.discountPercentage,
          includes: plan.includes,
          inStock: plan.inStock,
          productId: activeProductId,
        },
      });
  }
  console.log(`✅ Seeded ${plans.length} product pricing plans.`);

  // 3. Seed Promo Coupons
  const coupons = [
    {
      code: 'DEALDRIP10',
      type: 'PERCENTAGE' as const,
      value: 10,
      description: '10% VIP Launch Discount',
      minSubtotal: null,
      isActive: true,
    },
    {
      code: 'DRIP10',
      type: 'PERCENTAGE' as const,
      value: 10,
      description: '10% Exclusive Deal Drip Discount',
      minSubtotal: null,
      isActive: true,
    },
    {
      code: 'NEPAL500',
      type: 'FIXED' as const,
      value: 500,
      description: 'Rs. 500 Launch Discount',
      minSubtotal: 3000,
      isActive: true,
    },
    {
      code: 'VIP20',
      type: 'PERCENTAGE' as const,
      value: 20,
      description: '20% Mega Promo Discount',
      minSubtotal: null,
      isActive: true,
    },
  ];

  for (const coupon of coupons) {
    await db
      .insert(schema.coupons)
      .values(coupon)
      .onConflictDoUpdate({
        target: schema.coupons.code,
        set: {
          type: coupon.type,
          value: coupon.value,
          description: coupon.description,
          minSubtotal: coupon.minSubtotal,
          isActive: coupon.isActive,
        },
      });
  }
  console.log(`✅ Seeded ${coupons.length} promotional coupons.`);
  console.log('🎉 Seeding completed successfully!');
}

seed()
  .catch((err) => {
    console.error('Error during seeding:', err);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
