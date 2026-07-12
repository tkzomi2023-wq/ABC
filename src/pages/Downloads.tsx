import { useState, useEffect, useMemo, useCallback } from 'react';
import { Download as DownloadIcon, Search, Upload, Trash2, FileText, Loader as Loader2, X } from 'lucide-react';
import { supabase, Download } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

function formatFileSize(kb: number | null) {
  if (!kb) return '—';
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function getFileExt(url: string) {
  const clean = url.split('?')[0];
  const ext = clean.split('.').pop()?.toUpperCase();
  return ext && ext.length <= 5 ? ext : 'FILE';
}

export default function Downloads() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSemester, setNewSemester] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDownloads = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('downloads')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDownloads(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load downloads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDownloads();
  }, [fetchDownloads]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    downloads.forEach((d) => { if (d.category) set.add(d.category); });
    return Array.from(set).sort();
  }, [downloads]);

  const semesters = useMemo(() => {
    const set = new Set<string>();
    downloads.forEach((d) => { if (d.semester) set.add(d.semester); });
    return Array.from(set).sort();
  }, [downloads]);

  const filteredDownloads = useMemo(() => {
    return downloads.filter((d) => {
      const matchesSearch = !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || d.category === categoryFilter;
      const matchesSemester = !semesterFilter || d.semester === semesterFilter;
      return matchesSearch && matchesCategory && matchesSemester;
    });
  }, [downloads, searchQuery, categoryFilter, semesterFilter]);

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewCategory('');
    setNewSemester('');
    setSelectedFile(null);
    setUploadError(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file.');
      return;
    }
    if (!newTitle.trim()) {
      setUploadError('Title is required.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'file';
      const path = `downloads/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('downloads')
        .upload(path, selectedFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('downloads').getPublicUrl(path);
      const fileUrl = urlData.publicUrl;

      const sizeKb = Math.round(selectedFile.size / 1024);

      const { error: insertError } = await supabase.from('downloads').insert({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        file_url: fileUrl,
        file_size_kb: sizeKb,
        category: newCategory.trim() || 'General',
        semester: newSemester.trim() || null,
        is_active: true,
        uploaded_by: profile?.id || null,
      });

      if (insertError) throw insertError;

      resetForm();
      setShowUpload(false);
      await fetchDownloads();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (downloadId: string) => {
    const item = downloads.find((d) => d.id === downloadId);
    if (!item) return;

    if (!window.confirm('Are you sure you want to delete this download? This cannot be undone.')) return;

    setDeletingId(downloadId);
    try {
      if (item.file_url) {
        const url = new URL(item.file_url);
        const path = url.pathname.split('/downloads/')[1];
        if (path) {
          await supabase.storage.from('downloads').remove([path]);
        }
      }

      const { error: deleteError } = await supabase.from('downloads').delete().eq('id', downloadId);
      if (deleteError) throw deleteError;

      setDownloads((prev) => prev.filter((d) => d.id !== downloadId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete download');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (item: Download) => {
    const link = document.createElement('a');
    link.href = item.file_url;
    link.download = item.title || 'download';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <LoadingSpinner message="Loading downloads..." />;

  return (
    <div className="page-container py-8 md:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">Downloads</h1>
          <p className="section-subtitle">Resources, study materials, and documents</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="btn-primary flex items-center gap-2 self-start"
          >
            <Upload className="w-4 h-4" /> Upload File
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {isAdmin && showUpload && (
        <div className="card p-6 mb-8">
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-navy-950 dark:text-slate-100">Upload New File</h2>
              <button
                type="button"
                onClick={() => { setShowUpload(false); resetForm(); }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Close upload form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm">
                {uploadError}
              </div>
            )}

            <div>
              <label className="label" htmlFor="dl-title">Title *</label>
              <input
                id="dl-title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="input-field"
                placeholder="File title..."
              />
            </div>

            <div>
              <label className="label" htmlFor="dl-desc">Description</label>
              <textarea
                id="dl-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
                className="input-field"
                placeholder="Brief description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="dl-category">Category</label>
                <input
                  id="dl-category"
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Syllabus, Assignment"
                />
              </div>
              <div>
                <label className="label" htmlFor="dl-semester">Semester</label>
                <input
                  id="dl-semester"
                  type="text"
                  value={newSemester}
                  onChange={(e) => setNewSemester(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 1st Year, Fall 2024"
                />
              </div>
            </div>

            <div>
              <label className="label">File</label>
              {selectedFile ? (
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-5 h-5 text-navy-500 dark:text-amber-400 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{selectedFile.name}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">({formatFileSize(Math.round(selectedFile.size / 1024))})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-navy-400 dark:hover:border-amber-400 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">Click to select a file</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedFile(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload File
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field md:w-48"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}
        {semesters.length > 0 && (
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="input-field md:w-48"
          >
            <option value="">All Semesters</option>
            {semesters.map((sem) => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>
        )}
      </div>

      {filteredDownloads.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">
            {downloads.length === 0 ? 'No downloads available yet.' : 'No downloads match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDownloads.map((item) => (
            <div
              key={item.id}
              className="card p-4 md:p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-navy-100 dark:bg-slate-700 flex items-center justify-center">
                <FileText className="w-6 h-6 text-navy-600 dark:text-amber-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-navy-950 dark:text-slate-100 truncate">{item.title}</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-navy-50 text-navy-600 dark:bg-slate-700 dark:text-amber-300">
                    {getFileExt(item.file_url)}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  {item.category && <span>{item.category}</span>}
                  {item.semester && <span>• {item.semester}</span>}
                  <span>• {formatFileSize(item.file_size_kb)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDownload(item)}
                  className="btn-primary flex items-center gap-2 !px-4 !py-2 text-sm"
                  aria-label={`Download ${item.title}`}
                >
                  <DownloadIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                    aria-label={`Delete ${item.title}`}
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
