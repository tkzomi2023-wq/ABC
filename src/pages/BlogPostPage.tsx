import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Loader, AlertCircle, Hash, X, Maximize2, LogIn, UserPlus, BookOpen, Eye } from 'lucide-react';
import { supabase, BlogPost } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function renderParagraphs(text: string | null): string[] {
  if (!text) return [];
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function ReadGate({ redirectPath }: { redirectPath: string }) {
  const encoded = encodeURIComponent(redirectPath);
  return (
    <div className="relative mt-0">
      {/* Fade-out gradient over the blurred preview text */}
      <div className="absolute -top-32 inset-x-0 h-32 bg-gradient-to-b from-transparent to-white z-10 pointer-events-none" />

      {/* Gate card */}
      <div className="relative z-20 mx-auto max-w-lg">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-navy-700 via-gold-500 to-navy-700" />

          <div className="p-8 text-center">
            {/* Icon */}
            <div className="w-14 h-14 bg-navy-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-navy-700" />
            </div>

            {/* Heading */}
            <h3 className="text-xl font-serif font-bold text-navy-900 mb-2">
              Read the Full Article
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Create a free account or log in to continue reading this article and access all content on the ABC portal.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to={`/login?redirect=${encoded}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-navy-800 hover:bg-navy-900 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                <LogIn className="w-4 h-4" />
                Log In
              </Link>
              <Link
                to={`/register?redirect=${encoded}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-600 text-navy-950 font-semibold rounded-xl transition-colors text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Create Free Account
              </Link>
            </div>

            <p className="text-xs text-slate-400 mt-4">Free to join — no subscription required</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const viewedSlugRef = useRef<string | null>(null);

  const isLoggedIn = !authLoading && !!user;

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data, error: loadErr } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      if (loadErr) { setError(loadErr.message); setLoading(false); return; }
      if (!data) { setError('Post not found.'); setLoading(false); return; }
      setPost(data as BlogPost);
      setLoading(false);

      // Increment view count once per slug (guard against React StrictMode double-invoke)
      if (viewedSlugRef.current !== slug) {
        viewedSlugRef.current = slug;
        const { data: rpcData } = await supabase.rpc('increment_blog_post_view', { post_slug: slug });
        if (rpcData != null) setViewCount(rpcData as number);
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [lightbox]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 text-navy-700 animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-navy-900 mb-2">{error || 'Post not found'}</h1>
          <p className="text-slate-500 mb-6">The post you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="btn-primary inline-flex"><ArrowLeft className="w-4 h-4" /> Back to Home</Link>
        </div>
      </div>
    );
  }

  const introParas = renderParagraphs(post.intro_text);
  const bodyParas = renderParagraphs(post.body_text);
  const conclusionParas = renderParagraphs(post.conclusion_text);
  const ytId = post.youtube_url ? getYouTubeId(post.youtube_url) : null;

  // For non-logged-in users: show only first 2 intro paragraphs, then gate
  const previewParas = introParas.slice(0, 2);
  const hasGatedContent =
    !isLoggedIn &&
    (introParas.length > 2 || bodyParas.length > 0 || conclusionParas.length > 0 || !!post.takeaway);

  return (
    <article className="page-enter">
      <div className="page-container py-10 md:py-14 max-w-3xl lg:max-w-5xl xl:max-w-6xl">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-navy-700 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.hashtags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gold-100 text-gold-700 text-xs font-semibold rounded-full">
                <Hash className="w-3 h-3" />{tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-navy-900 leading-tight mb-3">
          {post.title}
        </h1>

        {/* Metadata bar */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-6">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gold-500" />
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
              : new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <User className="w-4 h-4 text-gold-500" />
            {post.author_name}
          </span>
          {viewCount != null && (
            <span className="inline-flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-gold-500" />
              {viewCount.toLocaleString('en-IN')} {viewCount === 1 ? 'view' : 'views'}
            </span>
          )}
        </div>

        {/* YouTube embed — custom branded player */}
        {ytId && (
          <div className="mb-10 flex justify-center">
            <div className="relative group w-full sm:w-[85%] lg:w-[65%]">
              <div className="absolute -inset-[3px] rounded-[22px] bg-gradient-to-r from-gold-400 via-navy-600 to-gold-500 opacity-60 group-hover:opacity-90 blur-[4px] transition-opacity duration-700 animate-pulse" />
              <div className="absolute -inset-[1.5px] rounded-[21px] bg-gradient-to-r from-gold-300 via-navy-500 to-gold-400 opacity-80" />
              <div
                ref={playerRef}
                className="relative rounded-[20px] overflow-hidden bg-black shadow-2xl"
                style={{ aspectRatio: '16 / 9', boxShadow: '0 25px 60px rgba(0,0,0,0.45), 0 8px 20px rgba(0,0,0,0.3)' }}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1`}
                  title={post.title}
                  className="absolute inset-0 w-full h-full"
                  style={{ transform: 'scale(1.12)', transformOrigin: 'center' }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
                <div className="absolute top-0 right-0 w-[140px] h-[60px] bg-black pointer-events-none z-[5]" />
                <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-[5]" />
                <button
                  onClick={() => {
                    if (playerRef.current) {
                      if (document.fullscreenElement) {
                        document.exitFullscreen();
                      } else {
                        playerRef.current.requestFullscreen();
                      }
                    }
                  }}
                  className="absolute bottom-2.5 right-3 z-10 p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-lg transition-all duration-200 hover:scale-110 border border-white/10 backdrop-blur-sm"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── FEATURED IMAGE ── always visible */}
        {post.featured_image_url && (
          <figure className="mb-8">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full rounded-2xl shadow-lg object-cover max-h-[500px] cursor-zoom-in transition-transform hover:scale-[1.01]"
              onClick={() => setLightbox(post.featured_image_url!)}
            />
          </figure>
        )}

        {/* ── PREVIEW: first 2 intro paragraphs — always visible ── */}
        {previewParas.length > 0 && (
          <div className="space-y-4 mb-6">
            {previewParas.map((p, i) => (
              <p key={i} className="text-slate-700 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </div>
        )}

        {/* ── GATE for non-logged-in users ── */}
        {hasGatedContent && (
          <>
            {/* Blurred preview of remaining content */}
            <div className="relative overflow-hidden" style={{ maxHeight: '120px' }}>
              <div className="space-y-4 select-none pointer-events-none" style={{ filter: 'blur(4px)', opacity: 0.5 }}>
                {(introParas.slice(2, 4).length > 0 ? introParas.slice(2, 4) : bodyParas.slice(0, 2)).map((p, i) => (
                  <p key={i} className="text-slate-700 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </div>
            </div>

            {/* Gate card */}
            <ReadGate redirectPath={`/post/${slug}`} />
          </>
        )}

        {/* ── FULL CONTENT for logged-in users ── */}
        {isLoggedIn && (
          <>
            {/* Remaining intro paragraphs (beyond the 2 shown in preview) */}
            {introParas.length > 2 && (
              <div className="space-y-4 mb-8">
                {introParas.slice(2).map((p, i) => (
                  <p key={i} className="text-slate-700 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </div>
            )}

            {/* Supporting image + Body text */}
            {post.supporting_image_url && bodyParas.length > 0 ? (
              <div className="mb-8 clearfix">
                <figure className="float-none sm:float-right ml-0 sm:ml-6 mb-4 w-full sm:w-[35%]">
                  <img
                    src={post.supporting_image_url}
                    alt={post.title}
                    className="w-full rounded-2xl shadow-lg object-cover max-h-[500px] cursor-zoom-in transition-transform hover:scale-[1.01]"
                    onClick={() => setLightbox(post.supporting_image_url!)}
                  />
                </figure>
                <div className="space-y-4">
                  {bodyParas.map((p, i) => (
                    <p key={i} className="text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: p }} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {post.supporting_image_url && (
                  <figure className="my-10 flex justify-end">
                    <img
                      src={post.supporting_image_url}
                      alt={post.title}
                      className="w-full md:w-3/4 rounded-2xl shadow-lg object-cover max-h-[400px] cursor-zoom-in transition-transform hover:scale-[1.01]"
                      onClick={() => setLightbox(post.supporting_image_url!)}
                    />
                  </figure>
                )}
                {bodyParas.length > 0 && (
                  <div className="space-y-4 mb-8">
                    {bodyParas.map((p, i) => (
                      <p key={i} className="text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: p }} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Second image + Conclusion text */}
            {post.second_image_url && conclusionParas.length > 0 ? (
              <div className="mb-8 clearfix">
                <figure className="float-none sm:float-left mr-0 sm:mr-6 mb-4 w-full sm:w-[35%]">
                  <img
                    src={post.second_image_url}
                    alt={post.title}
                    className="w-full rounded-2xl shadow-lg object-cover max-h-[500px] cursor-zoom-in transition-transform hover:scale-[1.01]"
                    onClick={() => setLightbox(post.second_image_url!)}
                  />
                </figure>
                <div className="space-y-4">
                  {conclusionParas.map((p, i) => (
                    <p key={i} className="text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: p }} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {post.second_image_url && (
                  <figure className="my-10 flex justify-start">
                    <img
                      src={post.second_image_url}
                      alt={post.title}
                      className="w-full md:w-3/4 rounded-2xl shadow-lg object-cover max-h-[400px] cursor-zoom-in transition-transform hover:scale-[1.01]"
                      onClick={() => setLightbox(post.second_image_url!)}
                    />
                  </figure>
                )}
                {conclusionParas.length > 0 && (
                  <div className="space-y-4 mb-8">
                    {conclusionParas.map((p, i) => (
                      <p key={i} className="text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: p }} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Takeaway */}
            {post.takeaway && (
              <div className="my-10 p-6 bg-navy-50 border-l-4 border-gold-500 rounded-r-xl">
                <p className="text-navy-900 font-serif text-lg italic leading-relaxed">{post.takeaway}</p>
              </div>
            )}
          </>
        )}

        {/* Footer — only for logged-in users (gate already has navigation) */}
        {isLoggedIn && (
          <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/" className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Back to Home</Link>
            <p className="text-sm text-slate-500">By {post.author_name}</p>
          </div>
        )}

        {/* Back link for non-logged-in users after gate */}
        {!isLoggedIn && (
          <div className="mt-8 text-center">
            <Link to="/" className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Back to Home</Link>
          </div>
        )}
      </div>

      {/* Fullscreen image viewer */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/10 text-white rounded-full hover:bg-white/30 transition-colors border border-white/20"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="flex items-center justify-center w-full h-full p-4 sm:p-8 md:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox}
              alt="Full view"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
        </div>
      )}
    </article>
  );
}
