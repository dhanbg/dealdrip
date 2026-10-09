import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as dotenv from 'dotenv';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function createAdmin() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const targetEmail = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@dealdrip.store';

  console.log(`Connecting to Neon PostgreSQL to configure admin user: ${targetEmail}...`);
  const sql = neon(connectionString);
  const db = drizzle(sql, { schema });

  // Check if user already exists
  const existingUsers = await db.select().from(schema.user).where(eq(schema.user.email, targetEmail)).limit(1);

  if (existingUsers.length > 0) {
    await db.update(schema.user)
      .set({ role: 'admin' })
      .where(eq(schema.user.email, targetEmail));
    console.log(`✓ User ${targetEmail} successfully elevated to 'admin' role!`);
  } else {
    // Insert new admin user placeholder
    const adminId = `admin-${Date.now()}`;
    await db.insert(schema.user).values({
      id: adminId,
      name: 'Deal Drip Administrator',
      email: targetEmail,
      emailVerified: true,
      role: 'admin',
    });
    console.log(`✓ Admin user profile initialized for ${targetEmail} (ID: ${adminId}) with 'admin' role.`);
    console.log(`  Note: When you sign up or log in with ${targetEmail}, your session will inherit the admin role.`);
  }
}

createAdmin().catch((err) => {
  console.error('Failed to configure admin:', err);
  process.exit(1);
});
