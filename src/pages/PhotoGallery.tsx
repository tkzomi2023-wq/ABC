import { useState, useEffect, useCallback } from 'react';
import { X, Upload, Trash2, Image as ImageIcon, Loader2, ExternalLink } from 'lucide-react';
import { supabase, Photo } from '../lib/supabase';
import ResponsiveImage from '../components/ResponsiveImage';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { compressImage, buildStoragePath } from '../lib/imageCompress';

export default function PhotoGallery() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAlbum, setNewAlbum] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('photos')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPhotos(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, photos.length, closeLightbox]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewAlbum('');
    setNewLinkUrl('');
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setUploadError(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select an image.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const compressed = await compressImage(selectedFile);
      const ext = compressed.name.split('.').pop()?.toLowerCase() || 'webp';
      const path = buildStoragePath('gallery', newTitle || 'gallery-photo', ext);

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, compressed, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path);
      const imageUrl = urlData.publicUrl;

      const { error: insertError } = await supabase.from('photos').insert({
        title: newTitle.trim() || null,
        description: newDescription.trim() || null,
        image_url: imageUrl,
        album: newAlbum.trim() || 'General',
        link_url: newLinkUrl.trim() || null,
        is_published: true,
        uploaded_by: profile?.id || null,
      });

      if (insertError) throw insertError;

      resetForm();
      setShowUpload(false);
      await fetchPhotos();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    const photo = photos.find((p) => p.id === photoId);
    if (!photo) return;

    if (!window.confirm('Are you sure you want to delete this photo? This cannot be undone.')) return;

    setDeletingId(photoId);
    try {
      if (photo.image_url) {
        const url = new URL(photo.image_url);
        const path = url.pathname.split('/photos/')[1];
        if (path) {
          await supabase.storage.from('photos').remove([path]);
        }
      }

      const { error: deleteError } = await supabase.from('photos').delete().eq('id', photoId);
      if (deleteError) throw deleteError;

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading gallery..." />;

  return (
    <div className="page-container py-8 md:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">Photo Gallery</h1>
          <p className="section-subtitle">Moments and memories from Aizawl Bible College</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="btn-primary flex items-center gap-2 self-start"
          >
            <Upload className="w-4 h-4" /> Upload Photo
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {isAdmin && showUpload && (
        <div className="card p-6 mb-8">
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-navy-950 dark:text-slate-100">Upload New Photo</h2>
              <button
                type="button"
                onClick={() => { setShowUpload(false); resetForm(); }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Close upload form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm">
                {uploadError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="photo-title">Title</label>
                <input
                  id="photo-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input-field"
                  placeholder="Photo title..."
                />
              </div>
              <div>
                <label className="label" htmlFor="photo-album">Album</label>
                <input
                  id="photo-album"
                  type="text"
                  value={newAlbum}
                  onChange={(e) => setNewAlbum(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Graduation 2024"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="photo-desc">Description</label>
              <textarea
                id="photo-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
                className="input-field"
                placeholder="Brief description..."
              />
            </div>

            <div>
              <label className="label" htmlFor="photo-link">Link URL (optional)</label>
              <input
                id="photo-link"
                type="url"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                className="input-field"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="label">Image</label>
              {previewUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                  <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                      setSelectedFile(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    aria-label="Remove selected image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-navy-400 dark:hover:border-amber-400 transition-colors">
                  <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">Click to select an image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload Photo
            </button>
          </form>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="card p-12 text-center">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No photos in the gallery yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 cursor-pointer"
              onClick={() => setLightboxIndex(index)}
            >
              <ResponsiveImage
                src={photo.image_url}
                alt={photo.title || 'Gallery photo'}
                className="w-full h-full object-cover"
                loading="lazy"
                widths={[300, 600, 900]}
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                aspectRatio="1 / 1"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                {photo.title && (
                  <p className="text-white text-sm font-medium truncate">{photo.title}</p>
                )}
                {photo.album && (
                  <p className="text-white/70 text-xs truncate">{photo.album}</p>
                )}
              </div>
              {photo.link_url && (
                <a
                  href={photo.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Open external link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(photo.id);
                  }}
                  disabled={deletingId === photo.id}
                  className="absolute top-2 left-2 p-1.5 rounded-full bg-red-600/80 text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  aria-label="Delete photo"
                >
                  {deletingId === photo.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
                }}
                aria-label="Previous photo"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
                }}
                aria-label="Next photo"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}
          <div
            className="max-w-5xl max-h-[90vh] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIndex].image_url}
              alt={photos[lightboxIndex].title || 'Gallery photo'}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {(photos[lightboxIndex].title || photos[lightboxIndex].description) && (
              <div className="text-center text-white">
                {photos[lightboxIndex].title && (
                  <p className="font-medium text-sm">{photos[lightboxIndex].title}</p>
                )}
                {photos[lightboxIndex].description && (
                  <p className="text-sm text-white/70 mt-1">{photos[lightboxIndex].description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
