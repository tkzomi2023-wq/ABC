import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, User, Loader, Newspaper, X, Hash, Eye } from 'lucide-react';
import { supabase, BlogPost } from '../lib/supabase';

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      setPosts((data as BlogPost[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.author_name.toLowerCase().includes(q) ||
        (p.hashtags ?? []).some((t) => t.toLowerCase().includes(q))
    );
  }, [posts, search]);

  return (
    <div className="page-enter">
      {/* Hero header */}
      <div className="bg-navy-950 py-12 md:py-16">
        <div className="page-container max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-xs font-semibold uppercase tracking-wide mb-4">
            <Newspaper className="w-3.5 h-3.5" /> Blog & Articles
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-3">
            Articles & Reflections
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
            Explore writings from our faculty and staff on theology, ministry, and Christian life.
          </p>
        </div>
      </div>

      <div className="page-container max-w-4xl py-8 md:py-12">
        {/* Search bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, author, or hashtag..."
            className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-slate-500 mb-6">
          {loading ? 'Loading...' : `${filtered.length} article${filtered.length !== 1 ? 's' : ''}${search ? ` found` : ''}`}
        </p>

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader className="w-8 h-8 text-navy-700 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">
              {search ? 'No articles match your search.' : 'No articles have been published yet.'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-4 text-gold-600 hover:text-gold-700 text-sm font-medium">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filtered.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BlogCard({ post }: { post: BlogPost }) {
  const previewText = (post.intro_text || post.body_text || post.conclusion_text || '')
    .replace(/<[^>]*>/g, '')
    .replace(/[#*]/g, '')
    .split('\n')[0]
    .slice(0, 140);
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
                <Hash className="w-2.5 h-2.5" />{tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="font-serif font-bold text-white text-lg md:text-xl leading-snug mb-2 group-hover:text-gold-300 transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Preview text */}
        <p className="text-white/80 text-sm line-clamp-2 mb-3">{previewText}</p>

        {/* Author, Date & Views */}
        <div className="flex items-center gap-3 text-xs text-white/60">
          <span className="inline-flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-gold-400" />{post.author_name}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gold-400" />{dateStr}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-gold-400" />{(post.view_count ?? 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </Link>
  );
}
