import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class ValidateCouponDto {
  @ApiProperty({ example: 'DRIP10', description: 'Coupon code to validate' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: 3500, description: 'Current subtotal amount in NPR' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  subtotal?: number;
}

export class CouponResultDto {
  @ApiProperty({ example: true })
  valid: boolean;

  @ApiProperty({ example: 'DRIP10' })
  code: string;

  @ApiProperty({ example: 10 })
  discountPercent: number;

  @ApiProperty({ example: 350 })
  discountAmount: number;

  @ApiProperty({ example: '10% discount applied!' })
  message: string;
}
