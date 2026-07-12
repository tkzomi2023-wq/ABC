import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Bell, Users, Download, Image, ChevronRight,
  Award, MapPin, Calendar, Star, ArrowRight, Megaphone, ChevronLeft,
  Newspaper, ArrowUpRight, User, Hash, Eye,
} from 'lucide-react';
import { supabase, Notice, Photo, BlogPost } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DailyVerse from '../components/DailyVerse';

function GallerySlider({ photos, rounded = true }: { photos: Photo[]; rounded?: boolean }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    setCurrent((c) => (c + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (photos.length < 2) return;
    timerRef.current = setInterval(advance, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [advance, photos.length]);

  function goTo(idx: number) {
    setCurrent(idx);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(advance, 5000);
  }

  function prev() { goTo((current - 1 + photos.length) % photos.length); }
  function next() { goTo((current + 1) % photos.length); }

  if (!photos.length) return null;

  return (
    <div className={`relative w-full h-full overflow-hidden bg-slate-900 select-none ${rounded ? 'rounded-2xl' : ''}`}>
      {photos.map((photo, i) => (
        <div
          key={photo.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img
            src={photo.image_url}
            alt={photo.title ?? ''}
            className="w-full h-full object-cover"
          />
          {photo.title && (
            <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-gradient-to-t from-black/70 to-transparent">
              <p className="text-white text-sm font-medium truncate">{photo.title}</p>
            </div>
          )}
        </div>
      ))}

      {/* Arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all ${i === current ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="absolute top-3 right-3 z-20 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
        {current + 1} / {photos.length}
      </div>
    </div>
  );
}

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(tick);
            else setCount(target);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function StatCard({ value, label, icon: Icon }: { value: number; label: string; icon: React.ElementType }) {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-gold-100 rounded-xl mb-3">
        <Icon className="w-6 h-6 text-gold-600" />
      </div>
      <p className="text-4xl font-serif font-bold text-navy-900">{count}+</p>
      <p className="text-slate-600 text-sm mt-1">{label}</p>
    </div>
  );
}

const priorityColor: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};

const categoryColor: Record<string, string> = {
  academic: 'bg-purple-100 text-purple-700',
  event: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
  financial: 'bg-emerald-100 text-emerald-700',
  general: 'bg-slate-100 text-slate-700',
};

function BlogPreviewCard({ post }: { post: BlogPost }) {
  const previewText = (post.intro_text || post.body_text || post.conclusion_text || '')
    .split(/\n\s*\n/)[0] || '';
  const words = previewText.trim().split(/\s+/).slice(0, 28).join(' ');
  const truncated = words.length < previewText.trim().length ? `${words}…` : words;
  const dateStr = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Collect all available images for collage
  const images: string[] = [];
  if (post.featured_image_url) images.push(post.featured_image_url);
  if (post.supporting_image_url) images.push(post.supporting_image_url);
  if (post.second_image_url) images.push(post.second_image_url);

  return (
    <Link
      to={`/post/${post.slug}`}
      className="group block relative overflow-hidden rounded-2xl aspect-[4/3] shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
    >
      {/* Collage background */}
      {images.length > 0 ? (
        images.length === 1 ? (
          <img
            src={images[0]}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : images.length === 2 ? (
          <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
            {images.slice(0, 2).map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5">
            <img
              src={images[0]}
              alt={post.title}
              className="col-span-2 row-span-1 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {images.slice(1, 3).map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ))}
          </div>
        )
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center">
          <Newspaper className="w-12 h-12 text-gold-500/40" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 p-5 flex flex-col justify-end">
        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {post.hashtags.slice(0, 3).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-gold-500/90 text-navy-950 text-[11px] font-semibold rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="font-serif font-bold text-white text-lg md:text-xl leading-snug mb-2 group-hover:text-gold-300 transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Preview text */}
        <p className="text-white/80 text-sm line-clamp-2 mb-3">{truncated}</p>

        {/* Author, Date & Views */}
        <div className="flex items-center gap-3 text-xs text-white/60">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gold-400" />{dateStr}
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-gold-400" />{post.author_name}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-gold-400" />{(post.view_count ?? 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { profile } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [stats, setStats] = useState({ first: 0, second: 0, final: 0 });
  const [siteImages, setSiteImages] = useState<Record<string, string>>({});
  const [galleryPhotos, setGalleryPhotos] = useState<Photo[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

  // Default fallback images
  const defaultImages = {
    home_hero_image: 'https://images.pexels.com/photos/289737/pexels-photo-289737.jpeg?auto=compress&cs=tinysrgb&w=1600',
    home_about_image: 'https://images.pexels.com/photos/256490/pexels-photo-256490.jpeg?auto=compress&cs=tinysrgb&w=800',
  };

  useEffect(() => {
    supabase
      .from('notices')
      .select('*')
      .eq('is_published', true)
      .eq('priority', 'high')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setNotices(data ?? []));

    supabase
      .from('profiles')
      .select('student_year')
      .eq('role', 'student')
      .then(({ data }) => {
        if (!data) return;
        const first = data.filter((p) => p.student_year === '1st_year').length;
        const second = data.filter((p) => p.student_year === '2nd_year').length;
        const final = data.filter((p) => p.student_year === 'final_year').length;
        setStats({ first, second, final });
      });

    supabase
      .from('photos')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => setGalleryPhotos(data ?? []));

    supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(3)
      .then(({ data }) => setBlogPosts(data ?? []));

    supabase
      .from('site_settings')
      .select('*')
      .in('setting_key', ['home_hero_image', 'home_about_image', 'home_hero_opacity'])
      .then(({ data }) => {
        if (data) {
          const imgMap: Record<string, string> = {};
          data.forEach((s) => {
            imgMap[s.setting_key] = s.setting_value;
          });
          setSiteImages(imgMap);
        }
      });
  }, []);

  return (
    <div className="page-enter">
      {/* Hero */}
      <section
        className="relative min-h-[50vh] flex items-center bg-hero-gradient overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(17,22,64,${siteImages.home_hero_opacity || '0.95'}) 0%, rgba(30,42,138,${siteImages.home_hero_opacity || '0.88'}) 60%, rgba(34,54,216,${parseFloat(siteImages.home_hero_opacity || '0.88') * 0.97}) 100%), url('${siteImages.home_hero_image || defaultImages.home_hero_image}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-navy-400/10 rounded-full blur-3xl" />

        <div className="page-container relative z-10 py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold-500/20 border border-gold-400/40 rounded-full mb-6">
              <Star className="w-3.5 h-3.5 text-gold-400" />
              <span className="text-gold-300 text-xs font-medium">Established 1998 · Assemblies of God, Mizoram</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white text-shadow leading-tight">
              Aizawl<br />
              <span className="text-gold-400">Bible College</span>
            </h1>
            <p className="text-slate-300 mt-5 text-lg md:text-xl leading-relaxed max-w-xl">
              A theological Institution of Assemblies of God Mizoram District — equipping servant-leaders for the harvest fields.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link to="/apply" className="btn-gold text-base px-6 py-3">
                Apply Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/about" className="px-6 py-3 border border-white/30 text-white rounded-lg font-medium text-base hover:bg-white/10 transition-colors">
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-60">
          <div className="w-0.5 h-8 bg-white animate-bounce" />
          <span className="text-white text-xs">Scroll</span>
        </div>
      </section>

      {/* Quick stats bar */}
      <section className="bg-navy-800 py-4">
        <div className="page-container">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-white text-sm">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-gold-400" />
              <span>PATA Accredited</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gold-400" />
              <span>25+ Years of Excellence</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold-400" />
              <span>Aizawl, Mizoram</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gold-400" />
              <span>{stats.first + stats.second + stats.final} Active Students</span>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Bible Verse */}
      <DailyVerse />

      {/* Latest notices widget */}
      <section className="py-16 md:py-20 bg-white">
        <div className="page-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Megaphone className="w-5 h-5 text-gold-500" />
                <span className="text-sm font-semibold text-gold-600 uppercase tracking-wide">Latest Updates</span>
              </div>
              <h2 className="section-title">High-Priority Notices</h2>
            </div>
          </div>

          {notices.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No high-priority notices at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {notices.map((notice) => (
                <div key={notice.id} className="group relative h-64 rounded-2xl overflow-hidden shadow-lg">
                  <img
                    src={notice.image_url || `https://images.pexels.com/photos/1595385/pexels-photo-1595385.jpeg?auto=compress&cs=tinysrgb&w=800`}
                    alt={notice.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${priorityColor[notice.priority]}`}>
                        {notice.priority.charAt(0).toUpperCase() + notice.priority.slice(1)}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor[notice.category]}`}>
                        {notice.category.charAt(0).toUpperCase() + notice.category.slice(1)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white text-lg leading-snug mb-1">{notice.title}</h3>
                    <p className="text-white/80 text-sm leading-relaxed line-clamp-2">{notice.content}</p>
                    <p className="text-white/50 text-xs mt-2">
                      {new Date(notice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Gallery Slider — full bleed, no heading */}
      {galleryPhotos.length > 0 && (
        <section className="h-72 md:h-[480px] overflow-hidden">
          <GallerySlider photos={galleryPhotos} rounded={false} />
        </section>
      )}

      {/* Blog / Articles preview */}
      {blogPosts.length > 0 && (
        <section className="py-16 md:py-20 bg-white">
          <div className="page-container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Newspaper className="w-5 h-5 text-gold-500" />
                  <span className="text-sm font-semibold text-gold-600 uppercase tracking-wide">From the Blog</span>
                </div>
                <h2 className="section-title">Latest Articles & Reflections</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <BlogPreviewCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About snippet */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="page-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-gold-500" />
                <span className="text-sm font-semibold text-gold-600 uppercase tracking-wide">Our Mission</span>
              </div>
              <h2 className="section-title mb-5">Training Servants of God Since 1998</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Aizawl Bible College is dedicated to providing quality theological education rooted in the Holy Scriptures.
                As a member of the Evangelical Theological College Association (NEI), we uphold academic excellence
                alongside deep spiritual formation.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                Our programs equip students for pastoral ministry, evangelism, missions, and church planting across
                Northeast India and beyond.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/about" className="btn-primary">
                  About the College <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/prologue" className="btn-secondary">
                  Our Prologue
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src={siteImages.home_about_image || defaultImages.home_about_image}
                alt="College building"
                className="rounded-2xl shadow-xl w-full object-cover h-80 lg:h-96"
              />
              <div className="absolute -bottom-4 -left-4 bg-navy-800 text-white rounded-xl p-4 shadow-lg">
                <p className="text-2xl font-serif font-bold">25+</p>
                <p className="text-slate-300 text-xs">Years of Ministry</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="py-16 md:py-20 bg-white">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="section-title">Our Student Community</h2>
            <p className="section-subtitle mx-auto mt-3">Live enrollment statistics across all academic years.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard value={stats.first} label="1st Year Students" icon={Users} />
            <StatCard value={stats.second} label="2nd Year Students" icon={Users} />
            <StatCard value={stats.final} label="Final Year Students" icon={Users} />
            <StatCard value={stats.first + stats.second + stats.final} label="Total Enrollment" icon={Award} />
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="py-16 md:py-20 bg-navy-950">
        <div className="page-container">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-serif font-bold text-white mb-3">Explore the Portal</h2>
            <p className="text-slate-400 text-sm">Quick access to all college resources</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Notice Board', icon: Bell, path: '/notices', color: 'bg-blue-500' },
              { label: 'Faculty', icon: Users, path: '/teachers', color: 'bg-green-600' },
              { label: 'Gallery', icon: Image, path: '/gallery', color: 'bg-pink-600' },
              { label: 'Downloads', icon: Download, path: '/downloads', color: 'bg-orange-500' },
              { label: 'Forum', icon: BookOpen, path: '/forum', color: 'bg-purple-600' },
              { label: 'Apply Now', icon: ArrowRight, path: '/apply', color: 'bg-gold-500' },
            ].map(({ label, icon: Icon, path, color }) => (
              <Link
                key={path}
                to={path}
                className="flex flex-col items-center gap-3 p-5 bg-white/5 hover:bg-white/10 rounded-xl transition-all hover:-translate-y-1 group"
              >
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-300 text-sm font-medium text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!profile && (
        <section className="py-14 bg-gold-500">
          <div className="page-container text-center">
            <h2 className="text-3xl font-serif font-bold text-white mb-3">Ready to Begin Your Journey?</h2>
            <p className="text-gold-100 mb-6 max-w-lg mx-auto">
              Apply now for admission to Aizawl Bible College and take the first step toward meaningful ministry.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/apply" className="px-6 py-3 bg-white text-gold-700 rounded-lg font-semibold hover:bg-gold-50 transition-colors">
                Apply for Admission
              </Link>
              <Link to="/contact" className="px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
