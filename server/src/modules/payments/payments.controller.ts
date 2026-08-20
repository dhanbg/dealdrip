import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { VerifyPaymentDto } from './dto/payment.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('methods')
  @ApiOperation({ summary: 'List accepted payment gateways and methods' })
  getMethods() {
    return ApiResponse.success(
      this.paymentsService.getAvailableMethods(),
      'Payment methods retrieved successfully',
    );
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify or simulate an online payment receipt' })
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    const result = await this.paymentsService.verifyPayment(dto);
    return ApiResponse.success(result, 'Payment verified successfully');
  }
}
