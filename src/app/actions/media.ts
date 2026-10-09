'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  generatePresignedUploadUrl,
  uploadToR2,
  deleteFromR2,
  resolvePublicMediaUrl,
  ALLOWED_IMAGE_MIMES,
  ALLOWED_MODEL_MIMES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_MODEL_SIZE_BYTES,
  isR2Configured,
} from '@/lib/r2';

async function assertAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || (session.user as any).role !== 'admin') {
    throw new Error('Access denied. Administrator privileges required.');
  }

  return session.user;
}

export async function requestMediaUploadAction(params: {
  productId?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  type: 'image' | 'model' | 'gallery';
}) {
  try {
    await assertAdmin();

    const isImage = params.type === 'image' || params.type === 'gallery';
    const isModel = params.type === 'model';

    // MIME and size validation
    if (isImage) {
      if (!ALLOWED_IMAGE_MIMES.includes(params.mimeType)) {
        return { success: false, error: `Invalid image type: ${params.mimeType}. Allowed: JPG, PNG, WebP, AVIF.` };
      }
      if (params.sizeBytes > MAX_IMAGE_SIZE_BYTES) {
        return { success: false, error: `Image exceeds maximum allowed size of 15MB.` };
      }
    } else if (isModel) {
      if (!ALLOWED_MODEL_MIMES.includes(params.mimeType) && !params.fileName.endsWith('.glb')) {
        return { success: false, error: `Invalid 3D model type. Only GLB binary files are supported.` };
      }
      if (params.sizeBytes > MAX_MODEL_SIZE_BYTES) {
        return { success: false, error: `3D model exceeds maximum allowed size of 60MB.` };
      }
    }

    const sanitizedName = params.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const folder = isModel ? 'models' : 'images';
    const subPath = params.productId ? `products/${params.productId}/${folder}` : `general/${folder}`;
    const key = `${subPath}/${Date.now()}-${sanitizedName}`;

    const presigned = await generatePresignedUploadUrl({
      key,
      contentType: params.mimeType,
      expiresInSeconds: 900,
    });

    return {
      success: true,
      presigned,
      fileKey: key,
      publicUrl: resolvePublicMediaUrl(key),
      r2Configured: isR2Configured(),
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function confirmMediaUploadAction(params: {
  productId: string;
  variantId?: string;
  type: 'image' | 'model' | 'gallery';
  url: string;
  fileKey: string;
  altText?: string;
  mimeType?: string;
  sizeBytes?: number;
  setAsThumbnail?: boolean;
  setAsModelFile?: boolean;
}) {
  try {
    await assertAdmin();

    const mediaId = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await db.insert(schema.productMedia).values({
      id: mediaId,
      productId: params.productId,
      variantId: params.variantId || null,
      type: params.type,
      url: params.url,
      fileKey: params.fileKey,
      mimeType: params.mimeType || null,
      sizeBytes: params.sizeBytes || null,
      altText: params.altText || null,
    });

    // Update product thumbnail if requested
    if (params.setAsThumbnail) {
      await db.update(schema.products)
        .set({ thumbnail: params.url, updatedAt: new Date() })
        .where(eq(schema.products.id, params.productId));
    }

    // Update product 3D model if requested
    if (params.setAsModelFile) {
      await db.update(schema.products)
        .set({ file: params.url, updatedAt: new Date() })
        .where(eq(schema.products.id, params.productId));
    }

    revalidatePath('/admin/products');
    revalidatePath('/#collection');

    return { success: true, mediaId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getProductMediaAction(productId: string) {
  try {
    const list = await db.query.productMedia.findMany({
      where: eq(schema.productMedia.productId, productId),
      orderBy: [desc(schema.productMedia.createdAt)],
    });
    return { success: true, media: list };
  } catch (err: any) {
    return { success: false, error: err.message, media: [] };
  }
}

export async function deleteProductMediaAction(mediaId: string) {
  try {
    await assertAdmin();

    const item = await db.query.productMedia.findFirst({
      where: eq(schema.productMedia.id, mediaId),
    });

    if (item?.fileKey) {
      await deleteFromR2(item.fileKey);
    }

    await db.delete(schema.productMedia).where(eq(schema.productMedia.id, mediaId));

    revalidatePath('/admin/products');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
