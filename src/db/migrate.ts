import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  console.log('Connecting to Neon PostgreSQL for migrations...');
  const sql = neon(connectionString);
  const db = drizzle(sql);

  console.log('Running committed migrations from ./drizzle ...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('✓ Migrations successfully applied!');
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
