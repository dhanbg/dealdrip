import { PrismaClient, DiscountType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Deal Drip Neon database seeding...');

  // 1. Seed Product & Plans
  const product = await prisma.product.upsert({
    where: { slug: 'deal-drip-speaker' },
    update: {},
    create: {
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
      plans: {
        create: [
          {
            id: 'single',
            name: 'Single Unit (Solo Pack)',
            badge: '15W Fast Charge + RGB Atmosphere + 360° HiFi',
            price: 3500,
            originalPrice: 4999,
            discountPercentage: 30,
            includes: '1x Deal Drip G-Speaker, 1x Type-C Fast Cable, 1x Quick Manual',
            inStock: true,
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
          },
        ],
      },
    },
  });

  console.log(`✅ Seeded product: ${product.title}`);

  // 2. Seed Promo Coupons
  const coupons = [
    {
      code: 'DEALDRIP10',
      type: DiscountType.PERCENTAGE,
      value: 10,
      description: '10% VIP Launch Discount',
    },
    {
      code: 'DRIP10',
      type: DiscountType.PERCENTAGE,
      value: 10,
      description: '10% Exclusive Deal Drip Discount',
    },
    {
      code: 'NEPAL500',
      type: DiscountType.FIXED,
      value: 500,
      description: 'Rs. 500 Launch Discount',
      minSubtotal: 3000,
    },
    {
      code: 'VIP20',
      type: DiscountType.PERCENTAGE,
      value: 20,
      description: '20% Mega Promo Discount',
    },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: coupon,
    });
  }

  console.log(`✅ Seeded ${coupons.length} promotional coupons.`);
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
