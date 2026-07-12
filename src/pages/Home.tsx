import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, BookOpen, GraduationCap, Users, Eye } from 'lucide-react';
import { supabase, Notice, Photo, BlogPost, SiteSetting } from '../lib/supabase';
import ResponsiveImage from '../components/ResponsiveImage';
import LoadingSpinner from '../components/LoadingSpinner';

const DEFAULT_HERO_IMAGE = 'https://images.pexels.com/photos/289737/pexels-photo-289737.jpeg?auto=compress&cs=tinysrgb&w=1600';
const DEFAULT_ABOUT_IMAGE = 'https://images.pexels.com/photos/256531/pexels-photo-256531.jpeg?auto=compress&cs=tinysrgb&w=800';

type SiteStats = {
  id: number;
  total_views: number;
  updated_at: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  academic: 'Academic',
  event: 'Event',
  fee: 'Fee',
  urgent: 'Urgent',
};

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  academic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  event: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  fee: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState(DEFAULT_HERO_IMAGE);
  const [heroOpacity, setHeroOpacity] = useState(0.5);
  const [aboutImage, setAboutImage] = useState(DEFAULT_ABOUT_IMAGE);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .in('setting_key', ['home_hero_image', 'home_hero_opacity', 'home_about_image']);

    if (error) throw error;

    const settings = (data || []) as SiteSetting[];
    const settingsMap = new Map(settings.map((s) => [s.setting_key, s.setting_value]));

    if (settingsMap.get('home_hero_image')) setHeroImage(settingsMap.get('home_hero_image')!);
    const opacityStr = settingsMap.get('home_hero_opacity');
    if (opacityStr !== undefined) {
      const parsed = parseFloat(opacityStr);
      if (!isNaN(parsed)) setHeroOpacity(Math.min(1, Math.max(0, parsed)));
    }
    if (settingsMap.get('home_about_image')) setAboutImage(settingsMap.get('home_about_image')!);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (photos.length > 0 ? (prev + 1) % photos.length : 0));
  }, [photos.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (photos.length > 0 ? (prev - 1 + photos.length) % photos.length : 0));
  }, [photos.length]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (photos.length > 1) {
      interval = setInterval(nextSlide, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [photos.length, nextSlide]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchSettings(),
          (async () => {
            const { data, error } = await supabase
              .from('photos')
              .select('*')
              .eq('is_published', true)
              .order('created_at', { ascending: false })
              .limit(8);
            if (error) throw error;
            setPhotos((data || []) as Photo[]);
          })(),
          (async () => {
            const { data, error } = await supabase
              .from('blog_posts')
              .select('*')
              .eq('is_published', true)
              .order('published_at', { ascending: false })
              .limit(3);
            if (error) throw error;
            setBlogPosts((data || []) as BlogPost[]);
          })(),
          (async () => {
            const { data, error } = await supabase
              .from('notices')
              .select('*')
              .eq('is_published', true)
              .order('created_at', { ascending: false })
              .limit(4);
            if (error) throw error;
            setNotices((data || []) as Notice[]);
          })(),
          (async () => {
            const { data, error } = await supabase
              .from('site_stats')
              .select('*')
              .limit(1)
              .maybeSingle();
            if (error) throw error;
            if (data) setStats(data as SiteStats);
          })(),
        ]);
      } catch (err) {
        console.error('Error fetching home data:', err);
        setError('Failed to load page content. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchSettings]);

  if (loading) return <LoadingSpinner message="Loading home page..." />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <p className="text-red-500 dark:text-red-400 text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <ResponsiveImage
            src={heroImage}
            alt="Aizawl Bible College campus"
            className="w-full h-full object-cover"
            loading="eager"
            widths={[800, 1200, 1600, 1920]}
            sizes="100vw"
            fallbackSrc={DEFAULT_HERO_IMAGE}
          />
        </div>
        <div
          className="absolute inset-0 bg-navy-950"
          style={{ opacity: heroOpacity }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/20 to-transparent" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Aizawl Bible College
          </h1>
          <p className="text-lg sm:text-xl text-slate-200 max-w-2xl mb-8 drop-shadow-md">
            Equipping servants of God for His kingdom work through biblical education and ministry training.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gold-500 text-navy-950 font-semibold hover:bg-gold-400 transition-colors shadow-lg"
            >
              Learn More <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 backdrop-blur-sm text-white font-semibold border border-white/30 hover:bg-white/20 transition-colors"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Slider */}
      {photos.length > 0 && (
        <section className="py-16 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-900 dark:text-white">
                  Campus Gallery
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">A glimpse into life at ABC</p>
              </div>
              <Link
                to="/gallery"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-navy-600 dark:text-gold-400 hover:underline"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="relative overflow-hidden rounded-2xl shadow-xl" ref={sliderRef}>
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {photos.map((photo) => (
                  <div key={photo.id} className="w-full flex-shrink-0 relative aspect-[16/9]">
                    <ResponsiveImage
                      src={photo.image_url}
                      alt={photo.title || 'Campus photo'}
                      className="w-full h-full object-cover"
                      widths={[400, 800, 1200, 1600]}
                      sizes="100vw"
                      aspectRatio="16/9"
                    />
                    {photo.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-navy-950/80 to-transparent p-6">
                        <p className="text-white font-medium text-lg">{photo.title}</p>
                        {photo.description && (
                          <p className="text-slate-200 text-sm mt-1 line-clamp-2">{photo.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 flex items-center justify-center text-navy-900 dark:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-lg"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 flex items-center justify-center text-navy-900 dark:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-lg"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {photos.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          idx === currentSlide
                            ? 'bg-gold-400'
                            : 'bg-white/50 hover:bg-white/80'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 sm:hidden">
              <Link
                to="/gallery"
                className="inline-flex items-center gap-1 text-sm font-medium text-navy-600 dark:text-gold-400 hover:underline"
              >
                View all photos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* About Snippet */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-900 dark:text-white mb-4">
                About Our College
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Aizawl Bible College is a theological institution under the Assemblies of God Mizoram District,
                dedicated to biblical education and ministry training. We are committed to equipping men and women
                for effective Christian service.
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Our programs combine rigorous academic study with practical ministry experience, preparing students
                for a lifetime of faithful service to God and His church.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-600 transition-colors"
              >
                Read more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="order-1 md:order-2">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <ResponsiveImage
                  src={aboutImage}
                  alt="Aizawl Bible College campus life"
                  className="w-full object-cover"
                  widths={[400, 600, 800]}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  aspectRatio="4/3"
                  fallbackSrc={DEFAULT_ABOUT_IMAGE}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      {blogPosts.length > 0 && (
        <section className="py-16 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-900 dark:text-white">
                  From Our Blog
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Latest articles and reflections</p>
              </div>
              <Link
                to="/blog"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-navy-600 dark:text-gold-400 hover:underline"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post) => {
                const images = [
                  post.featured_image_url,
                  post.supporting_image_url,
                  post.second_image_url,
                ].filter(Boolean) as string[];

                return (
                  <article
                    key={post.id}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow flex flex-col"
                  >
                    <Link to={`/post/${post.slug}`} className="block">
                      {images.length > 0 && (
                        <div className={images.length === 1 ? 'aspect-[16/9]' : 'grid grid-cols-2 gap-0.5 aspect-[16/9]'}>
                          {images.length === 1 ? (
                            <ResponsiveImage
                              src={images[0]}
                              alt={post.title}
                              className="w-full h-full object-cover"
                              widths={[400, 600, 800]}
                              sizes="(max-width: 768px) 100vw, 33vw"
                              aspectRatio="16/9"
                            />
                          ) : (
                            <>
                              <div className="col-span-2 row-span-1 h-2/3">
                                <ResponsiveImage
                                  src={images[0]}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                  widths={[400, 600]}
                                  sizes="(max-width: 768px) 100vw, 33vw"
                                />
                              </div>
                              {images[1] && (
                                <ResponsiveImage
                                  src={images[1]}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                  widths={[200, 300]}
                                  sizes="(max-width: 768px) 50vw, 16vw"
                                />
                              )}
                              {images[2] && (
                                <ResponsiveImage
                                  src={images[2]}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                  widths={[200, 300]}
                                  sizes="(max-width: 768px) 50vw, 16vw"
                                />
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </Link>
                    <div className="p-5 flex flex-col flex-1">
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : ''}
                        {' · '}
                        {post.author_name}
                      </p>
                      <Link to={`/post/${post.slug}`}>
                        <h3 className="font-serif text-lg font-bold text-navy-900 dark:text-white mb-2 hover:text-navy-600 dark:hover:text-gold-400 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                      </Link>
                      {post.intro_text && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 flex-1">
                          {post.intro_text}
                        </p>
                      )}
                      <Link
                        to={`/post/${post.slug}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-navy-600 dark:text-gold-400 hover:underline mt-4"
                      >
                        Read more <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-6 sm:hidden">
              <Link
                to="/blog"
                className="inline-flex items-center gap-1 text-sm font-medium text-navy-600 dark:text-gold-400 hover:underline"
              >
                View all posts <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Notice Preview */}
      {notices.length > 0 && (
        <section className="py-16 bg-white dark:bg-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-900 dark:text-white">
                  Latest Notices
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Stay updated with college announcements</p>
              </div>
              <Link
                to="/notices"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-navy-600 dark:text-gold-400 hover:underline"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {notices.map((notice) => (
                <article
                  key={notice.id}
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  {notice.image_url && (
                    <div className="aspect-[16/9] overflow-hidden">
                      <ResponsiveImage
                        src={notice.image_url}
                        alt={notice.title}
                        className="w-full h-full object-cover"
                        widths={[200, 400, 600]}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        aspectRatio="16/9"
                      />
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          CATEGORY_COLORS[notice.category] || CATEGORY_COLORS.general
                        }`}
                      >
                        {CATEGORY_LABELS[notice.category] || notice.category}
                      </span>
                      {notice.priority === 'high' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          High Priority
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-navy-900 dark:text-white text-sm mb-2 line-clamp-2">
                      {notice.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 flex-1">
                      {notice.content}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                      {new Date(notice.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 sm:hidden">
              <Link
                to="/notices"
                className="inline-flex items-center gap-1 text-sm font-medium text-navy-600 dark:text-gold-400 hover:underline"
              >
                View all notices <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-16 bg-navy-900 dark:bg-navy-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gold-500/20 flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-gold-400" />
              </div>
              <p className="text-3xl font-bold text-white">3</p>
              <p className="text-sm text-slate-400 mt-1">Year Program</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gold-500/20 flex items-center justify-center mb-4">
                <GraduationCap className="w-7 h-7 text-gold-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats?.total_views.toLocaleString() || '0'}</p>
              <p className="text-sm text-slate-400 mt-1">Total Views</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gold-500/20 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-gold-400" />
              </div>
              <p className="text-3xl font-bold text-white">AG</p>
              <p className="text-sm text-slate-400 mt-1">Mizoram District</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gold-500/20 flex items-center justify-center mb-4">
                <Eye className="w-7 h-7 text-gold-400" />
              </div>
              <p className="text-3xl font-bold text-white">Biblical</p>
              <p className="text-sm text-slate-400 mt-1">Foundation</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
