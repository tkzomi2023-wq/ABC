import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Bell, GraduationCap, UserCog, Download, Image, Settings, Mail,
  CreditCard, Receipt, Plus, Pencil, Trash2, X, Check, Ban, ShieldCheck,
  Search, AlertCircle, Eye, Save, Upload, Filter,
} from 'lucide-react';
import { supabase, Profile, Notice, Teacher, BoardMember, Download as DownloadType, Photo, ContactMessage, Transaction, SiteSetting, PaymentRequest } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { compressImage, buildStoragePath } from '../lib/imageCompress';
import LoadingSpinner from '../components/LoadingSpinner';

type TabId =
  | 'users' | 'notices' | 'teachers' | 'board' | 'downloads'
  | 'gallery' | 'settings' | 'messages' | 'paymentRequests' | 'transactions';

const ROLES: Profile['role'][] = ['admin', 'faculty', 'student', 'finance', 'standard'];
const NOTICE_CATEGORIES = ['General', 'Academic', 'Event', 'Urgent', 'Holiday'];
const PRIORITY_LEVELS: Notice['priority'][] = ['low', 'medium', 'high'];
const DOWNLOAD_CATEGORIES = ['Syllabus', 'Past Papers', 'Notes', 'Forms', 'Other'];
const SEMESTERS = ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester'];

function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gold-500 text-navy-950 text-xs font-bold">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl z-10">
          <h3 className="font-serif text-lg font-bold text-navy-950 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function ConfirmButton({ onConfirm, children, className = '', title }: { onConfirm: () => void; children: React.ReactNode; className?: string; title?: string }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button onClick={onConfirm} className="px-2 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700">Confirm</button>
        <button onClick={() => setConfirming(false)} className="px-2 py-1 rounded text-xs bg-slate-200 dark:bg-slate-600">Cancel</button>
      </div>
    );
  }
  return (
    <button onClick={() => setConfirming(true)} className={className} title={title}>{children}</button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-slate-400">
      <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

async function uploadImage(file: File, label: string): Promise<string | null> {
  const compressed = await compressImage(file);
  const ext = compressed.name.split('.').pop();
  const path = buildStoragePath('photos', label, ext);
  const { error } = await supabase.storage.from('photos').upload(path, compressed, { upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const { data } = supabase.storage.from('photos').getPublicUrl(path);
  return data.publicUrl;
}

async function uploadFile(file: File, label: string): Promise<{ url: string; sizeKb: number } | null> {
  const ext = file.name.split('.').pop();
  const path = buildStoragePath('downloads', label, ext);
  const { error } = await supabase.storage.from('downloads').upload(path, file, { upsert: false });
  if (error) throw new Error(`File upload failed: ${error.message}`);
  const { data } = supabase.storage.from('downloads').getPublicUrl(path);
  return { url: data.publicUrl, sizeKb: Math.round(file.size / 1024) };
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { refreshNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState<TabId>('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [downloads, setDownloads] = useState<DownloadType[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        { data: p }, { data: n }, { data: t }, { data: b }, { data: d },
        { data: ph }, { data: m }, { data: pr }, { data: tr }, { data: s },
      ] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('notices').select('*').order('created_at', { ascending: false }),
        supabase.from('teachers').select('*').order('display_order', { ascending: true }),
        supabase.from('board_members').select('*').order('display_order', { ascending: true }),
        supabase.from('downloads').select('*').order('created_at', { ascending: false }),
        supabase.from('photos').select('*').order('created_at', { ascending: false }),
        supabase.from('contact_messages').select('*').order('submitted_at', { ascending: false }),
        supabase.from('payment_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').order('payment_date', { ascending: false }).limit(200),
        supabase.from('site_settings').select('*').order('setting_key', { ascending: true }),
      ]);
      setProfiles(p || []);
      setNotices(n || []);
      setTeachers(t || []);
      setBoardMembers(b || []);
      setDownloads(d || []);
      setPhotos(ph || []);
      setMessages(m || []);
      setPaymentRequests(pr || []);
      setTransactions(tr || []);
      setSettings(s || []);
      setUnreadMessages((m || []).filter((x) => !x.is_read).length);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'users', label: 'Users', icon: Users, badge: profiles.length },
    { id: 'notices', label: 'Notices', icon: Bell, badge: notices.length },
    { id: 'teachers', label: 'Teachers', icon: GraduationCap, badge: teachers.length },
    { id: 'board', label: 'Board', icon: UserCog, badge: boardMembers.length },
    { id: 'downloads', label: 'Downloads', icon: Download, badge: downloads.length },
    { id: 'gallery', label: 'Gallery', icon: Image, badge: photos.length },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'messages', label: 'Messages', icon: Mail, badge: unreadMessages },
    { id: 'paymentRequests', label: 'Payments', icon: CreditCard, badge: paymentRequests.filter((r) => r.status === 'pending').length },
    { id: 'transactions', label: 'Transactions', icon: Receipt, badge: transactions.length },
  ];

  if (loading) return <LoadingSpinner message="Loading admin dashboard..." />;

  return (
    <div className="page-container py-8">
      <div className="mb-6">
        <h1 className="section-title flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-navy-700 dark:text-amber-400" />
          Admin Dashboard
        </h1>
        <p className="section-subtitle">Manage users, content, and site settings</p>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-navy-900 text-white dark:bg-amber-500 dark:text-navy-950'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden ml-2">{tab.label}</span>
              {tab.badge !== undefined && <Badge count={tab.badge} />}
            </button>
          );
        })}
      </div>

      {activeTab === 'users' && <UsersTab profiles={profiles} setProfiles={setProfiles} currentUserId={profile?.id} onChanged={refreshNotifications} />}
      {activeTab === 'notices' && <NoticesTab notices={notices} setNotices={setNotices} authorId={profile?.id} />}
      {activeTab === 'teachers' && <TeachersTab teachers={teachers} setTeachers={setTeachers} />}
      {activeTab === 'board' && <BoardTab members={boardMembers} setMembers={setBoardMembers} />}
      {activeTab === 'downloads' && <DownloadsTab downloads={downloads} setDownloads={setDownloads} uploadedBy={profile?.id} />}
      {activeTab === 'gallery' && <GalleryTab photos={photos} setPhotos={setPhotos} uploadedBy={profile?.id} />}
      {activeTab === 'settings' && <SettingsTab settings={settings} setSettings={setSettings} />}
      {activeTab === 'messages' && <MessagesTab messages={messages} setMessages={setMessages} onChanged={refreshNotifications} />}
      {activeTab === 'paymentRequests' && <PaymentRequestsTab requests={paymentRequests} setRequests={setPaymentRequests} />}
      {activeTab === 'transactions' && <TransactionsTab transactions={transactions} setTransactions={setTransactions} recordedBy={profile?.id} />}
    </div>
  );
}

