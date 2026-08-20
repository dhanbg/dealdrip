import { Injectable, BadRequestException } from '@nestjs/common';
import { CouponResultDto } from './dto/validate-coupon.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscountType } from '@prisma/client';

interface CouponDefinition {
  code: string;
  type: DiscountType;
  value: number;
  description: string;
  minSubtotal?: number;
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly fallbackCoupons: Map<string, CouponDefinition> = new Map([
    [
      'DEALDRIP10',
      {
        code: 'DEALDRIP10',
        type: DiscountType.PERCENTAGE,
        value: 10,
        description: '10% VIP Launch Discount',
      },
    ],
    [
      'DRIP10',
      {
        code: 'DRIP10',
        type: DiscountType.PERCENTAGE,
        value: 10,
        description: '10% Exclusive Deal Drip Discount',
      },
    ],
    [
      'NEPAL500',
      {
        code: 'NEPAL500',
        type: DiscountType.FIXED,
        value: 500,
        description: 'Rs. 500 Launch Discount',
        minSubtotal: 3000,
      },
    ],
    [
      'VIP20',
      {
        code: 'VIP20',
        type: DiscountType.PERCENTAGE,
        value: 20,
        description: '20% Mega Promo Discount',
      },
    ],
  ]);

  async validateCoupon(code: string, subtotal: number = 0): Promise<CouponResultDto> {
    const normalized = code.trim().toUpperCase();
    let coupon: {
      code: string;
      type: DiscountType;
      value: number;
      description: string;
      minSubtotal?: number | null;
    } | null = null;

    if (this.prisma.isConnected) {
      try {
        const dbCoupon = await this.prisma.coupon.findUnique({
          where: { code: normalized },
        });
        if (dbCoupon && dbCoupon.isActive) {
          coupon = dbCoupon;
        }
      } catch (e) {
        // Fallback to local map
      }
    }

    if (!coupon) {
      coupon = this.fallbackCoupons.get(normalized) || null;
    }

    if (!coupon) {
      throw new BadRequestException(`Invalid promo code "${code}". Please check and try again.`);
    }

    if (coupon.minSubtotal && subtotal > 0 && subtotal < coupon.minSubtotal) {
      throw new BadRequestException(
        `Coupon "${coupon.code}" requires a minimum order of NPR ${coupon.minSubtotal}.`,
      );
    }

    let discountPercent = 0;
    let discountAmount = 0;

    if (coupon.type === DiscountType.PERCENTAGE) {
      discountPercent = coupon.value;
      if (subtotal > 0) {
        discountAmount = Math.round((subtotal * discountPercent) / 100);
      }
    } else if (coupon.type === DiscountType.FIXED) {
      discountAmount = coupon.value;
      if (subtotal > 0) {
        discountPercent = Math.min(100, Math.round((discountAmount / subtotal) * 100));
      }
    }

    return {
      valid: true,
      code: coupon.code,
      discountPercent,
      discountAmount,
      message: `${coupon.description} Applied!`,
    };
  }

  async listAvailableCoupons(): Promise<{ code: string; description: string }[]> {
    if (this.prisma.isConnected) {
      try {
        const list = await this.prisma.coupon.findMany({
          where: { isActive: true },
          select: { code: true, description: true },
        });
        if (list.length > 0) return list;
      } catch (e) {
        // Fallback
      }
    }
    return Array.from(this.fallbackCoupons.values()).map((c) => ({
      code: c.code,
      description: c.description,
    }));
  }
}
