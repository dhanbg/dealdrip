import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { env } from '@/lib/env';

// Neon serverless SQL connection
const client = neon(env.DATABASE_URL);

// Export strongly typed Drizzle database client with all schema definitions
export const db = drizzle(client, { schema });

export type DB = typeof db;
export * from './schema';
