import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Plus, Pin, PinOff, Lock, Unlock, ArrowLeft,
  Send, Search, AlertCircle, User as UserIcon, Clock,
} from 'lucide-react';
import { supabase, ForumPost, ForumReply, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = ['General', 'Academic', 'Prayer Request', 'Discussion', 'Question', 'Announcement'];

type PostWithAuthor = ForumPost & { author?: Profile | null };

export default function Forum() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostWithAuthor | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [replyAuthors, setReplyAuthors] = useState<Record<string, Profile>>({});
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const isAdmin = profile?.role === 'admin';

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data, error: e } = await supabase
      .from('forum_posts')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (e) {
      setError(e.message);
      setLoading(false);
      return;
    }

    const authorIds = [...new Set((data || []).map((p: ForumPost) => p.author_id))];
    const { data: authors } = await supabase
      .from('profiles')
      .select('*')
      .in('id', authorIds);
    const authorMap: Record<string, Profile> = {};
    (authors || []).forEach((a: Profile) => { authorMap[a.id] = a; });

    const enriched: PostWithAuthor[] = (data || []).map((p: ForumPost) => ({
      ...p,
      author: authorMap[p.author_id] || null,
    }));
    setPosts(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const fetchReplies = useCallback(async (postId: string) => {
    const { data, error: e } = await supabase
      .from('forum_replies')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (e) return;
    setReplies(data || []);

    const authorIds = [...new Set((data || []).map((r: ForumReply) => r.author_id))];
    if (authorIds.length > 0) {
      const { data: authors } = await supabase
        .from('profiles')
        .select('*')
        .in('id', authorIds);
      const map: Record<string, Profile> = {};
      (authors || []).forEach((a: Profile) => { map[a.id] = a; });
      setReplyAuthors(map);
    } else {
      setReplyAuthors({});
    }
  }, []);

  async function createPost(data: { title: string; content: string; category: string }): Promise<boolean> {
    if (!profile) return false;
    setError(null);
    const { data: d, error: e } = await supabase
      .from('forum_posts')
      .insert({ ...data, author_id: profile.id })
      .select()
      .single();
    if (e) { setError(e.message); return false; }
    setPosts((prev) => [{ ...d, author: profile }, ...prev]);
    return true;
  }

  async function createReply(postId: string, content: string) {
    if (!profile) return false;
    setError(null);
    const { data: d, error: e } = await supabase
      .from('forum_replies')
      .insert({ post_id: postId, author_id: profile.id, content })
      .select()
      .single();
    if (e) { setError(e.message); return false; }
    setReplies((prev) => [...prev, d]);
    setReplyAuthors((prev) => ({ ...prev, [profile.id]: profile }));
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reply_count: p.reply_count + 1 } : p)));
    if (selectedPost) setSelectedPost((prev) => prev ? { ...prev, reply_count: prev.reply_count + 1 } : prev);
    return true;
  }

  async function togglePin(post: ForumPost) {
    const { error: e } = await supabase
      .from('forum_posts')
      .update({ is_pinned: !post.is_pinned })
      .eq('id', post.id);
    if (e) { setError(e.message); return; }
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, is_pinned: !post.is_pinned } : p)));
    if (selectedPost?.id === post.id) setSelectedPost((prev) => prev ? { ...prev, is_pinned: !prev.is_pinned } : prev);
  }

  async function toggleLock(post: ForumPost) {
    const { error: e } = await supabase
      .from('forum_posts')
      .update({ is_locked: !post.is_locked })
      .eq('id', post.id);
    if (e) { setError(e.message); return; }
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, is_locked: !post.is_locked } : p)));
    if (selectedPost?.id === post.id) setSelectedPost((prev) => prev ? { ...prev, is_locked: !prev.is_locked } : prev);
  }

  async function deletePost(post: ForumPost) {
    const { error: e } = await supabase
      .from('forum_posts')
      .delete()
      .eq('id', post.id);
    if (e) { setError(e.message); return; }
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    setSelectedPost(null);
  }

  const filteredPosts = posts.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <LoadingSpinner message="Loading forum..." />;

  if (selectedPost) {
    return (
      <div className="page-container py-8 max-w-4xl">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <button onClick={() => setSelectedPost(null)} className="mb-4 flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-navy-700 dark:hover:text-amber-400 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Forum
        </button>

        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="px-2 py-0.5 rounded text-xs bg-navy-100 dark:bg-navy-900/50 text-navy-700 dark:text-navy-300">{selectedPost.category}</span>
            {selectedPost.is_pinned && <span className="px-2 py-0.5 rounded text-xs bg-gold-100 dark:bg-gold-900/40 text-gold-700 dark:text-gold-300 flex items-center gap-1"><Pin className="w-3 h-3" /> Pinned</span>}
            {selectedPost.is_locked && <span className="px-2 py-0.5 rounded text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</span>}
          </div>
          <h1 className="font-serif text-2xl font-bold text-navy-950 dark:text-slate-100 mb-3">{selectedPost.title}</h1>
          <div className="flex items-center gap-3 mb-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              {selectedPost.author?.avatar_url ? (
                <img src={selectedPost.author.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                </div>
              )}
              <span className="font-medium text-slate-700 dark:text-slate-200">{selectedPost.author?.full_name || 'Unknown'}</span>
            </div>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(selectedPost.created_at).toLocaleString()}</span>
          </div>
          <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{selectedPost.content}</p>

          {isAdmin && (
            <div className="mt-4 flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button onClick={() => togglePin(selectedPost)} className="btn-secondary py-1.5 text-sm flex items-center gap-1.5">
                {selectedPost.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                {selectedPost.is_pinned ? 'Unpin' : 'Pin'}
              </button>
              <button onClick={() => toggleLock(selectedPost)} className="btn-secondary py-1.5 text-sm flex items-center gap-1.5">
                {selectedPost.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {selectedPost.is_locked ? 'Unlock' : 'Lock'}
              </button>
              <button onClick={() => deletePost(selectedPost)} className="px-3 py-1.5 rounded-lg text-sm bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60">
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h2 className="font-serif text-lg font-bold text-navy-950 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Replies ({replies.length})
          </h2>
        </div>

        <div className="space-y-3 mb-6">
          {replies.map((r) => {
            const author = replyAuthors[r.author_id];
            return (
              <div key={r.id} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  {author?.avatar_url ? (
                    <img src={author.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                  <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{author?.full_name || 'Unknown'}</span>
                  <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{r.content}</p>
              </div>
            );
          })}
          {replies.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No replies yet. Be the first to reply!</p>
            </div>
          )}
        </div>

        {!selectedPost.is_locked ? (
          <ReplyForm onSubmit={(content) => createReply(selectedPost.id, content)} />
        ) : (
          <div className="card p-4 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" /> This post is locked. No new replies can be added.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-container py-8">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-navy-700 dark:text-amber-400" /> Forum
          </h1>
          <p className="section-subtitle">Discuss and connect with the community</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-field sm:w-48">
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filteredPosts.map((p) => (
          <div
            key={p.id}
            onClick={() => { setSelectedPost(p); fetchReplies(p.id); }}
            className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {p.is_pinned && <Pin className="w-4 h-4 text-gold-500 flex-shrink-0" />}
                  {p.is_locked && <Lock className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  <span className="px-2 py-0.5 rounded text-xs bg-navy-100 dark:bg-navy-900/50 text-navy-700 dark:text-navy-300">{p.category}</span>
                </div>
                <h3 className="font-medium text-slate-800 dark:text-slate-100 hover:text-navy-700 dark:hover:text-amber-400">{p.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{p.content}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    {p.author?.avatar_url ? (
                      <img src={p.author.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <UserIcon className="w-3.5 h-3.5" />
                    )}
                    {p.author?.full_name || 'Unknown'}
                  </span>
                  <span>{new Date(p.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {p.reply_count}</span>
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => togglePin(p)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title={p.is_pinned ? 'Unpin' : 'Pin'}>
                    {p.is_pinned ? <PinOff className="w-4 h-4 text-gold-500" /> : <Pin className="w-4 h-4" />}
                  </button>
                  <button onClick={() => toggleLock(p)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title={p.is_locked ? 'Unlock' : 'Lock'}>
                    {p.is_locked ? <Unlock className="w-4 h-4 text-red-500" /> : <Lock className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No posts found. {search || filterCategory !== 'all' ? 'Try adjusting your filters.' : 'Be the first to post!'}</p>
        </div>
      )}

      {creating && (
        <NewPostModal onClose={() => setCreating(false)} onCreate={async (data) => {
          const ok = await createPost(data);
          if (ok) setCreating(false);
          return ok;
        }} />
      )}
    </div>
  );
}

function NewPostModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: { title: string; content: string; category: string }) => Promise<boolean> }) {
  const [form, setForm] = useState({ title: '', content: '', category: 'General' });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onCreate(form);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl">
          <h3 className="font-serif text-lg font-bold text-navy-950 dark:text-slate-100">New Forum Post</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">✕</button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-4">
          <div>
            <label className="label">Title</label>
            <input required className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Content</label>
            <textarea required className="input-field" rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              <Send className="w-4 h-4" /> {saving ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReplyForm({ onSubmit }: { onSubmit: (content: string) => Promise<boolean> }) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    const ok = await onSubmit(content);
    if (ok) setContent('');
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="card p-4">
      <label className="label">Add a Reply</label>
      <textarea required className="input-field" rows={3} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your reply..." />
      <div className="flex justify-end mt-2">
        <button type="submit" disabled={saving || !content.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Send className="w-4 h-4" /> {saving ? 'Sending...' : 'Reply'}
        </button>
      </div>
    </form>
  );
}
