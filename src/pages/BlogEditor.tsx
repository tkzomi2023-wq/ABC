import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, X, Image as ImageIcon, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { supabase, BlogPost } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { compressImage, buildStoragePath } from '../lib/imageCompress';

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

type ImageField = 'featured_image_url' | 'supporting_image_url' | 'second_image_url';

const IMAGE_FIELDS: { key: ImageField; label: string; hint: string }[] = [
  { key: 'featured_image_url', label: 'Featured Image', hint: 'Main hero image — shown first and in the blog list' },
  { key: 'supporting_image_url', label: 'Supporting Image', hint: 'Appears after the introduction' },
  { key: 'second_image_url', label: 'Second Image', hint: 'Appears after the body text' },
];

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<ImageField | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [introText, setIntroText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [conclusionText, setConclusionText] = useState('');
  const [takeaway, setTakeaway] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [supportingImageUrl, setSupportingImageUrl] = useState('');
  const [secondImageUrl, setSecondImageUrl] = useState('');

  useEffect(() => {
    if (!isEditing) return;
    async function loadPost() {
      try {
        const { data, error: fetchError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) {
          setError('Blog post not found.');
          return;
        }

        const post = data as BlogPost;
        setTitle(post.title);
        setSlug(post.slug);
        setSlugTouched(true);
        setAuthorName(post.author_name);
        setHashtags(post.hashtags?.join(', ') || '');
        setIntroText(post.intro_text || '');
        setBodyText(post.body_text || '');
        setConclusionText(post.conclusion_text || '');
        setTakeaway(post.takeaway || '');
        setYoutubeUrl(post.youtube_url || '');
        setIsPublished(post.is_published);
        setFeaturedImageUrl(post.featured_image_url || '');
        setSupportingImageUrl(post.supporting_image_url || '');
        setSecondImageUrl(post.second_image_url || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load blog post');
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [id, isEditing]);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(title));
    }
  }, [title, slugTouched]);

  const handleImageUpload = useCallback(async (field: ImageField, file: File) => {
    setUploadingField(field);
    setError(null);
    try {
      const compressed = await compressImage(file);
      const ext = compressed.name.split('.').pop()?.toLowerCase() || 'webp';
      const path = buildStoragePath('blog', title || 'untitled', ext);

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, compressed, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      if (field === 'featured_image_url') setFeaturedImageUrl(publicUrl);
      else if (field === 'supporting_image_url') setSupportingImageUrl(publicUrl);
      else if (field === 'second_image_url') setSecondImageUrl(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to upload image: ${field}`);
    } finally {
      setUploadingField(null);
    }
  }, [title]);

  const removeImage = (field: ImageField) => {
    if (field === 'featured_image_url') setFeaturedImageUrl('');
    else if (field === 'supporting_image_url') setSupportingImageUrl('');
    else if (field === 'second_image_url') setSecondImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const finalSlug = slug || slugify(title);
      if (!title.trim()) throw new Error('Title is required.');
      if (!finalSlug) throw new Error('Slug is required.');
      if (!authorName.trim()) throw new Error('Author name is required.');

      const tags = hashtags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        slug: finalSlug,
        author_name: authorName.trim(),
        author_id: profile?.id || null,
        featured_image_url: featuredImageUrl || null,
        supporting_image_url: supportingImageUrl || null,
        second_image_url: secondImageUrl || null,
        intro_text: introText || null,
        body_text: bodyText || null,
        conclusion_text: conclusionText || null,
        takeaway: takeaway || null,
        youtube_url: youtubeUrl || null,
        hashtags: tags,
        is_published: isPublished,
      };

      if (isEditing) {
        const existingPublishedAt = (await supabase
          .from('blog_posts')
          .select('published_at')
          .eq('id', id)
          .maybeSingle()
        ).data?.published_at;

        const finalPayload = {
          ...payload,
          updated_at: new Date().toISOString(),
          published_at: isPublished
            ? (existingPublishedAt || new Date().toISOString())
            : null,
        };

        const { error: updateError } = await supabase
          .from('blog_posts')
          .update(finalPayload)
          .eq('id', id);
        if (updateError) throw updateError;
        navigate(`/post/${finalSlug}`);
      } else {
        const insertPayload = {
          ...payload,
          view_count: 0,
          published_at: isPublished ? new Date().toISOString() : null,
        };
        const { data, error: insertError } = await supabase
          .from('blog_posts')
          .insert(insertPayload)
          .select('slug')
          .single();

        if (insertError) throw insertError;
        navigate(`/post/${data.slug}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save blog post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading editor..." />;

  const imageState: Record<ImageField, string> = {
    featured_image_url: featuredImageUrl,
    supporting_image_url: supportingImageUrl,
    second_image_url: secondImageUrl,
  };

  return (
    <div className="page-container py-8 md:py-12 max-w-3xl">
      <Link
        to="/blog"
        className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-navy-700 dark:hover:text-amber-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Blog
      </Link>

      <h1 className="section-title mb-6">{isEditing ? 'Edit Blog Post' : 'Write New Blog Post'}</h1>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <div>
            <label className="label" htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input-field"
              placeholder="Enter post title..."
            />
          </div>

          <div>
            <label className="label" htmlFor="slug">Slug</label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              className="input-field"
              placeholder="auto-generated-from-title"
            />
            <p className="text-xs text-slate-400 mt-1">URL: /post/{slug || slugify(title) || '...'}</p>
          </div>

          <div>
            <label className="label" htmlFor="author">Author Name *</label>
            <input
              id="author"
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
              className="input-field"
              placeholder="e.g. Rev. Dr. John Doe"
            />
          </div>

          <div>
            <label className="label" htmlFor="hashtags">Hashtags (comma-separated)</label>
            <input
              id="hashtags"
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="input-field"
              placeholder="theology, devotion, missions"
            />
            <p className="text-xs text-slate-400 mt-1">Separate tags with commas. The # symbol is added automatically.</p>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <label className="label" htmlFor="intro">Introduction</label>
            <textarea
              id="intro"
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
              rows={4}
              className="input-field font-mono text-sm"
              placeholder="<p>Write your introduction here. HTML is supported.</p>"
            />
          </div>

          <div>
            <label className="label" htmlFor="body">Body</label>
            <textarea
              id="body"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={10}
              className="input-field font-mono text-sm"
              placeholder="<p>Write your main content here. HTML is supported.</p>"
            />
          </div>

          <div>
            <label className="label" htmlFor="conclusion">Conclusion</label>
            <textarea
              id="conclusion"
              value={conclusionText}
              onChange={(e) => setConclusionText(e.target.value)}
              rows={4}
              className="input-field font-mono text-sm"
              placeholder="<p>Write your conclusion here. HTML is supported.</p>"
            />
          </div>

          <div>
            <label className="label" htmlFor="takeaway">Key Takeaway</label>
            <textarea
              id="takeaway"
              value={takeaway}
              onChange={(e) => setTakeaway(e.target.value)}
              rows={3}
              className="input-field font-mono text-sm"
              placeholder="<p>Summarize the main lesson or takeaway.</p>"
            />
          </div>

          <div>
            <label className="label" htmlFor="youtube">YouTube URL (optional)</label>
            <input
              id="youtube"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="input-field"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold text-navy-950 dark:text-slate-100">Images</h2>
          {IMAGE_FIELDS.map(({ key, label, hint }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <p className="text-xs text-slate-400 mb-2">{hint}</p>
              {imageState[key] ? (
                <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                  <img src={imageState[key]} alt={label} className="w-full h-40 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(key)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    aria-label={`Remove ${label}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-navy-400 dark:hover:border-amber-400 transition-colors ${uploadingField === key ? 'opacity-50 pointer-events-none' : ''}`}>
                  {uploadingField === key ? (
                    <Loader2 className="w-6 h-6 text-navy-500 animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-500 dark:text-slate-400">Click to upload</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(key, file);
                      e.target.value = '';
                    }}
                    disabled={uploadingField === key}
                  />
                </label>
              )}
            </div>
          ))}
        </div>

        <div className="card p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setIsPublished((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublished ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              role="switch"
              aria-checked={isPublished}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isPublished ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <div className="flex items-center gap-2">
              {isPublished ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {isPublished ? 'Published — visible to everyone' : 'Draft — not publicly visible'}
              </span>
            </div>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditing ? 'Update Post' : 'Save Post'}
          </button>
          <Link to="/blog" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
