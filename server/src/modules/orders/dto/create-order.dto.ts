import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemDto {
  @ApiProperty({ example: 'duo', enum: ['single', 'duo'] })
  @IsIn(['single', 'duo'])
  plan: 'single' | 'duo';

  @ApiProperty({ example: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'DEALDRIP10' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 'usr_neon_12345', description: 'Neon Auth User ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ example: 'Aarav Sharma' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ example: '9841234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 'aarav@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'Bagmati Province' })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({ example: 'Kathmandu' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'New Baneshwor, near Parliament building' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: 'Please deliver after 2 PM' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 'Cash on Delivery (COD)',
    description: 'Selected payment method label or key',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({ type: CartItemDto })
  @ValidateNested()
  @Type(() => CartItemDto)
  cart: CartItemDto;

  @ApiProperty({ example: 6000 })
  @IsNumber()
  @IsPositive()
  subtotal: number;

  @ApiProperty({ example: 600 })
  @IsNumber()
  @Min(0)
  discount: number;

  @ApiProperty({ example: 5400 })
  @IsNumber()
  @IsPositive()
  total: number;
}
