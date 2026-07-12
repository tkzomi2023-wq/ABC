import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, BookOpen, Calendar, Award, CreditCard as Edit3, Save, X, Upload, GraduationCap, Receipt, Palette, Check } from 'lucide-react';
import { supabase, Transaction } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { compressImage, buildStoragePath } from '../lib/imageCompress';
import { THEMES, getTheme } from '../lib/themes';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    bio: '',
    avatar_url: '',
    profile_theme: 'classic',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        profile_theme: profile.profile_theme || 'classic',
      });
    }
  }, [profile]);

  useEffect(() => {
    async function fetchTransactions() {
      if (!user) return;
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false });
      if (data) setTransactions(data);
      setLoading(false);
    }
    fetchTransactions();
  }, [user]);

  async function handleAvatar(file: File) {
    if (!user) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const ext = compressed.name.split('.').pop();
      const path = buildStoragePath('photos', `avatar-${user.id}`, ext);
      const { error: upErr } = await supabase.storage.from('photos').upload(path, compressed, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('photos').getPublicUrl(path);
      setForm((prev) => ({ ...prev, avatar_url: data.publicUrl }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Avatar upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSuccess(false);
    const { error: e2 } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
        bio: form.bio,
        avatar_url: form.avatar_url,
        profile_theme: form.profile_theme,
      })
      .eq('id', user.id);
    if (e2) {
      setError(e2.message);
      return;
    }
    await refreshProfile();
    setSuccess(true);
    setEditing(false);
    setTimeout(() => setSuccess(false), 2000);
  }

  if (loading || !profile) return <LoadingSpinner message="Loading profile..." />;

  const theme = getTheme(profile.profile_theme);

  return (
    <div className="page-container py-8">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> Profile updated successfully
        </div>
      )}

      <div className="card overflow-hidden">
        <div className={`relative h-40 sm:h-52 ${theme.coverClass} ${theme.shimmerClass || ''}`}>
          {theme.shimmerClass && <div className={`absolute inset-0 ${theme.shimmerClass}`} />}
          <div className="absolute inset-0 flex items-end px-6 pb-4">
            <div className="flex items-end gap-4">
              <div className={`relative ${theme.ringClass} rounded-full`}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || ''} className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 ${theme.avatarBorderClass}`} />
                ) : (
                  <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center border-4 ${theme.avatarBorderClass}`}>
                    <User className="w-12 h-12 text-slate-500" />
                  </div>
                )}
              </div>
              <div className="pb-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                  {profile.full_name || 'Unnamed'}
                </h1>
                <span className={`mt-1 inline-block px-3 py-0.5 rounded-full text-xs font-medium ${theme.badgeClass}`}>
                  {profile.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!editing ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-navy-950 dark:text-slate-100">Profile Details</h2>
                <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2 py-2">
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow icon={Mail} label="Email" value={profile.email} />
                <InfoRow icon={Phone} label="Phone" value={profile.phone} />
                <InfoRow icon={MapPin} label="Address" value={profile.address} />
                <InfoRow icon={BookOpen} label="Course" value={profile.course} />
                {profile.student_year && <InfoRow icon={GraduationCap} label="Year" value={profile.student_year.replace('_', ' ')} />}
                {profile.admission_date && <InfoRow icon={Calendar} label="Admission Date" value={new Date(profile.admission_date).toLocaleDateString()} />}
                {profile.qualification && <InfoRow icon={Award} label="Qualification" value={profile.qualification} />}
                {profile.subject_in_charge && <InfoRow icon={BookOpen} label="Subject" value={profile.subject_in_charge} />}
                {profile.position && <InfoRow icon={User} label="Position" value={profile.position} />}
              </div>

              {profile.bio && (
                <div className="mt-6">
                  <h3 className="font-serif font-bold text-navy-950 dark:text-slate-100 mb-2">Bio</h3>
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}

              {profile.graduated && (
                <div className="mt-6 p-4 rounded-lg bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-800">
                  <h3 className="font-serif font-bold text-navy-950 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-gold-600" /> Certificate Information
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2 text-sm">
                    {profile.completion_date && <div><span className="text-slate-500">Completion Date:</span> <span className="font-medium text-slate-800 dark:text-slate-200">{new Date(profile.completion_date).toLocaleDateString()}</span></div>}
                    {profile.certificate_id && <div><span className="text-slate-500">Certificate ID:</span> <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">{profile.certificate_id}</span></div>}
                    {profile.certificate_url && <a href={profile.certificate_url} target="_blank" rel="noreferrer" className="text-navy-600 dark:text-amber-400 hover:underline">View Certificate →</a>}
                  </div>
                </div>
              )}

              {profile.show_transactions_public && transactions.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-serif font-bold text-navy-950 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-navy-600 dark:text-amber-400" /> Transaction History
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="text-left p-2 font-medium">Date</th>
                          <th className="text-left p-2 font-medium">Amount</th>
                          <th className="text-left p-2 font-medium">Type</th>
                          <th className="text-left p-2 font-medium">Method</th>
                          <th className="text-left p-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {transactions.map((t) => (
                          <tr key={t.id}>
                            <td className="p-2 text-slate-600 dark:text-slate-300">{new Date(t.payment_date).toLocaleDateString()}</td>
                            <td className="p-2 font-medium text-slate-800 dark:text-slate-100">₹{t.amount}</td>
                            <td className="p-2 text-slate-600 dark:text-slate-300">{t.payment_type}</td>
                            <td className="p-2 text-slate-600 dark:text-slate-300">{t.payment_method}</td>
                            <td className="p-2">
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
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-serif text-xl font-bold text-navy-950 dark:text-slate-100">Edit Profile</h2>
                <button type="button" onClick={() => setEditing(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                      <User className="w-10 h-10 text-slate-400" />
                    </div>
                  )}
                </div>
                <div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatar(f); }} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-secondary py-2 flex items-center gap-2">
                    <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Change Avatar'}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Full Name</label>
                <input className="input-field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Phone</label>
                  <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="label">Address</label>
                  <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea className="input-field" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>

              <div>
                <label className="label flex items-center gap-2"><Palette className="w-4 h-4" /> Profile Theme</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm({ ...form, profile_theme: t.id })}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        form.profile_theme === t.id ? 'border-navy-600 dark:border-amber-400 ring-2 ring-navy-300 dark:ring-amber-300' : 'border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <div className={`h-12 ${t.coverClass}`} />
                      <div className="p-1.5 text-left">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{t.label}</p>
                      </div>
                      {form.profile_theme === t.id && (
                        <div className="absolute top-1 right-1 bg-navy-600 dark:bg-amber-400 rounded-full p-0.5">
                          <Check className="w-3 h-3 text-white dark:text-navy-950" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-300" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}
