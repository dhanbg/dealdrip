import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { NeonAuthGuard, OptionalNeonAuthGuard } from './auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, NeonAuthGuard, OptionalNeonAuthGuard],
  exports: [AuthService, NeonAuthGuard, OptionalNeonAuthGuard],
})
export class AuthModule {}