function UsersTab({ profiles, setProfiles, currentUserId, onChanged }: {
  profiles: Profile[];
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
  currentUserId?: string;
  onChanged: () => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return p.full_name?.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.role.includes(q);
  });

  async function updateProfile(id: string, patch: Partial<Profile>) {
    setError(null);
    const { data, error: e } = await supabase.from('profiles').update(patch).eq('id', id).select().single();
    if (e) { setError(e.message); return; }
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  }

  async function deleteUser(id: string) {
    setError(null);
    const { error: e } = await supabase.functions.invoke('delete-user', { body: { userId: id } });
    if (e) { setError(e.message); return; }
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    await onChanged();
  }

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <span className="text-sm text-slate-500">{filtered.length} users</span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Role</th>
                <th className="text-left p-3 font-medium">Order</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={p.full_name || ''} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-navy-200 dark:bg-slate-600 flex items-center justify-center text-navy-700 dark:text-slate-200 font-medium text-xs">
                          {(p.full_name || p.email)[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-100">{p.full_name || '(no name)'}</div>
                        <div className="text-xs text-slate-400">{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <select
                      value={p.role}
                      onChange={(e) => updateProfile(p.id, { role: e.target.value as Profile['role'] })}
                      className="input-field py-1 text-xs"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={p.display_order}
                      onChange={(e) => updateProfile(p.id, { display_order: parseInt(e.target.value) || 0 })}
                      className="input-field py-1 w-16 text-xs"
                    />
                  </td>
                  <td className="p-3">
                    {p.is_banned ? (
                      <span className="badge-admin">Banned</span>
                    ) : (
                      <span className="badge-student">Active</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/admin/users/${p.id}`} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500" title="View">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button onClick={() => setEditing(p)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateProfile(p.id, { is_banned: !p.is_banned })}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500"
                        title={p.is_banned ? 'Unban' : 'Ban'}
                      >
                        {p.is_banned ? <ShieldCheck className="w-4 h-4 text-green-500" /> : <Ban className="w-4 h-4 text-red-500" />}
                      </button>
                      {p.id !== currentUserId && (
                        <ConfirmButton
                          onConfirm={() => deleteUser(p.id)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </ConfirmButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState message="No users found" />}
      </div>

      {editing && (
        <Modal title={`Edit ${editing.full_name || editing.email}`} onClose={() => setEditing(null)}>
          <EditProfileForm
            profile={editing}
            onSave={async (patch) => { await updateProfile(editing.id, patch); setEditing(null); }}
          />
        </Modal>
      )}
    </div>
  );
}

function EditProfileForm({ profile, onSave }: { profile: Profile; onSave: (patch: Partial<Profile>) => Promise<void> }) {
  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    address: profile.address || '',
    bio: profile.bio || '',
    role: profile.role,
    display_order: profile.display_order,
    is_banned: profile.is_banned,
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Full Name</label>
        <input className="input-field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Phone</label>
          <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Profile['role'] })}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Address</label>
        <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <div>
        <label className="label">Bio</label>
        <textarea className="input-field" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Display Order</label>
          <input type="number" className="input-field" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
        </div>
        <div>
          <label className="label">Banned</label>
          <select className="input-field" value={form.is_banned ? '1' : '0'} onChange={(e) => setForm({ ...form, is_banned: e.target.value === '1' })}>
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function NoticesTab({ notices, setNotices, authorId }: {
  notices: Notice[];
  setNotices: React.Dispatch<React.SetStateAction<Notice[]>>;
  authorId?: string;
}) {
  const [editing, setEditing] = useState<Notice | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const blank: Partial<Notice> = {
    title: '', content: '', category: 'General', priority: 'medium', is_published: true, image_url: null, expires_at: null,
  };

  async function save(data: Partial<Notice>, id?: string) {
    setError(null);
    const payload = { ...data, author_id: authorId };
    if (id) {
      const { data: d, error: e } = await supabase.from('notices').update(payload).eq('id', id).select().single();
      if (e) { setError(e.message); return false; }
      setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, ...d } : n)));
    } else {
      const { data: d, error: e } = await supabase.from('notices').insert(payload).select().single();
      if (e) { setError(e.message); return false; }
      setNotices((prev) => [d as Notice, ...prev]);
    }
    return true;
  }

  async function remove(id: string) {
    setError(null);
    const { error: e } = await supabase.from('notices').delete().eq('id', id);
    if (e) { setError(e.message); return; }
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }

  async function handleImage(file: File, setField: (url: string) => void) {
    setUploading(true);
    try {
      const url = await uploadImage(file, `notice-${Date.now()}`);
      if (url) setField(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl font-bold text-navy-950 dark:text-slate-100">Notices</h2>
        <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Notice
        </button>
      </div>
      {error && <ErrorBanner message={error} />}

      <div className="grid gap-3 sm:grid-cols-2">
        {notices.map((n) => (
          <div key={n.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-medium text-slate-800 dark:text-slate-100">{n.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs ${n.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : n.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{n.priority}</span>
                  {n.is_published ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />}
                </div>
                <p className="text-xs text-slate-400">{n.category} · {new Date(n.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(n)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Pencil className="w-4 h-4" /></button>
                <ConfirmButton onConfirm={() => remove(n.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"><Trash2 className="w-4 h-4" /></ConfirmButton>
              </div>
            </div>
            {n.image_url && <img src={n.image_url} alt={n.title} className="mt-2 w-full h-24 object-cover rounded-lg" />}
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{n.content}</p>
          </div>
        ))}
      </div>
      {notices.length === 0 && <EmptyState message="No notices yet" />}

      {(editing || creating) && (
        <Modal title={editing ? 'Edit Notice' : 'New Notice'} onClose={() => { setEditing(null); setCreating(false); }}>
          <NoticeForm
            initial={editing || blank}
            uploading={uploading}
            fileRef={fileRef}
            onImagePick={(f) => handleImage(f, (url) => {
              if (editing) setEditing({ ...editing, image_url: url });
            })}
            onSave={async (data) => {
              const ok = await save(data, editing?.id);
              if (ok) { setEditing(null); setCreating(false); }
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function NoticeForm({ initial, onSave, uploading, fileRef, onImagePick }: {
  initial: Partial<Notice>;
  onSave: (data: Partial<Notice>) => Promise<void>;
  uploading: boolean;
  fileRef: React.RefObject<HTMLInputElement>;
  onImagePick: (file: File) => void;
}) {
  const [form, setForm] = useState({
    title: initial.title || '',
    content: initial.content || '',
    category: initial.category || 'General',
    priority: initial.priority || 'medium',
    is_published: initial.is_published ?? true,
    image_url: initial.image_url || '',
    expires_at: initial.expires_at?.slice(0, 10) || '',
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">Title</label>
        <input required className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div>
        <label className="label">Content</label>
        <textarea required className="input-field" rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {NOTICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Notice['priority'] })}>
            {PRIORITY_LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Published</label>
          <select className="input-field" value={form.is_published ? '1' : '0'} onChange={(e) => setForm({ ...form, is_published: e.target.value === '1' })}>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>
        <div>
          <label className="label">Expires At</label>
          <input type="date" className="input-field" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Image</label>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImagePick(f); }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-secondary py-2 text-sm flex items-center gap-2">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload'}
          </button>
          {form.image_url && <img src={form.image_url} alt="" className="w-16 h-16 object-cover rounded" />}
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function TeachersTab({ teachers, setTeachers }: {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
}) {
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const blank: Partial<Teacher> = {
    full_name: '', photo_url: null, subject_in_charge: '', qualification: '', bio: '', is_current: true, joined_at: null, left_at: null, display_order: 0,
  };

  async function save(data: Partial<Teacher>, id?: string) {
    setError(null);
    if (id) {
      const { data: d, error: e } = await supabase.from('teachers').update(data).eq('id', id).select().single();
      if (e) { setError(e.message); return false; }
      setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, ...d } : t)));
    } else {
      const { data: d, error: e } = await supabase.from('teachers').insert(data).select().single();
      if (e) { setError(e.message); return false; }
      setTeachers((prev) => [...prev, d as Teacher].sort((a, b) => a.display_order - b.display_order));
    }
    return true;
  }

  async function remove(id: string) {
    const { error: e } = await supabase.from('teachers').delete().eq('id', id);
    if (e) { setError(e.message); return; }
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  }

  async function handlePhoto(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file, `teacher-${Date.now()}`);
      if (url) {
        if (editing) setEditing({ ...editing, photo_url: url });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl font-bold text-navy-950 dark:text-slate-100">Teachers</h2>
        <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Teacher
        </button>
      </div>
      {error && <ErrorBanner message={error} />}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teachers.map((t) => (
          <div key={t.id} className="card p-4 flex flex-col items-center text-center">
            {t.photo_url ? (
              <img src={t.photo_url} alt={t.full_name} className="w-20 h-20 rounded-full object-cover mb-2" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-navy-200 dark:bg-slate-600 flex items-center justify-center mb-2 text-navy-700 dark:text-slate-200 text-2xl font-medium">
                {t.full_name[0]?.toUpperCase()}
              </div>
            )}
            <h3 className="font-medium text-slate-800 dark:text-slate-100">{t.full_name}</h3>
            <p className="text-xs text-slate-400">{t.subject_in_charge}</p>
            <p className="text-xs text-slate-400">{t.qualification}</p>
            <div className="mt-1 flex items-center gap-2">
              {t.is_current ? <span className="badge-student">Current</span> : <span className="badge-standard">Former</span>}
              <span className="text-xs text-slate-400">#{t.display_order}</span>
            </div>
            <div className="mt-2 flex gap-1">
              <button onClick={() => setEditing(t)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Pencil className="w-4 h-4" /></button>
              <ConfirmButton onConfirm={() => remove(t.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"><Trash2 className="w-4 h-4" /></ConfirmButton>
            </div>
          </div>
        ))}
      </div>
      {teachers.length === 0 && <EmptyState message="No teachers yet" />}

      {(editing || creating) && (
        <Modal title={editing ? 'Edit Teacher' : 'New Teacher'} onClose={() => { setEditing(null); setCreating(false); }}>
          <TeacherForm
            initial={editing || blank}
            uploading={uploading}
            fileRef={fileRef}
            onImagePick={handlePhoto}
            onSave={async (data) => {
              const ok = await save(data, editing?.id);
              if (ok) { setEditing(null); setCreating(false); }
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function TeacherForm({ initial, onSave, uploading, fileRef, onImagePick }: {
  initial: Partial<Teacher>;
  onSave: (data: Partial<Teacher>) => Promise<void>;
  uploading: boolean;
  fileRef: React.RefObject<HTMLInputElement>;
  onImagePick: (file: File) => void;
}) {
  const [form, setForm] = useState({
    full_name: initial.full_name || '',
    photo_url: initial.photo_url || '',
    subject_in_charge: initial.subject_in_charge || '',
    qualification: initial.qualification || '',
    bio: initial.bio || '',
    is_current: initial.is_current ?? true,
    joined_at: initial.joined_at?.slice(0, 10) || '',
    left_at: initial.left_at?.slice(0, 10) || '',
    display_order: initial.display_order ?? 0,
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      joined_at: form.joined_at ? new Date(form.joined_at).toISOString() : null,
      left_at: form.left_at ? new Date(form.left_at).toISOString() : null,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">Full Name</label>
        <input required className="input-field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Subject</label>
          <input className="input-field" value={form.subject_in_charge} onChange={(e) => setForm({ ...form, subject_in_charge: e.target.value })} />
        </div>
        <div>
          <label className="label">Qualification</label>
          <input className="input-field" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Bio</label>
        <textarea className="input-field" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Joined At</label>
          <input type="date" className="input-field" value={form.joined_at} onChange={(e) => setForm({ ...form, joined_at: e.target.value })} />
        </div>
        <div>
          <label className="label">Left At</label>
          <input type="date" className="input-field" value={form.left_at} onChange={(e) => setForm({ ...form, left_at: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Current</label>
          <select className="input-field" value={form.is_current ? '1' : '0'} onChange={(e) => setForm({ ...form, is_current: e.target.value === '1' })}>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>
        <div>
          <label className="label">Display Order</label>
          <input type="number" className="input-field" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <div>
        <label className="label">Photo</label>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImagePick(f); }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-secondary py-2 text-sm flex items-center gap-2">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload'}
          </button>
          {form.photo_url && <img src={form.photo_url} alt="" className="w-16 h-16 object-cover rounded-full" />}
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function BoardTab({ members, setMembers }: {
  members: BoardMember[];
  setMembers: React.Dispatch<React.SetStateAction<BoardMember[]>>;
}) {
  const [editing, setEditing] = useState<BoardMember | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const blank: Partial<BoardMember> = { name: '', designation: '', photo_url: null, display_order: 0 };

  async function save(data: Partial<BoardMember>, id?: string) {
    setError(null);
    if (id) {
      const { data: d, error: e } = await supabase.from('board_members').update(data).eq('id', id).select().single();
      if (e) { setError(e.message); return false; }
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...d } : m)));
    } else {
      const { data: d, error: e } = await supabase.from('board_members').insert(data).select().single();
      if (e) { setError(e.message); return false; }
      setMembers((prev) => [...prev, d as BoardMember].sort((a, b) => a.display_order - b.display_order));
    }
    return true;
  }

  async function remove(id: string) {
    const { error: e } = await supabase.from('board_members').delete().eq('id', id);
    if (e) { setError(e.message); return; }
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function handlePhoto(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file, `board-${Date.now()}`);
      if (url && editing) setEditing({ ...editing, photo_url: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl font-bold text-navy-950 dark:text-slate-100">Board Members</h2>
        <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Member
        </button>
      </div>
      {error && <ErrorBanner message={error} />}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {members.map((m) => (
          <div key={m.id} className="card p-4 flex flex-col items-center text-center">
            {m.photo_url ? (
              <img src={m.photo_url} alt={m.name} className="w-16 h-16 rounded-full object-cover mb-2" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-navy-200 dark:bg-slate-600 flex items-center justify-center mb-2 text-navy-700 dark:text-slate-200 text-xl font-medium">
                {m.name[0]?.toUpperCase()}
              </div>
            )}
            <h3 className="font-medium text-sm text-slate-800 dark:text-slate-100">{m.name}</h3>
            <p className="text-xs text-slate-400">{m.designation}</p>
            <p className="text-xs text-slate-400">#{m.display_order}</p>
            <div className="mt-2 flex gap-1">
              <button onClick={() => setEditing(m)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Pencil className="w-4 h-4" /></button>
              <ConfirmButton onConfirm={() => remove(m.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"><Trash2 className="w-4 h-4" /></ConfirmButton>
            </div>
          </div>
        ))}
      </div>
      {members.length === 0 && <EmptyState message="No board members yet" />}

      {(editing || creating) && (
        <Modal title={editing ? 'Edit Member' : 'New Member'} onClose={() => { setEditing(null); setCreating(false); }}>
          <BoardForm
            initial={editing || blank}
            uploading={uploading}
            fileRef={fileRef}
            onImagePick={handlePhoto}
            onSave={async (data) => {
              const ok = await save(data, editing?.id);
              if (ok) { setEditing(null); setCreating(false); }
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function BoardForm({ initial, onSave, uploading, fileRef, onImagePick }: {
  initial: Partial<BoardMember>;
  onSave: (data: Partial<BoardMember>) => Promise<void>;
  uploading: boolean;
  fileRef: React.RefObject<HTMLInputElement>;
  onImagePick: (file: File) => void;
}) {
  const [form, setForm] = useState({
    name: initial.name || '',
    designation: initial.designation || '',
    photo_url: initial.photo_url || '',
    display_order: initial.display_order ?? 0,
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">Name</label>
        <input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className="label">Designation</label>
        <input className="input-field" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
      </div>
      <div>
        <label className="label">Display Order</label>
        <input type="number" className="input-field" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
      </div>
      <div>
        <label className="label">Photo</label>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImagePick(f); }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-secondary py-2 text-sm flex items-center gap-2">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload'}
          </button>
          {form.photo_url && <img src={form.photo_url} alt="" className="w-16 h-16 object-cover rounded-full" />}
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function DownloadsTab({ downloads, setDownloads, uploadedBy }: {
  downloads: DownloadType[];
  setDownloads: React.Dispatch<React.SetStateAction<DownloadType[]>>;
  uploadedBy?: string;
}) {
  const [editing, setEditing] = useState<DownloadType | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const blank: Partial<DownloadType> = {
    title: '', description: '', file_url: '', file_size_kb: 0, category: 'Other', semester: '', is_active: true,
  };

  async function save(data: Partial<DownloadType>, id?: string) {
    setError(null);
    const payload = { ...data, uploaded_by: uploadedBy };
    if (id) {
      const { data: d, error: e } = await supabase.from('downloads').update(payload).eq('id', id).select().single();
      if (e) { setError(e.message); return false; }
      setDownloads((prev) => prev.map((d2) => (d2.id === id ? { ...d2, ...d } : d2)));
    } else {
      const { data: d, error: e } = await supabase.from('downloads').insert(payload).select().single();
      if (e) { setError(e.message); return false; }
      setDownloads((prev) => [d as DownloadType, ...prev]);
    }
    return true;
  }

  async function remove(id: string) {
    const { error: e } = await supabase.from('downloads').delete().eq('id', id);
    if (e) { setError(e.message); return; }
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const result = await uploadFile(file, `download-${Date.now()}`);
      if (result && editing) setEditing({ ...editing, file_url: result.url, file_size_kb: result.sizeKb });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl font-bold text-navy-950 dark:text-slate-100">Downloads</h2>
        <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Download
        </button>
      </div>
      {error && <ErrorBanner message={error} />}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium">Semester</th>
                <th className="text-left p-3 font-medium">Size</th>
                <th className="text-left p-3 font-medium">Active</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {downloads.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="p-3">
                    <div className="font-medium text-slate-800 dark:text-slate-100">{d.title}</div>
                    {d.description && <div className="text-xs text-slate-400">{d.description}</div>}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{d.category}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{d.semester || '-'}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{d.file_size_kb ? `${d.file_size_kb} KB` : '-'}</td>
                  <td className="p-3">{d.is_active ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <a href={d.file_url} target="_blank" rel="noreferrer" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500"><Eye className="w-4 h-4" /></a>
                      <button onClick={() => setEditing(d)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500"><Pencil className="w-4 h-4" /></button>
                      <ConfirmButton onConfirm={() => remove(d.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"><Trash2 className="w-4 h-4" /></ConfirmButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {downloads.length === 0 && <EmptyState message="No downloads yet" />}
      </div>

      {(editing || creating) && (
        <Modal title={editing ? 'Edit Download' : 'New Download'} onClose={() => { setEditing(null); setCreating(false); }}>
          <DownloadForm
            initial={editing || blank}
            uploading={uploading}
            fileRef={fileRef}
            onFilePick={handleFile}
            onSave={async (data) => {
              const ok = await save(data, editing?.id);
              if (ok) { setEditing(null); setCreating(false); }
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function DownloadForm({ initial, onSave, uploading, fileRef, onFilePick }: {
  initial: Partial<DownloadType>;
  onSave: (data: Partial<DownloadType>) => Promise<void>;
  uploading: boolean;
  fileRef: React.RefObject<HTMLInputElement>;
  onFilePick: (file: File) => void;
}) {
  const [form, setForm] = useState({
    title: initial.title || '',
    description: initial.description || '',
    file_url: initial.file_url || '',
    file_size_kb: initial.file_size_kb ?? 0,
    category: initial.category || 'Other',
    semester: initial.semester || '',
    is_active: initial.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">Title</label>
        <input required className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input-field" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {DOWNLOAD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Semester</label>
          <select className="input-field" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
            <option value="">None</option>
            {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">File</label>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFilePick(f); }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-secondary py-2 text-sm flex items-center gap-2">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload File'}
          </button>
          {form.file_url && <span className="text-xs text-green-600">File uploaded ({form.file_size_kb} KB)</span>}
        </div>
        <input className="input-field mt-2" placeholder="Or paste file URL" value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} />
      </div>
      <div>
        <label className="label">Active</label>
        <select className="input-field" value={form.is_active ? '1' : '0'} onChange={(e) => setForm({ ...form, is_active: e.target.value === '1' })}>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function GalleryTab({ photos, setPhotos, uploadedBy }: {
  photos: Photo[];
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
  uploadedBy?: string;
}) {
  const [editing, setEditing] = useState<Photo | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const blank: Partial<Photo> = {
    title: '', description: '', image_url: '', album: 'General', link_url: null, is_published: true,
  };

  async function save(data: Partial<Photo>, id?: string) {
    setError(null);
    const payload = { ...data, uploaded_by: uploadedBy };
    if (id) {
      const { data: d, error: e } = await supabase.from('photos').update(payload).eq('id', id).select().single();
      if (e) { setError(e.message); return false; }
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...d } : p)));
    } else {
      const { data: d, error: e } = await supabase.from('photos').insert(payload).select().single();
      if (e) { setError(e.message); return false; }
      setPhotos((prev) => [d as Photo, ...prev]);
    }
    return true;
  }

  async function remove(id: string) {
    const { error: e } = await supabase.from('photos').delete().eq('id', id);
    if (e) { setError(e.message); return; }
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleImage(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file, `gallery-${Date.now()}`);
      if (url && editing) setEditing({ ...editing, image_url: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl font-bold text-navy-950 dark:text-slate-100">Gallery</h2>
        <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Photo
        </button>
      </div>
      {error && <ErrorBanner message={error} />}

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p) => (
          <div key={p.id} className="card overflow-hidden group relative">
            <img src={p.image_url} alt={p.title || ''} className="w-full h-40 object-cover" />
            <div className="p-3">
              <h3 className="font-medium text-sm text-slate-800 dark:text-slate-100">{p.title || '(untitled)'}</h3>
              <p className="text-xs text-slate-400">{p.album}</p>
              <div className="mt-1 flex items-center gap-2">
                {p.is_published ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />}
                <button onClick={() => setEditing(p)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Pencil className="w-3.5 h-3.5" /></button>
                <ConfirmButton onConfirm={() => remove(p.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"><Trash2 className="w-3.5 h-3.5" /></ConfirmButton>
              </div>
            </div>
          </div>
        ))}
      </div>
      {photos.length === 0 && <EmptyState message="No photos yet" />}

      {(editing || creating) && (
        <Modal title={editing ? 'Edit Photo' : 'New Photo'} onClose={() => { setEditing(null); setCreating(false); }}>
          <PhotoForm
            initial={editing || blank}
            uploading={uploading}
            fileRef={fileRef}
            onImagePick={handleImage}
            onSave={async (data) => {
              const ok = await save(data, editing?.id);
              if (ok) { setEditing(null); setCreating(false); }
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function PhotoForm({ initial, onSave, uploading, fileRef, onImagePick }: {
  initial: Partial<Photo>;
  onSave: (data: Partial<Photo>) => Promise<void>;
  uploading: boolean;
  fileRef: React.RefObject<HTMLInputElement>;
  onImagePick: (file: File) => void;
}) {
  const [form, setForm] = useState({
    title: initial.title || '',
    description: initial.description || '',
    image_url: initial.image_url || '',
    album: initial.album || 'General',
    link_url: initial.link_url || '',
    is_published: initial.is_published ?? true,
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, link_url: form.link_url || null });
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">Image</label>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImagePick(f); }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-secondary py-2 text-sm flex items-center gap-2">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload'}
          </button>
          {form.image_url && <img src={form.image_url} alt="" className="w-20 h-20 object-cover rounded" />}
        </div>
        <input className="input-field mt-2" placeholder="Or paste image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
      </div>
      <div>
        <label className="label">Title</label>
        <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input-field" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Album</label>
          <input className="input-field" value={form.album} onChange={(e) => setForm({ ...form, album: e.target.value })} />
        </div>
        <div>
          <label className="label">Link URL</label>
          <input className="input-field" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Published</label>
        <select className="input-field" value={form.is_published ? '1' : '0'} onChange={(e) => setForm({ ...form, is_published: e.target.value === '1' })}>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function SettingsTab({ settings, setSettings }: {
  settings: SiteSetting[];
  setSettings: React.Dispatch<React.SetStateAction<SiteSetting[]>>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadKey, setUploadKey] = useState<string | null>('');

  function getValue(key: string): string {
    return settings.find((s) => s.setting_key === key)?.setting_value || '';
  }

  async function updateSetting(key: string, value: string, type = 'text', description?: string) {
    setError(null);
    const existing = settings.find((s) => s.setting_key === key);
    if (existing) {
      const { data, error: e } = await supabase.from('site_settings').update({ setting_value: value }).eq('id', existing.id).select().single();
      if (e) { setError(e.message); return; }
      setSettings((prev) => prev.map((s) => (s.id === existing.id ? { ...s, ...data } : s)));
    } else {
      const { data, error: e } = await supabase.from('site_settings').insert({ setting_key: key, setting_value: value, setting_type: type, description }).select().single();
      if (e) { setError(e.message); return; }
      setSettings((prev) => [...prev, data as SiteSetting]);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleImage(file: File, key: string) {
    setUploading(true);
    setUploadKey(key);
    try {
      const url = await uploadImage(file, `setting-${key}`);
      if (url) await updateSetting(key, url, 'image');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadKey(null);
    }
  }

  const imageSettings = [
    { key: 'hero_image_url', label: 'Hero Image' },
    { key: 'principal_photo_url', label: 'Principal Photo' },
    { key: 'logo_url', label: 'Logo' },
    { key: 'about_image_url', label: 'About Image' },
  ];

  const textSettings = [
    { key: 'hero_opacity', label: 'Hero Opacity (0-1)', type: 'number' },
    { key: 'principal_greeting', label: 'Principal Greeting', type: 'textarea' },
    { key: 'principal_name', label: 'Principal Name' },
    { key: 'college_tagline', label: 'College Tagline' },
    { key: 'contact_email', label: 'Contact Email' },
    { key: 'contact_phone', label: 'Contact Phone' },
    { key: 'contact_address', label: 'Contact Address' },
  ];

  const themeSettings = [
    { key: 'theme_admin', label: 'Admin Theme' },
    { key: 'theme_faculty', label: 'Faculty Theme' },
    { key: 'theme_student', label: 'Student Theme' },
    { key: 'theme_finance', label: 'Finance Theme' },
    { key: 'theme_standard', label: 'Standard Theme' },
  ];

  const paymentSettings = [
    { key: 'razorpay_enabled', label: 'Razorpay Enabled', type: 'boolean' },
    { key: 'razorpay_key_id', label: 'Razorpay Key ID' },
  ];

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      {saved && <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm flex items-center gap-2"><Check className="w-4 h-4" /> Saved</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="font-serif font-bold text-navy-950 dark:text-slate-100 mb-3">Images</h3>
          <div className="space-y-4">
            {imageSettings.map((s) => (
              <div key={s.key}>
                <label className="label">{s.label}</label>
                <div className="flex items-center gap-2">
                  <input ref={(el) => { fileRefs.current[s.key] = el; }} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(f, s.key); }} />
                  <button type="button" onClick={() => { setUploadKey(s.key); fileRefs.current[s.key]?.click(); }} disabled={uploading && uploadKey === s.key} className="btn-secondary py-2 text-sm flex items-center gap-2">
                    <Upload className="w-4 h-4" /> {uploading && uploadKey === s.key ? 'Uploading...' : 'Upload'}
                  </button>
                  {getValue(s.key) && <img src={getValue(s.key)} alt={s.label} className="w-16 h-16 object-cover rounded" />}
                </div>
                <input className="input-field mt-2" placeholder="Or paste URL" defaultValue={getValue(s.key)} onBlur={(e) => updateSetting(s.key, e.target.value, 'image')} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-serif font-bold text-navy-950 dark:text-slate-100 mb-3">Text Settings</h3>
          <div className="space-y-3">
            {textSettings.map((s) => (
              <div key={s.key}>
                <label className="label">{s.label}</label>
                {s.type === 'textarea' ? (
                  <textarea className="input-field" rows={2} defaultValue={getValue(s.key)} onBlur={(e) => updateSetting(s.key, e.target.value, 'text')} />
                ) : (
                  <input type={s.type || 'text'} className="input-field" defaultValue={getValue(s.key)} onBlur={(e) => updateSetting(s.key, e.target.value, 'text')} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-serif font-bold text-navy-950 dark:text-slate-100 mb-3">Profile Themes per Role</h3>
          <div className="space-y-3">
            {themeSettings.map((s) => (
              <div key={s.key}>
                <label className="label">{s.label}</label>
                <select className="input-field" defaultValue={getValue(s.key)} onBlur={(e) => updateSetting(s.key, e.target.value, 'text')}>
                  <option value="">Default (classic)</option>
                  <option value="classic">Classic Navy</option>
                  <option value="royal-gold">Royal Gold</option>
                  <option value="aurora">Aurora Borealis</option>
                  <option value="midnight">Midnight Galaxy</option>
                  <option value="crimson">Crimson Prestige</option>
                  <option value="emerald">Emerald Grove</option>
                  <option value="sterling">Sterling Finance</option>
                  <option value="restricted">Restricted</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-serif font-bold text-navy-950 dark:text-slate-100 mb-3">Razorpay Settings</h3>
          <div className="space-y-3">
            {paymentSettings.map((s) => (
              <div key={s.key}>
                <label className="label">{s.label}</label>
                {s.type === 'boolean' ? (
                  <select className="input-field" defaultValue={getValue(s.key)} onBlur={(e) => updateSetting(s.key, e.target.value, 'boolean')}>
                    <option value="">No</option>
                    <option value="true">Yes</option>
                  </select>
                ) : (
                  <input className="input-field" defaultValue={getValue(s.key)} onBlur={(e) => updateSetting(s.key, e.target.value, 'text')} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessagesTab({ messages, setMessages, onChanged }: {
  messages: ContactMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ContactMessage[]>>;
  onChanged: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filtered = messages.filter((m) => {
    if (filter === 'unread') return !m.is_read;
    if (filter === 'read') return m.is_read;
    return true;
  });

  async function markRead(id: string, isRead: boolean) {
    setError(null);
    const { error: e } = await supabase.from('contact_messages').update({ is_read: !isRead }).eq('id', id);
    if (e) { setError(e.message); return; }
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: !isRead } : m)));
    await onChanged();
  }

  async function remove(id: string) {
    setError(null);
    const { error: e } = await supabase.from('contact_messages').delete().eq('id', id);
    if (e) { setError(e.message); return; }
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await onChanged();
  }

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-slate-400" />
        {(['all', 'unread', 'read'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-navy-900 text-white dark:bg-amber-500 dark:text-navy-950' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((m) => (
          <div key={m.id} className={`card p-4 ${!m.is_read ? 'border-l-4 border-l-gold-400' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-800 dark:text-slate-100">{m.name}</h3>
                  {!m.is_read && <span className="w-2 h-2 rounded-full bg-gold-500" />}
                </div>
                <p className="text-xs text-slate-400">{m.email} · {new Date(m.submitted_at).toLocaleString()}</p>
                {m.subject && <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-1">{m.subject}</p>}
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{m.message}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => markRead(m.id, m.is_read)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title={m.is_read ? 'Mark unread' : 'Mark read'}>
                  {m.is_read ? <Mail className="w-4 h-4" /> : <Check className="w-4 h-4 text-green-500" />}
                </button>
                <ConfirmButton onConfirm={() => remove(m.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"><Trash2 className="w-4 h-4" /></ConfirmButton>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState message="No messages" />}
    </div>
  );
}

function PaymentRequestsTab({ requests, setRequests }: {
  requests: PaymentRequest[];
  setRequests: React.Dispatch<React.SetStateAction<PaymentRequest[]>>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');

  const filtered = requests.filter((r) => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'paid') return r.status === 'paid';
    if (filter === 'overdue') return r.status === 'pending' && r.due_date && new Date(r.due_date) < new Date();
    return true;
  });

  async function updateStatus(id: string, status: string) {
    setError(null);
    const { data, error: e } = await supabase.from('payment_requests').update({ status }).eq('id', id).select().single();
    if (e) { setError(e.message); return; }
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  }

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-slate-400" />
        {(['all', 'pending', 'paid', 'overdue'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-navy-900 text-white dark:bg-amber-500 dark:text-navy-950' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">Student</th>
                <th className="text-left p-3 font-medium">Amount</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Due</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="p-3">
                    <div className="font-medium text-slate-800 dark:text-slate-100">{r.title}</div>
                    {r.description && <div className="text-xs text-slate-400">{r.description}</div>}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300 font-mono text-xs">{r.student_id.slice(0, 8)}</td>
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-100">₹{r.amount}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{r.payment_type}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{r.due_date ? new Date(r.due_date).toLocaleDateString() : '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      r.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                      r.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}>{r.status}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(r.id, 'paid')} className="px-2 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700">Mark Paid</button>
                          <button onClick={() => updateStatus(r.id, 'cancelled')} className="px-2 py-1 rounded text-xs bg-slate-200 dark:bg-slate-600 hover:bg-slate-300">Cancel</button>
                        </>
                      )}
                      {r.status === 'paid' && (
                        <button onClick={() => updateStatus(r.id, 'pending')} className="px-2 py-1 rounded text-xs bg-slate-200 dark:bg-slate-600 hover:bg-slate-300">Revert</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState message="No payment requests" />}
      </div>
    </div>
  );
}

function TransactionsTab({ transactions, setTransactions, recordedBy }: {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  recordedBy?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    return t.payment_type.toLowerCase().includes(q) || t.payment_method.toLowerCase().includes(q) || t.status.toLowerCase().includes(q) || (t.reference_no || '').toLowerCase().includes(q);
  });

  async function addTransaction(data: Partial<Transaction>) {
    setError(null);
    const payload = { ...data, recorded_by: recordedBy, payment_date: data.payment_date || new Date().toISOString() };
    const { data: d, error: e } = await supabase.from('transactions').insert(payload).select().single();
    if (e) { setError(e.message); return false; }
    setTransactions((prev) => [d as Transaction, ...prev]);
    return true;
  }

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Amount</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Method</th>
                <th className="text-left p-3 font-medium">Season</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="p-3 text-slate-600 dark:text-slate-300">{new Date(t.payment_date).toLocaleDateString()}</td>
                  <td className="p-3 font-mono text-xs text-slate-500">{t.user_id.slice(0, 8)}</td>
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-100">₹{t.amount}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{t.payment_type}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{t.payment_method}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{t.season}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      t.status === 'completed' || t.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                      t.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    }`}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState message="No transactions" />}
      </div>

      {creating && (
        <Modal title="Add Manual Transaction" onClose={() => setCreating(false)}>
          <TransactionForm onSave={async (data) => {
            const ok = await addTransaction(data);
            if (ok) setCreating(false);
          }} />
        </Modal>
      )}
    </div>
  );
}

function TransactionForm({ onSave }: { onSave: (data: Partial<Transaction>) => Promise<void> }) {
  const [form, setForm] = useState({
    user_id: '',
    amount: 0,
    payment_type: 'Tuition Fee',
    payment_method: 'Cash',
    season: new Date().getFullYear().toString(),
    reference_no: '',
    notes: '',
    status: 'completed',
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, amount: Number(form.amount) });
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">User ID</label>
        <input required className="input-field font-mono text-xs" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} placeholder="Paste user UUID" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount (₹)</label>
          <input required type="number" min="0" className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
        </div>
        <div>
          <label className="label">Season</label>
          <input className="input-field" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Payment Type</label>
          <input className="input-field" value={form.payment_type} onChange={(e) => setForm({ ...form, payment_type: e.target.value })} />
        </div>
        <div>
          <label className="label">Payment Method</label>
          <select className="input-field" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="Razorpay">Razorpay</option>
            <option value="UPI">UPI</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Reference No</label>
          <input className="input-field" value={form.reference_no} onChange={(e) => setForm({ ...form, reference_no: e.target.value })} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input-field" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Add'}
        </button>
      </div>
    </form>
  );
}
