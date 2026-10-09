import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  uploadToR2,
  ALLOWED_IMAGE_MIMES,
  ALLOWED_MODEL_MIMES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_MODEL_SIZE_BYTES,
  resolvePublicMediaUrl,
} from '@/lib/r2';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const productId = formData.get('productId') as string | null;
    const type = (formData.get('type') as string) || 'image';
    const setAsThumbnail = formData.get('setAsThumbnail') === 'true';
    const setAsModelFile = formData.get('setAsModelFile') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const isImage = type === 'image' || type === 'gallery';
    const isModel = type === 'model';

    // Type & size validation
    if (isImage) {
      if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
        return NextResponse.json(
          { error: `Unsupported image format: ${file.type}. Allowed: JPG, PNG, WebP, AVIF.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          { error: 'Image file exceeds maximum 15MB limit.' },
          { status: 400 }
        );
      }
    } else if (isModel) {
      if (!ALLOWED_MODEL_MIMES.includes(file.type) && !file.name.endsWith('.glb')) {
        return NextResponse.json(
          { error: 'Invalid 3D model format. Only GLB binary files are accepted.' },
          { status: 400 }
        );
      }
      if (file.size > MAX_MODEL_SIZE_BYTES) {
        return NextResponse.json(
          { error: '3D model exceeds maximum 60MB limit.' },
          { status: 400 }
        );
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const folder = isModel ? 'models' : 'images';
    const subPath = productId ? `products/${productId}/${folder}` : `general/${folder}`;
    const key = `${subPath}/${Date.now()}-${sanitizedName}`;

    // Upload to Cloudflare R2
    const uploadResult = await uploadToR2({
      key,
      body: buffer,
      contentType: file.type || (isModel ? 'model/gltf-binary' : 'image/jpeg'),
    });

    const publicUrl = uploadResult.success
      ? uploadResult.url
      : `/assets/${sanitizedName}`; // fallback if R2 credentials absent in local dev

    // Persist to database if associated with a product
    let mediaId: string | undefined;
    if (productId) {
      mediaId = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await db.insert(schema.productMedia).values({
        id: mediaId,
        productId,
        type,
        url: publicUrl,
        fileKey: key,
        mimeType: file.type,
        sizeBytes: file.size,
        altText: file.name,
      });

      if (setAsThumbnail) {
        await db.update(schema.products)
          .set({ thumbnail: publicUrl, updatedAt: new Date() })
          .where(eq(schema.products.id, productId));
      }

      if (setAsModelFile) {
        await db.update(schema.products)
          .set({ file: publicUrl, updatedAt: new Date() })
          .where(eq(schema.products.id, productId));
      }

      revalidatePath('/admin/products');
      revalidatePath('/#collection');
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key,
      mediaId,
      r2Uploaded: uploadResult.success,
      warning: uploadResult.error,
    });
  } catch (err: any) {
    console.error('API Media Upload failed:', err);
    return NextResponse.json({ error: err.message || 'Server upload failed' }, { status: 500 });
  }
}
