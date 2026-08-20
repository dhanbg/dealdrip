import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export enum PaymentMethod {
  COD = 'cod',
  ESEWA = 'esewa',
  BANKING_CARD = 'banking_card',
}

export enum BankingSubtype {
  QR = 'qr',
  CARD = 'card',
}

export class VerifyPaymentDto {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.BANKING_CARD })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ enum: BankingSubtype, example: BankingSubtype.QR })
  @IsOptional()
  @IsEnum(BankingSubtype)
  subtype?: BankingSubtype;

  @ApiProperty({ example: 'DD-2026-92812' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 6000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ example: 'ESEWA-TXN-839102' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ example: '9841234567' })
  @IsOptional()
  @IsString()
  senderIdentifier?: string;
}

export class PaymentMethodInfo {
  @ApiProperty({ example: 'cod' })
  id: string;

  @ApiProperty({ example: 'Cash on Delivery (COD)' })
  title: string;

  @ApiProperty({ example: 'Pay in cash directly to delivery partner upon unboxing' })
  description: string;

  @ApiProperty({ example: true })
  active: boolean;
}
