import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  public isConnected = false;
  private client: postgres.Sql | null = null;
  public db!: PostgresJsDatabase<typeof schema>;

  async onModuleInit() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl || databaseUrl.includes('your-neon-endpoint')) {
      this.logger.warn(
        '⚠️ DATABASE_URL is not configured with a live Neon endpoint. Running in offline/fallback mode.',
      );
      return;
    }

    try {
      this.client = postgres(databaseUrl, {
        max: 10,
        ssl: 'require',
        connect_timeout: 10,
      });

      this.db = drizzle(this.client, { schema });

      // Run health check
      await this.client`SELECT 1`;
      this.isConnected = true;
      this.logger.log('✅ Connected successfully to Neon PostgreSQL via Drizzle ORM.');
    } catch (err: any) {
      this.isConnected = false;
      this.logger.warn(
        `⚠️ Could not connect to Neon PostgreSQL database: ${err.message}. Using fallback memory mode.`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.end();
      } catch (err: any) {
        this.logger.debug(`Error closing database connection: ${err.message}`);
      }
    }
  }
}
