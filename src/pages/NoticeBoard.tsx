import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, X, AlertCircle, Calendar, Tag, Clock } from 'lucide-react';
import { supabase, Notice } from '../lib/supabase';
import ResponsiveImage from '../components/ResponsiveImage';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'general', label: 'General' },
  { value: 'academic', label: 'Academic' },
  { value: 'event', label: 'Event' },
  { value: 'fee', label: 'Fee' },
  { value: 'urgent', label: 'Urgent' },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  academic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  event: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  fee: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  low: { label: 'Low', color: 'text-slate-500', dot: 'bg-slate-400' },
  medium: { label: 'Medium', color: 'text-blue-500', dot: 'bg-blue-500' },
  high: { label: 'High', color: 'text-red-500', dot: 'bg-red-500' },
};

export default function NoticeBoard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notices:', error);
      setError('Failed to load notices. Please try again.');
    } else {
      setNotices((data || []) as Notice[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  useEffect(() => {
    if (selectedNotice) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedNotice]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNotice(null);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      const matchesCategory = selectedCategory === 'all' || notice.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        notice.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [notices, selectedCategory, searchQuery]);

  const truncate = (text: string, maxChars: number) => {
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars).trimEnd() + '...';
  };

  if (loading) return <LoadingSpinner message="Loading notices..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-500 dark:text-red-400 text-center">{error}</p>
        <button
          onClick={fetchNotices}
          className="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Header */}
      <section className="bg-navy-900 dark:bg-navy-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-4">
            Notice Board
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            Stay updated with the latest announcements, events, and important information from the college.
          </p>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="sticky top-16 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat.value
                      ? 'bg-navy-700 text-white dark:bg-gold-500 dark:text-navy-950'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-500 dark:focus:ring-gold-400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Notices Grid */}
      <section className="py-12 bg-slate-50 dark:bg-slate-900 min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredNotices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                {searchQuery || selectedCategory !== 'all'
                  ? 'No notices match your filters.'
                  : 'No notices have been published yet.'}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Showing {filteredNotices.length} notice{filteredNotices.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotices.map((notice) => {
                  const priority = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.medium;
                  return (
                    <article
                      key={notice.id}
                      onClick={() => setSelectedNotice(notice)}
                      className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col group"
                    >
                      {notice.image_url ? (
                        <div className="aspect-[16/9] overflow-hidden">
                          <ResponsiveImage
                            src={notice.image_url}
                            alt={notice.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            widths={[200, 400, 600]}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            aspectRatio="16/9"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/9] bg-gradient-to-br from-navy-100 to-navy-200 dark:from-navy-800 dark:to-navy-900 flex items-center justify-center">
                          <Tag className="w-10 h-10 text-navy-300 dark:text-navy-600" />
                        </div>
                      )}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              CATEGORY_COLORS[notice.category] || CATEGORY_COLORS.general
                            }`}
                          >
                            {CATEGORIES.find((c) => c.value === notice.category)?.label || notice.category}
                          </span>
                          <span className={`flex items-center gap-1 text-xs ${priority.color}`}>
                            <span className={`w-2 h-2 rounded-full ${priority.dot}`} />
                            {priority.label} Priority
                          </span>
                        </div>
                        <h3 className="font-serif text-lg font-bold text-navy-900 dark:text-white mb-2 line-clamp-2 group-hover:text-navy-600 dark:group-hover:text-gold-400 transition-colors">
                          {notice.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 flex-1">
                          {truncate(notice.content, 150)}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mt-4">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(notice.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Modal */}
      {selectedNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm"
          onClick={() => setSelectedNotice(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {selectedNotice.image_url && (
                <div className="aspect-[16/9] overflow-hidden rounded-t-2xl">
                  <ResponsiveImage
                    src={selectedNotice.image_url}
                    alt={selectedNotice.title}
                    className="w-full h-full object-cover"
                    widths={[400, 800, 1200]}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    aspectRatio="16/9"
                  />
                </div>
              )}
              <button
                onClick={() => setSelectedNotice(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800/80 flex items-center justify-center text-navy-900 dark:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-lg"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    CATEGORY_COLORS[selectedNotice.category] || CATEGORY_COLORS.general
                  }`}
                >
                  {CATEGORIES.find((c) => c.value === selectedNotice.category)?.label || selectedNotice.category}
                </span>
                <span
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    PRIORITY_CONFIG[selectedNotice.priority]?.color || ''
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[selectedNotice.priority]?.dot || ''}`} />
                  {PRIORITY_CONFIG[selectedNotice.priority]?.label || 'Medium'} Priority
                </span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-navy-900 dark:text-white mb-4">
                {selectedNotice.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedNotice.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {new Date(selectedNotice.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedNotice.content}
                </p>
              </div>
              {selectedNotice.expires_at && (
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    <strong>Expires:</strong>{' '}
                    {new Date(selectedNotice.expires_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
