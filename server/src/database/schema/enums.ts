import { pgEnum } from 'drizzle-orm/pg-core';

export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'DISPATCHED',
  'DELIVERED',
  'CANCELLED',
]);

export const discountTypeEnum = pgEnum('discount_type', [
  'PERCENTAGE',
  'FIXED',
]);

export type OrderStatusType = (typeof orderStatusEnum.enumValues)[number];
export type DiscountType = (typeof discountTypeEnum.enumValues)[number];
