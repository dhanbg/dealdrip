import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { uploadToR2, isR2Configured, resolvePublicMediaUrl } from '../lib/r2';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function migrateMediaToR2() {
  console.log('--- Deal Drip Cloudflare R2 Media Migration Utility ---');

  if (!isR2Configured()) {
    console.log('⚠️  Notice: Cloudflare R2 credentials (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are not set in environment.');
    console.log('   The application will continue serving existing verified assets from local /public paths seamlessly.');
    console.log('   When live Cloudflare credentials are added to .env.local, run this script to upload all models and previews.');
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
  }

  const sql = neon(connectionString);
  const db = drizzle(sql, { schema });

  const modelsDir = path.join(process.cwd(), 'public', 'assets', 'models');
  const previewsDir = path.join(process.cwd(), 'public', 'assets', 'previews');

  // Migrate GLB Models
  if (fs.existsSync(modelsDir)) {
    const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.glb') || f.endsWith('.webp'));
    console.log(`Found ${files.length} production model assets to process...`);

    for (const file of files) {
      if (file.endsWith('.bak')) continue;
      const filePath = path.join(modelsDir, file);
      const buffer = fs.readFileSync(filePath);
      const key = `models/${file}`;
      const contentType = file.endsWith('.glb') ? 'model/gltf-binary' : 'image/webp';

      console.log(`Uploading ${file} -> R2 key: ${key}...`);
      const res = await uploadToR2({
        key,
        body: buffer,
        contentType,
      });

      if (res.success) {
        console.log(`✓ Uploaded ${file} successfully: ${res.url}`);
      } else {
        console.warn(`✗ Failed to upload ${file}: ${res.error}`);
      }
    }
  }

  // Migrate Previews
  if (fs.existsSync(previewsDir)) {
    const previewFiles = fs.readdirSync(previewsDir).filter((f) => !f.endsWith('.bak'));
    console.log(`Found ${previewFiles.length} preview assets to process...`);

    for (const file of previewFiles) {
      const filePath = path.join(previewsDir, file);
      if (fs.statSync(filePath).isDirectory()) continue;
      const buffer = fs.readFileSync(filePath);
      const key = `previews/${file}`;
      const ext = path.extname(file).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

      console.log(`Uploading preview ${file} -> R2 key: ${key}...`);
      const res = await uploadToR2({
        key,
        body: buffer,
        contentType,
      });

      if (res.success) {
        console.log(`✓ Uploaded preview ${file}: ${res.url}`);
      }
    }
  }

  console.log('✓ Media migration scan completed successfully.');
}

migrateMediaToR2().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
