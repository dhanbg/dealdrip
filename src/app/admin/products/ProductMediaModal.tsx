'use client';

import React, { useState, useEffect } from 'react';
import {
  getProductMediaAction,
  deleteProductMediaAction,
} from '@/app/actions/media';
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  Box,
  Trash2,
  CheckCircle,
  ExternalLink,
  RotateCw,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductMediaModalProps {
  product: {
    id: string;
    name: string;
    slug: string;
    thumbnail: string | null;
  };
  onClose: () => void;
  onProductUpdated?: () => void;
}

export function ProductMediaModal({ product, onClose, onProductUpdated }: ProductMediaModalProps) {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'model'>('image');
  const [setAsThumbnail, setSetAsThumbnail] = useState(false);
  const [setAsModelFile, setSetAsModelFile] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const res = await getProductMediaAction(product.id);
      if (res.success && res.media) {
        setMediaList(res.media);
      }
    } catch (err: any) {
      toast.error('Failed to load product media assets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [product.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (file.name.endsWith('.glb')) {
        setMediaType('model');
        setSetAsModelFile(true);
        setSetAsThumbnail(false);
      } else {
        setMediaType('image');
        setSetAsModelFile(false);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('productId', product.id);
    formData.append('type', mediaType);
    formData.append('setAsThumbnail', String(setAsThumbnail));
    formData.append('setAsModelFile', String(setAsModelFile));

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      toast.success(
        data.r2Uploaded
          ? 'Uploaded to Cloudflare R2 successfully!'
          : 'Media saved locally (R2 credentials absent in dev).'
      );

      setSelectedFile(null);
      await fetchMedia();
      if (onProductUpdated) onProductUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Media upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Are you sure you want to remove this media reference?')) return;
    setDeletingId(mediaId);
    try {
      const res = await deleteProductMediaAction(mediaId);
      if (res.success) {
        toast.success('Media removed successfully');
        setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
      } else {
        toast.error(res.error || 'Failed to remove media');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting media');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: '1.5rem',
    }}>
      <div style={{
        background: '#14161c',
        border: '1px solid #282c35',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '740px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #282c35', paddingBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Media & 3D Assets (Cloudflare R2)
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.2rem 0', color: '#fff' }}>
              {product.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Existing Assets List */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Associated Media Assets</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({mediaList.length})</span>
          </h4>

          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              <RotateCw size={20} className="spin" style={{ margin: '0 auto 0.5rem' }} />
              <div>Loading product media assets...</div>
            </div>
          ) : mediaList.length === 0 ? (
            <div style={{
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px dashed #282d38',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '0.85rem',
            }}>
              No dedicated R2 media assets logged yet. Default static assets are active.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {mediaList.map((media) => (
                <div
                  key={media.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: '#0e1014',
                    border: '1px solid #1e222b',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                    {media.type === 'model' ? (
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '6px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                        flexShrink: 0,
                      }}>
                        <Box size={22} />
                      </div>
                    ) : (
                      <img
                        src={media.url}
                        alt=""
                        style={{
                          width: '44px',
                          height: '44px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          background: '#000',
                          flexShrink: 0,
                        }}
                      />
                    )}

                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          background: media.type === 'model' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(74, 222, 128, 0.15)',
                          color: media.type === 'model' ? '#38bdf8' : '#4ade80',
                        }}>
                          {media.type === 'model' ? '3D GLB' : 'Image'}
                        </span>
                        {product.thumbnail === media.url && (
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: '#dfff4f',
                            color: '#000',
                          }}>
                            Active Thumbnail
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#94a3b8',
                        fontFamily: 'monospace',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        maxWidth: '380px',
                      }}>
                        {media.fileKey || media.url}
                      </div>
                      {media.sizeBytes && (
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Size: {(media.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <a
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.4rem',
                        borderRadius: '6px',
                        background: '#1a1d24',
                        border: '1px solid #282d38',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Open Public URL"
                    >
                      <ExternalLink size={14} />
                    </a>

                    <button
                      type="button"
                      disabled={deletingId === media.id}
                      onClick={() => handleDelete(media.id)}
                      style={{
                        padding: '0.4rem',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        cursor: deletingId === media.id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Delete Media Reference"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload New Asset Form */}
        <div style={{
          background: '#0e1014',
          border: '1px solid #1e222b',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={18} style={{ color: '#dfff4f' }} />
            <span>Upload New Production Media (R2 S3 API)</span>
          </h4>

          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Type selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setMediaType('image');
                  setSetAsModelFile(false);
                }}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: mediaType === 'image' ? 'rgba(223, 255, 79, 0.1)' : '#14161c',
                  border: `1px solid ${mediaType === 'image' ? '#dfff4f' : '#282d38'}`,
                  color: mediaType === 'image' ? '#dfff4f' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <ImageIcon size={16} />
                <span>Image / Photo (Max 15MB)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMediaType('model');
                  setSetAsThumbnail(false);
                  setSetAsModelFile(true);
                }}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: mediaType === 'model' ? 'rgba(56, 189, 248, 0.1)' : '#14161c',
                  border: `1px solid ${mediaType === 'model' ? '#38bdf8' : '#282d38'}`,
                  color: mediaType === 'model' ? '#38bdf8' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <Box size={16} />
                <span>3D GLB Model (Max 60MB)</span>
              </button>
            </div>

            {/* File Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#cbd5e1' }}>
                Select File ({mediaType === 'image' ? 'WebP, AVIF, PNG, JPG' : 'GLB Binary'})
              </label>
              <input
                type="file"
                accept={mediaType === 'image' ? 'image/jpeg,image/png,image/webp,image/avif' : '.glb,model/gltf-binary'}
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: '#14161c',
                  border: '1px solid #282c35',
                  color: '#fff',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {mediaType === 'image' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={setAsThumbnail}
                    onChange={(e) => setSetAsThumbnail(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#dfff4f' }}
                  />
                  <span>Set this image as primary product catalog thumbnail</span>
                </label>
              )}

              {mediaType === 'model' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={setAsModelFile}
                    onChange={(e) => setSetAsModelFile(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#38bdf8' }}
                  />
                  <span>Set this GLB as primary interactive 3D model</span>
                </label>
              )}
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="button button-lime"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: isUploading || !selectedFile ? 'not-allowed' : 'pointer',
                  opacity: isUploading || !selectedFile ? 0.6 : 1,
                }}
              >
                {isUploading ? (
                  <>
                    <RotateCw size={16} className="spin" />
                    <span>Uploading to R2...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    <span>Upload to Cloudflare R2</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
