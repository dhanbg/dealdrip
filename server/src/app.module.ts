import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { ProductsModule } from './modules/products/products.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    ProductsModule,
    CouponsModule,
    PaymentsModule,
    OrdersModule,
  ],
})
export class AppModule {}
