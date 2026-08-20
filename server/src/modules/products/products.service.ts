import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductDetailDto, ProductPlanDto } from './dto/product.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly fallbackPlans: ProductPlanDto[] = [
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
  ];

  private readonly fallbackProduct: ProductDetailDto = {
    id: 'deal-drip-speaker',
    title: 'Deal Drip 15W RGB Wireless Charging Bluetooth Speaker with TWS Stereo, Digital Clock & Alarm',
    currency: 'NPR',
    plans: this.fallbackPlans,
    features: [
      '15W Qi Fast Wireless Charging with Multi-Protection',
      'Dual Speaker TWS Stereo 360° Pairing',
      '7 Ambient Dynamic RGB Color Modes',
      'Smart Digital LED Clock with Dual Alarms',
      'Bluetooth 5.0 + AUX + TF Card + USB-C',
    ],
    inventoryRemaining: 48,
  };

  async getProduct(): Promise<ProductDetailDto> {
    if (this.prisma.isConnected) {
      try {
        const product = await this.prisma.product.findFirst({
          where: { slug: 'deal-drip-speaker' },
          include: { plans: true },
        });

        if (product) {
          return {
            id: product.slug,
            title: product.title,
            currency: product.currency,
            features: product.features,
            inventoryRemaining: product.inventoryRemaining,
            plans: product.plans.map((p) => ({
              id: p.id as 'single' | 'duo',
              name: p.name,
              badge: p.badge,
              price: p.price,
              originalPrice: p.originalPrice,
              discountPercentage: p.discountPercentage,
              includes: p.includes,
              inStock: p.inStock,
            })),
          };
        }
      } catch (e) {
        // Silently fall back to default specs
      }
    }
    return this.fallbackProduct;
  }

  async getPlans(): Promise<ProductPlanDto[]> {
    const product = await this.getProduct();
    return product.plans;
  }

  async getPlanById(planId: string): Promise<ProductPlanDto> {
    const plans = await this.getPlans();
    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      throw new NotFoundException(`Plan with ID "${planId}" not found`);
    }
    return plan;
  }
}
