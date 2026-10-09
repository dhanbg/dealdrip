import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';

// Lazy/singleton R2 client instance
let r2ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client | null {
  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    return null;
  }

  if (!r2ClientInstance) {
    const endpoint =
      env.R2_ENDPOINT ||
      `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

    r2ClientInstance = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return r2ClientInstance;
}

export function isR2Configured(): boolean {
  return !!(env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY);
}

// Media type configurations
export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

export const ALLOWED_MODEL_MIMES = [
  'model/gltf-binary',
  'application/octet-stream',
  'model/gltf+json',
];

export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_MODEL_SIZE_BYTES = 60 * 1024 * 1024; // 60MB

export function resolvePublicMediaUrl(keyOrUrl: string): string {
  if (!keyOrUrl) return '';
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    return keyOrUrl;
  }
  if (keyOrUrl.startsWith('/')) {
    return keyOrUrl;
  }

  const baseMediaUrl = env.NEXT_PUBLIC_MEDIA_URL || 'https://media.dealdrip.store';
  return `${baseMediaUrl.replace(/\/$/, '')}/${keyOrUrl.replace(/^\//, '')}`;
}

export async function uploadToR2(params: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<{ success: boolean; url: string; key: string; error?: string }> {
  const client = getR2Client();

  if (!client) {
    // Graceful fallback for local development without live R2 credentials
    return {
      success: false,
      error: 'Cloudflare R2 credentials (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are not set.',
      url: resolvePublicMediaUrl(params.key),
      key: params.key,
    };
  }

  try {
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME || 'dealdrip-media',
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await client.send(command);

    return {
      success: true,
      url: resolvePublicMediaUrl(params.key),
      key: params.key,
    };
  } catch (err: any) {
    console.error('R2 Upload error:', err);
    return {
      success: false,
      error: err.message || 'Failed to upload object to Cloudflare R2',
      url: '',
      key: params.key,
    };
  }
}

export async function generatePresignedUploadUrl(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<{ success: boolean; uploadUrl?: string; key: string; publicUrl: string; error?: string }> {
  const client = getR2Client();

  if (!client) {
    return {
      success: false,
      error: 'Cloudflare R2 credentials are not configured.',
      key: params.key,
      publicUrl: resolvePublicMediaUrl(params.key),
    };
  }

  try {
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME || 'dealdrip-media',
      Key: params.key,
      ContentType: params.contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: params.expiresInSeconds || 900, // 15 minutes
    });

    return {
      success: true,
      uploadUrl,
      key: params.key,
      publicUrl: resolvePublicMediaUrl(params.key),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to create presigned URL',
      key: params.key,
      publicUrl: resolvePublicMediaUrl(params.key),
    };
  }
}

export async function deleteFromR2(key: string): Promise<boolean> {
  const client = getR2Client();
  if (!client) return false;

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: env.R2_BUCKET_NAME || 'dealdrip-media',
        Key: key,
      })
    );
    return true;
  } catch (err) {
    console.error('Failed to delete object from R2:', err);
    return false;
  }
}
