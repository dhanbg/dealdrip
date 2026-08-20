import { ApiProperty } from '@nestjs/swagger';

export class ProductPlanDto {
  @ApiProperty({ example: 'single' })
  id: 'single' | 'duo';

  @ApiProperty({ example: 'Single Speaker (Solo)' })
  name: string;

  @ApiProperty({ example: '15W Fast Charge + RGB Atmosphere + 360° HiFi' })
  badge: string;

  @ApiProperty({ example: 3500 })
  price: number;

  @ApiProperty({ example: 4999 })
  originalPrice: number;

  @ApiProperty({ example: 30 })
  discountPercentage: number;

  @ApiProperty({ example: '1x Deal Drip G-Speaker with Type-C Fast Cable' })
  includes: string;

  @ApiProperty({ example: true })
  inStock: boolean;
}

export class ProductDetailDto {
  @ApiProperty({ example: 'deal-drip-speaker' })
  id: string;

  @ApiProperty({ example: 'Deal Drip 15W RGB Wireless Charging Bluetooth Speaker' })
  title: string;

  @ApiProperty({ example: 'NPR' })
  currency: string;

  @ApiProperty({ type: [ProductPlanDto] })
  plans: ProductPlanDto[];

  @ApiProperty({
    example: [
      '15W Qi Fast Wireless Charging with Multi-Protection',
      'Dual Speaker TWS Stereo 360° Pairing',
      '7 Ambient Dynamic RGB Color Modes',
      'Smart Digital LED Clock with Dual Alarms',
      'Bluetooth 5.0 + AUX + TF Card + USB-C',
    ],
  })
  features: string[];

  @ApiProperty({ example: 48 })
  inventoryRemaining: number;
}
