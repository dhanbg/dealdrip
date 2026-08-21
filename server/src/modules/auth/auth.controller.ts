import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NeonAuthGuard } from './auth.guard';
import { CurrentUser, AuthUser } from './current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(NeonAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated Neon Auth user profile' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser() user: AuthUser) {
    return {
      success: true,
      user,
    };
  }
}
