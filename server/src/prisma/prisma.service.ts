import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  public isConnected = false;

  async onModuleInit() {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('your-neon-endpoint')) {
      this.logger.warn(
        '⚠️ DATABASE_URL is not configured with a live Neon endpoint. Running in offline/fallback mode.',
      );
      return;
    }

    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('✅ Connected successfully to Neon Serverless PostgreSQL Database.');
    } catch (err: any) {
      this.isConnected = false;
      this.logger.warn(
        `⚠️ Could not connect to Neon PostgreSQL database: ${err.message}. Using fallback repository.`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
    }
  }
}
