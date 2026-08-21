import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { sql } from 'drizzle-orm';

export interface VerifiedNeonUser {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  [key: string]: any;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly neonAuthBaseUrl =
    process.env.NEON_AUTH_BASE_URL ||
    'https://ep-proud-dust-b3veypni.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth';

  constructor(private readonly dbService: DatabaseService) {}

  /**
   * Verifies a session token or JWT with Neon Auth or Neon PostgreSQL database
   */
  async verifySessionOrToken(token: string): Promise<VerifiedNeonUser | null> {
    try {
      // 1. Try querying Neon Auth endpoint if reachable
      if (this.neonAuthBaseUrl) {
        try {
          const response = await fetch(`${this.neonAuthBaseUrl}/get-session`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Cookie: `better-auth.session_token=${token}`,
            },
          });

          if (response.ok) {
            const data = (await response.json()) as any;
            if (data?.user) {
              return {
                id: data.user.id,
                email: data.user.email,
                name: data.user.name,
                image: data.user.image,
              };
            }
          }
        } catch (fetchErr) {
          this.logger.debug(
            `Neon Auth HTTP verification unreachable: ${(fetchErr as Error).message}`,
          );
        }
      }

      // 2. Direct PostgreSQL query against neon_auth schema
      if (this.dbService.isConnected) {
        try {
          const result = await this.dbService.db.execute<{
            userId: string;
            email: string;
            name: string;
            image: string;
          }>(
            sql`SELECT s."userId", u."email", u."name", u."image" 
                FROM "neon_auth"."session" s 
                JOIN "neon_auth"."user" u ON s."userId" = u."id" 
                WHERE s."token" = ${token} AND s."expiresAt" > NOW() LIMIT 1`,
          );

          if (result && result.length > 0) {
            const row = result[0];
            return {
              id: row.userId,
              email: row.email,
              name: row.name,
              image: row.image,
            };
          }
        } catch (dbErr) {
          this.logger.debug(
            `neon_auth schema query skipped: ${(dbErr as Error).message}`,
          );
        }
      }

      return null;
    } catch (err) {
      this.logger.warn(`Neon Auth token verification error: ${(err as Error).message}`);
      return null;
    }
  }
}
