import { Injectable, BadRequestException } from '@nestjs/common';
import { CouponResultDto } from './dto/validate-coupon.dto';
import { DatabaseService } from '../../database/database.service';
import { DiscountType } from '../../database/schema/enums';
import * as schema from '../../database/schema';
import { eq } from 'drizzle-orm';

interface CouponDefinition {
  code: string;
  type: DiscountType;
  value: number;
  description: string;
  minSubtotal?: number;
}

@Injectable()
export class CouponsService {
  constructor(private readonly dbService: DatabaseService) {}

  private readonly fallbackCoupons: Map<string, CouponDefinition> = new Map([
    [
      'DEALDRIP10',
      {
        code: 'DEALDRIP10',
        type: 'PERCENTAGE',
        value: 10,
        description: '10% VIP Launch Discount',
      },
    ],
    [
      'DRIP10',
      {
        code: 'DRIP10',
        type: 'PERCENTAGE',
        value: 10,
        description: '10% Exclusive Deal Drip Discount',
      },
    ],
    [
      'NEPAL500',
      {
        code: 'NEPAL500',
        type: 'FIXED',
        value: 500,
        description: 'Rs. 500 Launch Discount',
        minSubtotal: 3000,
      },
    ],
    [
      'VIP20',
      {
        code: 'VIP20',
        type: 'PERCENTAGE',
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

    if (this.dbService.isConnected) {
      try {
        const dbCoupon = await this.dbService.db.query.coupons.findFirst({
          where: (c, { eq, and }) => and(eq(c.code, normalized), eq(c.isActive, true)),
        });
        if (dbCoupon) {
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

    if (coupon.type === 'PERCENTAGE') {
      discountPercent = coupon.value;
      if (subtotal > 0) {
        discountAmount = Math.round((subtotal * discountPercent) / 100);
      }
    } else if (coupon.type === 'FIXED') {
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
    if (this.dbService.isConnected) {
      try {
        const list = await this.dbService.db
          .select({
            code: schema.coupons.code,
            description: schema.coupons.description,
          })
          .from(schema.coupons)
          .where(eq(schema.coupons.isActive, true));

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
