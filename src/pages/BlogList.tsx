import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Tag, Calendar, User, PenLine } from 'lucide-react';
import { supabase, BlogPost } from '../lib/supabase';
import ResponsiveImage from '../components/ResponsiveImage';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function PostCollage({ post }: { post: BlogPost }) {
  const images = [post.featured_image_url, post.supporting_image_url, post.second_image_url].filter(
    (img): img is string => !!img
  );

  if (images.length === 0) {
    return (
      <div className="aspect-[16/10] bg-navy-100 dark:bg-slate-700 flex items-center justify-center">
        <PenLine className="w-12 h-12 text-navy-300 dark:text-slate-500" />
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <ResponsiveImage
        src={images[0]}
        alt={post.title}
        className="w-full aspect-[16/10] object-cover"
        loading="lazy"
        widths={[400, 800, 1200]}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        aspectRatio="16 / 10"
      />
    );
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 aspect-[16/10]">
        <ResponsiveImage
          src={images[0]}
          alt={post.title}
          className="w-full h-full object-cover"
          loading="lazy"
          widths={[400, 800]}
          sizes="50vw"
          aspectRatio="16 / 10"
        />
        <ResponsiveImage
          src={images[1]}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          widths={[400, 800]}
          sizes="50vw"
          aspectRatio="16 / 10"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-0.5 aspect-[16/10]">
      <ResponsiveImage
        src={images[0]}
        alt={post.title}
        className="w-full h-full object-cover row-span-2"
        loading="lazy"
        widths={[400, 800]}
        sizes="50vw"
        aspectRatio="16 / 10"
      />
      <ResponsiveImage
        src={images[1]}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
        widths={[400]}
        sizes="50vw"
        aspectRatio="16 / 10"
      />
      <ResponsiveImage
        src={images[2]}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
        widths={[400]}
        sizes="50vw"
        aspectRatio="16 / 10"
      />
    </div>
  );
}

export default function BlogList() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const canWrite = profile?.role === 'admin' || profile?.role === 'faculty';

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error: fetchError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('is_published', true)
          .order('published_at', { ascending: false });

        if (fetchError) throw fetchError;
        setPosts(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach((p) => p.hashtags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        !searchQuery ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !activeTag || post.hashtags?.includes(activeTag);
      return matchesSearch && matchesTag;
    });
  }, [posts, searchQuery, activeTag]);

  if (loading) return <LoadingSpinner message="Loading blog posts..." />;
  if (error) {
    return (
      <div className="page-container py-16">
        <div className="card p-8 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-8 md:py-12">
      <div className="mb-8">
        <h1 className="section-title">College Blog</h1>
        <p className="section-subtitle">
          Reflections, devotionals, and insights from the Aizawl Bible College community
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        {canWrite && (
          <Link
            to="/admin/blog/new"
            className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <PenLine className="w-4 h-4" /> Write Post
          </Link>
        )}
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !activeTag
                ? 'bg-navy-900 text-white dark:bg-amber-500 dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                activeTag === tag
                  ? 'bg-navy-900 text-white dark:bg-amber-500 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              <Tag className="w-3 h-3" />
              {tag}
            </button>
          ))}
        </div>
      )}

      {filteredPosts.length === 0 ? (
        <div className="card p-12 text-center">
          <PenLine className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">
            {posts.length === 0 ? 'No blog posts have been published yet.' : 'No posts match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              to={`/post/${post.slug}`}
              className="card overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <div className="overflow-hidden">
                <PostCollage post={post} />
              </div>
              <div className="p-5">
                <h2 className="font-serif text-xl font-bold text-navy-950 dark:text-slate-100 mb-2 line-clamp-2 group-hover:text-navy-700 dark:group-hover:text-amber-400 transition-colors">
                  {post.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {post.author_name}
                  </span>
                  {post.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(post.published_at)}
                    </span>
                  )}
                </div>
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {post.hashtags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-navy-50 text-navy-600 dark:bg-slate-700 dark:text-amber-300"
                      >
                        #{tag}
                      </span>
                    ))}
                    {post.hashtags.length > 3 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                        +{post.hashtags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
