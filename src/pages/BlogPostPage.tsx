import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, Eye, Tag, ArrowLeft, X, Youtube } from 'lucide-react';
import { supabase, BlogPost } from '../lib/supabase';
import ResponsiveImage from '../components/ResponsiveImage';
import LoadingSpinner from '../components/LoadingSpinner';
import { sanitizeHtml } from '../lib/sanitize';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const videoId = u.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (u.hostname.includes('youtu.be')) {
      const videoId = u.pathname.slice(1);
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
  } catch {
    return null;
  }
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const hasIncrementedView = useRef(false);

  const openLightbox = useCallback((src: string) => setLightboxSrc(src), []);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  useEffect(() => {
    if (!slug) return;

    async function fetchPost() {
      try {
        const { data, error: fetchError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) {
          setError('Blog post not found.');
          return;
        }
        setPost(data as BlogPost);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load blog post');
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [slug]);

  useEffect(() => {
    if (!post || hasIncrementedView.current) return;
    hasIncrementedView.current = true;

    supabase
      .from('blog_posts')
      .update({ view_count: post.view_count + 1 })
      .eq('id', post.id)
      .then(({ error }) => {
        if (!error) {
          setPost({ ...post, view_count: post.view_count + 1 });
        }
      });
  }, [post]);

  useEffect(() => {
    if (!lightboxSrc) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [lightboxSrc, closeLightbox]);

  if (loading) return <LoadingSpinner message="Loading blog post..." />;

  if (error || !post) {
    return (
      <div className="page-container py-16">
        <div className="card p-8 text-center max-w-lg mx-auto">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Blog post not found.'}</p>
          <Link to="/blog" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const images = [post.featured_image_url, post.supporting_image_url, post.second_image_url].filter(
    (img): img is string => !!img
  );
  const youtubeEmbed = post.youtube_url ? getYouTubeEmbedUrl(post.youtube_url) : null;

  return (
    <article className="page-container py-8 md:py-12 max-w-4xl">
      <Link
        to="/blog"
        className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-navy-700 dark:hover:text-amber-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Blog
      </Link>

      <header className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-navy-950 dark:text-slate-100 mb-4 leading-tight">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            {post.author_name}
          </span>
          {post.published_at && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(post.published_at)}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            {post.view_count} {post.view_count === 1 ? 'view' : 'views'}
          </span>
        </div>
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.hashtags.map((tag) => (
              <Link
                key={tag}
                to="/blog"
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-navy-50 text-navy-600 dark:bg-slate-700 dark:text-amber-300 flex items-center gap-1 hover:bg-navy-100 dark:hover:bg-slate-600 transition-colors"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </Link>
            ))}
          </div>
        )}
      </header>

      {post.featured_image_url && (
        <div
          className="mb-8 rounded-2xl overflow-hidden cursor-pointer group"
          onClick={() => openLightbox(post.featured_image_url!)}
        >
          <ResponsiveImage
            src={post.featured_image_url}
            alt={post.title}
            className="w-full object-cover transition-transform group-hover:scale-[1.02] duration-300"
            loading="eager"
            widths={[800, 1200, 1600]}
            sizes="(max-width: 768px) 100vw, 800px"
            aspectRatio="16 / 9"
          />
        </div>
      )}

      {post.intro_text && (
        <section className="mb-8">
          <div
            className="max-w-none text-slate-700 dark:text-slate-300 leading-relaxed text-lg font-serif
              [&_a]:text-navy-600 dark:[&_a]:text-amber-400 [&_a]:underline
              [&_img]:rounded-xl [&_blockquote]:border-l-4 [&_blockquote]:border-gold-400 [&_blockquote]:pl-4 [&_blockquote]:italic"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.intro_text) }}
          />
        </section>
      )}

      {post.supporting_image_url && (
        <div
          className="mb-8 rounded-2xl overflow-hidden cursor-pointer group"
          onClick={() => openLightbox(post.supporting_image_url!)}
        >
          <ResponsiveImage
            src={post.supporting_image_url}
            alt={`${post.title} - supporting image`}
            className="w-full object-cover transition-transform group-hover:scale-[1.02] duration-300"
            loading="lazy"
            widths={[800, 1200]}
            sizes="(max-width: 768px) 100vw, 800px"
            aspectRatio="16 / 9"
          />
        </div>
      )}

      {post.body_text && (
        <section className="mb-8">
          <div
            className="max-w-none text-slate-700 dark:text-slate-300 leading-relaxed
              [&_a]:text-navy-600 dark:[&_a]:text-amber-400 [&_a]:underline
              [&_img]:rounded-xl [&_blockquote]:border-l-4 [&_blockquote]:border-gold-400 [&_blockquote]:pl-4 [&_blockquote]:italic"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.body_text) }}
          />
        </section>
      )}

      {post.second_image_url && (
        <div
          className="mb-8 rounded-2xl overflow-hidden cursor-pointer group"
          onClick={() => openLightbox(post.second_image_url!)}
        >
          <ResponsiveImage
            src={post.second_image_url}
            alt={`${post.title} - second image`}
            className="w-full object-cover transition-transform group-hover:scale-[1.02] duration-300"
            loading="lazy"
            widths={[800, 1200]}
            sizes="(max-width: 768px) 100vw, 800px"
            aspectRatio="16 / 9"
          />
        </div>
      )}

      {post.conclusion_text && (
        <section className="mb-8">
          <div
            className="max-w-none text-slate-700 dark:text-slate-300 leading-relaxed
              [&_a]:text-navy-600 dark:[&_a]:text-amber-400 [&_a]:underline
              [&_img]:rounded-xl [&_blockquote]:border-l-4 [&_blockquote]:border-gold-400 [&_blockquote]:pl-4 [&_blockquote]:italic"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.conclusion_text) }}
          />
        </section>
      )}

      {youtubeEmbed && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Youtube className="w-5 h-5 text-red-600" />
            <h2 className="font-serif text-xl font-bold text-navy-950 dark:text-slate-100">Video</h2>
          </div>
          <div className="relative w-full rounded-2xl overflow-hidden shadow-lg" style={{ aspectRatio: '16 / 9' }}>
            <iframe
              src={youtubeEmbed}
              title={`${post.title} - YouTube video`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {post.takeaway && (
        <section className="mb-8">
          <div className="rounded-2xl bg-gradient-to-br from-navy-50 to-gold-50 dark:from-slate-800 dark:to-slate-700 border border-gold-200 dark:border-slate-600 p-6 md:p-8">
            <h2 className="font-serif text-xl font-bold text-navy-900 dark:text-amber-400 mb-3">
              Key Takeaway
            </h2>
            <div
              className="text-slate-700 dark:text-slate-200 leading-relaxed
                [&_a]:text-navy-600 dark:[&_a]:text-amber-400 [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.takeaway) }}
            />
          </div>
        </section>
      )}

      {images.length === 0 && !post.intro_text && !post.body_text && (
        <div className="card p-8 text-center text-slate-500 dark:text-slate-400">
          <p>This post has no content yet.</p>
        </div>
      )}

      {lightboxSrc && (
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
          <img
            src={lightboxSrc}
            alt="Full size image"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </article>
  );
}
