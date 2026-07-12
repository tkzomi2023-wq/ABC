import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save, Upload, Loader, ArrowLeft, Eye, Hash, Image as ImageIcon,
  FileText, Check, AlertCircle, Send, X, Youtube, Info,
} from 'lucide-react';
import { supabase, BlogPost } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import RichTextEditor from '../components/RichTextEditor';

const DRAFT_KEY = 'blog_editor_draft';

type Draft = {
  id?: string;
  title: string;
  hashtags: string;
  author_name: string;
  featured_image_url: string;
  intro_text: string;
  supporting_image_url: string;
  body_text: string;
  second_image_url: string;
  conclusion_text: string;
  takeaway: string;
  youtube_url: string;
  is_published: boolean;
  post_date: string;
};

const EMPTY_DRAFT: Draft = {
  title: '',
  hashtags: '',
  author_name: '',
  featured_image_url: '',
  intro_text: '',
  supporting_image_url: '',
  body_text: '',
  second_image_url: '',
  conclusion_text: '',
  takeaway: '',
  youtube_url: '',
  is_published: false,
  post_date: '',
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(!!id);

  // Load existing post if editing
  useEffect(() => {
    if (!id) {
      // Try restore from localStorage
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Draft;
          if (!parsed.id) setDraft({ ...EMPTY_DRAFT, ...parsed });
        }
      } catch { /* ignore */ }
      // Default author name from profile
      if (profile?.full_name) {
        setDraft((d) => ({ ...d, author_name: d.author_name || profile.full_name || '' }));
      }
      return;
    }

    (async () => {
      const { data, error: loadErr } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (loadErr || !data) {
        setError('Could not load post.');
        setLoading(false);
        return;
      }
      const p = data as BlogPost;
      setDraft({
        id: p.id,
        title: p.title,
        hashtags: (p.hashtags || []).join(', '),
        author_name: p.author_name,
        featured_image_url: p.featured_image_url ?? '',
        intro_text: p.intro_text ?? '',
        supporting_image_url: p.supporting_image_url ?? '',
        body_text: p.body_text ?? '',
        second_image_url: p.second_image_url ?? '',
        conclusion_text: p.conclusion_text ?? '',
        takeaway: p.takeaway ?? '',
        youtube_url: p.youtube_url ?? '',
        is_published: p.is_published,
        post_date: p.published_at || p.created_at,
      });
      setLoading(false);
    })();
  }, [id, profile?.full_name]);

  // Auto-save to localStorage (debounced)
  const persistDraft = useCallback(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setAutoSavedAt(new Date());
    } catch { /* ignore quota errors */ }
  }, [draft]);

  useEffect(() => {
    const t = setTimeout(persistDraft, 800);
    return () => clearTimeout(t);
  }, [draft, persistDraft]);

  async function uploadImage(field: keyof Draft, file: File) {
    setUploading(field);
    setError('');
    const ext = file.name.split('.').pop();
    const fileName = `blog/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('photos').upload(fileName, file, { upsert: true });
    if (upErr) {
      setError(upErr.message);
      setUploading(null);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
    setDraft((d) => ({ ...d, [field]: publicUrl }));
    setUploading(null);
  }

  async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = base || 'untitled';
    let suffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let q = supabase.from('blog_posts').select('id').eq('slug', slug);
      if (excludeId) q = q.neq('id', excludeId);
      const { data } = await q.maybeSingle();
      if (!data) return slug;
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
  }

  async function save(publish: boolean) {
    setError('');
    setSuccess('');
    if (!draft.title.trim()) { setError('Title is required.'); return; }
    if (!draft.author_name.trim()) { setError('Author name is required.'); return; }
    if (publish && !draft.featured_image_url) { setError('A featured image is required to publish.'); return; }

    setSaving(true);
    if (publish) setPublishing(true);

    const hashtags = draft.hashtags
      .split(',')
      .map((h) => h.trim().replace(/^#/, ''))
      .filter(Boolean);

    const baseSlug = slugify(draft.title);
    let slug = draft.id ? '' : await ensureUniqueSlug(baseSlug);
    if (draft.id) {
      // keep existing slug unless empty
      const { data: existing } = await supabase.from('blog_posts').select('slug').eq('id', draft.id).maybeSingle();
      slug = existing?.slug || (await ensureUniqueSlug(baseSlug, draft.id));
    }

    const payload = {
      title: draft.title.trim(),
      slug,
      hashtags,
      author_name: draft.author_name.trim(),
      author_id: profile?.id ?? null,
      featured_image_url: draft.featured_image_url || null,
      intro_text: draft.intro_text || null,
      supporting_image_url: draft.supporting_image_url || null,
      body_text: draft.body_text || null,
      second_image_url: draft.second_image_url || null,
      conclusion_text: draft.conclusion_text || null,
      takeaway: draft.takeaway || null,
      youtube_url: draft.youtube_url || null,
      is_published: publish ? true : draft.is_published,
      published_at: draft.post_date ? new Date(draft.post_date).toISOString() : (publish ? new Date().toISOString() : null),
    };

    let result: BlogPost | null = null;
    if (draft.id) {
      const { data, error: updErr } = await supabase
        .from('blog_posts').update(payload).eq('id', draft.id).select().single();
      if (updErr) { setError(updErr.message); setSaving(false); setPublishing(false); return; }
      result = data;
    } else {
      const { data, error: insErr } = await supabase
        .from('blog_posts').insert(payload).select().single();
      if (insErr) { setError(insErr.message); setSaving(false); setPublishing(false); return; }
      result = data;
    }

    setSaving(false);
    setPublishing(false);

    if (result) {
      // Clear localStorage draft once persisted to DB
      localStorage.removeItem(DRAFT_KEY);
      setDraft((d) => ({ ...d, id: result!.id, is_published: result!.is_published }));
      setSuccess(publish ? 'Post published successfully!' : 'Draft saved!');
      setTimeout(() => setSuccess(''), 3000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 text-navy-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-serif font-bold text-navy-900">
                {draft.id ? 'Edit Post' : 'New Blog Post'}
              </h1>
              <p className="text-slate-500 text-sm">
                {autoSavedAt ? `Auto-saved ${autoSavedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Auto-save enabled'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {draft.id && (
              <button
                onClick={async () => {
                  if (draft.id) {
                    const { data } = await supabase.from('blog_posts').select('slug').eq('id', draft.id).maybeSingle();
                    if (data?.slug) navigate(`/post/${data.slug}`);
                  }
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-navy-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Preview published post"
              >
                <Eye className="w-4 h-4" /> Preview
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4 text-green-700 text-sm">
            <Check className="w-4 h-4 flex-shrink-0" />{success}
          </div>
        )}

        <div className="space-y-6">
          {/* Hashtags */}
          <Section icon={Hash} label="Hashtags" hint="2–4 relevant hashtags, comma-separated">
            <input
              value={draft.hashtags}
              onChange={(e) => setDraft((d) => ({ ...d, hashtags: e.target.value }))}
              placeholder="#theology, #missions, #faith"
              className="input-field"
            />
          </Section>

          {/* Title */}
          <Section icon={FileText} label="Title" hint="Short, clear, engaging">
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Enter post title"
              className="input-field text-lg font-medium"
            />
            {draft.title && (
              <p className="text-xs text-slate-400 mt-1.5">URL: /post/{slugify(draft.title)}</p>
            )}
          </Section>

          {/* Metadata */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold-500" /> Metadata
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label text-xs">Date</label>
                <input
                  type="date"
                  value={(draft.post_date ? new Date(draft.post_date) : new Date()).toISOString().slice(0, 10)}
                  onChange={(e) => setDraft((d) => ({ ...d, post_date: new Date(e.target.value).toISOString() }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label text-xs">Author Name *</label>
                <input
                  value={draft.author_name}
                  onChange={(e) => setDraft((d) => ({ ...d, author_name: e.target.value }))}
                  placeholder="Author name"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <ImageField
            label="Featured Image"
            hint="Shown at the top of the post and as the preview background on the homepage"
            value={draft.featured_image_url}
            uploading={uploading === 'featured_image_url'}
            onChange={(f) => uploadImage('featured_image_url', f)}
            onClear={() => setDraft((d) => ({ ...d, featured_image_url: '' }))}
          />

          {/* Intro Text */}
          <Section label="Introduction" hint="About 2 paragraphs introducing the subject. Use the toolbar to format text (bold, italic, underline, etc.)">
            <RichTextEditor
              value={draft.intro_text}
              onChange={(html) => setDraft((d) => ({ ...d, intro_text: html }))}
              placeholder="Write 2 paragraphs introducing the subject and setting context..."
              minHeight="8rem"
            />
            <WordCount text={draft.intro_text} />
          </Section>

          {/* Supporting Image */}
          <ImageField
            label="Supporting Image"
            hint="First supporting visual after the introduction"
            value={draft.supporting_image_url}
            uploading={uploading === 'supporting_image_url'}
            onChange={(f) => uploadImage('supporting_image_url', f)}
            onClear={() => setDraft((d) => ({ ...d, supporting_image_url: '' }))}
          />

          {/* Body Text */}
          <Section label="Main Body" hint="About 3 paragraphs expanding on the main theme. Use the toolbar to format text.">
            <RichTextEditor
              value={draft.body_text}
              onChange={(html) => setDraft((d) => ({ ...d, body_text: html }))}
              placeholder="Write 3 paragraphs expanding on the main theme, adding details, examples, or analysis..."
              minHeight="10rem"
            />
            <WordCount text={draft.body_text} />
          </Section>

          {/* Second Image */}
          <ImageField
            label="Second Image"
            hint="Another relevant visual"
            value={draft.second_image_url}
            uploading={uploading === 'second_image_url'}
            onChange={(f) => uploadImage('second_image_url', f)}
            onClear={() => setDraft((d) => ({ ...d, second_image_url: '' }))}
          />

          {/* Conclusion */}
          <Section label="Conclusion" hint="About 2 paragraphs providing conclusion, reflection, or implications. Use the toolbar to format text.">
            <RichTextEditor
              value={draft.conclusion_text}
              onChange={(html) => setDraft((d) => ({ ...d, conclusion_text: html }))}
              placeholder="Write 2 paragraphs providing conclusion, reflection, or implications..."
              minHeight="8rem"
            />
            <WordCount text={draft.conclusion_text} />
          </Section>

          {/* YouTube Link (optional) */}
          <Section label="YouTube Video (Optional)" hint="Paste a YouTube link to embed a video in the article">
            <div className="relative">
              <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
              <input
                value={draft.youtube_url}
                onChange={(e) => setDraft((d) => ({ ...d, youtube_url: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
                className="input-field pl-10"
                type="url"
              />
            </div>
          </Section>

          {/* Takeaway */}
          <Section label="Takeaway / Call-to-Action" hint="A short takeaway or call-to-action at the end">
            <input
              value={draft.takeaway}
              onChange={(e) => setDraft((d) => ({ ...d, takeaway: e.target.value }))}
              placeholder="e.g., Share this with someone who needs to hear it today."
              className="input-field"
            />
          </Section>

          {/* Image Usage Guide */}
          <div className="card p-5 bg-blue-50/40 border-blue-200">
            <h3 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" /> Image & Layout Guide
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <p><strong>Image layout:</strong> Each image is displayed at <strong>35% of the container width</strong> and automatically positioned:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Featured Image</strong> — left-aligned, Introduction text wraps to the right</li>
                <li><strong>Supporting Image</strong> — right-aligned, Main Body text wraps to the left</li>
                <li><strong>Second Image</strong> — left-aligned, Conclusion text wraps to the right</li>
              </ul>
              <p className="pt-1">If text is longer than the image, it automatically continues below the image in full width.</p>
              <p className="pt-1"><strong>Image sizing tips:</strong> Upload images at <strong>1200×800px</strong> or similar landscape ratio for best results. The display area is 35% width, so wide images work well. Avoid tiny images — they'll be stretched to fill 35% of the container.</p>
              <p className="pt-1"><strong>Text formatting:</strong> Use the toolbar above each text field to apply <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <s>strikethrough</s>, <sup>superscript</sup>, or <sub>subscript</sub>. You can also use keyboard shortcuts: Ctrl+B (bold), Ctrl+I (italic), Ctrl+U (underline). Separate paragraphs with a blank line.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="card p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 shadow-lg">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              {draft.is_published ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  <Check className="w-3.5 h-3.5" /> Published
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                  Draft
                </span>
              )}
              {autoSavedAt && (
                <span className="text-xs text-slate-400">
                  Auto-saved {autoSavedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => save(false)}
                disabled={saving}
                className="btn-secondary"
              >
                {saving && !publishing ? <><Loader className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Draft</>}
              </button>
              <button
                onClick={() => save(true)}
                disabled={saving}
                className="btn-primary"
              >
                {publishing ? <><Loader className="w-4 h-4 animate-spin" /> Publishing...</> : <><Send className="w-4 h-4" /> Publish</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon, label, hint, children,
}: {
  icon?: React.ElementType; label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gold-500" />} {label}
        </h3>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function WordCount({ text }: { text: string }) {
  const count = wordCount(text);
  return <p className="text-xs text-slate-400 mt-1.5">{count} words</p>;
}

function ImageField({
  label, hint, value, uploading, onChange, onClear,
}: {
  label: string; hint?: string; value: string; uploading: boolean;
  onChange: (file: File) => void; onClear: () => void;
}) {
  return (
    <div className="card p-4">
      <div className="mb-2.5">
        <h3 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-gold-500" /> {label}
        </h3>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      </div>
      {value ? (
        <div className="relative group">
          <img src={value} alt={label} className="w-full h-32 object-cover rounded-lg border border-slate-200" />
          <button
            onClick={onClear}
            className="absolute top-1.5 right-1.5 p-1 bg-black/50 text-white rounded-md hover:bg-black/70 transition-colors"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer transition-colors ${uploading ? 'bg-slate-50 cursor-not-allowed' : 'hover:border-navy-400 hover:bg-slate-50'}`}>
          {uploading ? (
            <><Loader className="w-4 h-4 text-navy-500 animate-spin" /><span className="text-xs text-slate-500">Uploading...</span></>
          ) : (
            <><Upload className="w-4 h-4 text-slate-400" /><span className="text-xs text-slate-500">Click to upload image</span></>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); e.target.value = ''; }}
          />
        </label>
      )}
    </div>
  );
}
