import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate a coupon code and calculate discount' })
  async validateCoupon(@Body() dto: ValidateCouponDto) {
    const result = await this.couponsService.validateCoupon(dto.code, dto.subtotal);
    return ApiResponse.success(result, result.message);
  }

  @Get('active')
  @ApiOperation({ summary: 'List active publicly available coupon codes' })
  async listActiveCoupons() {
    const coupons = await this.couponsService.listAvailableCoupons();
    return ApiResponse.success(coupons, 'Active coupon codes retrieved');
  }
}
