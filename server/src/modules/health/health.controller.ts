import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  @Get()
  @ApiOperation({ summary: 'Check server health and uptime' })
  checkHealth() {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    return ApiResponse.success(
      {
        status: 'ok',
        service: 'Deal Drip NestJS API',
        version: '1.0.0',
        uptime: `${uptimeSeconds}s`,
        environment: process.env.NODE_ENV || 'development',
      },
      'API is operational and healthy',
    );
  }
}
