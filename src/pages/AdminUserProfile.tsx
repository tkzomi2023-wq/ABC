import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Mail, Phone, MapPin, BookOpen, Calendar, Award,
  GraduationCap, Receipt, FileText, Ban, ShieldCheck, Save, Edit3,
  X, AlertCircle, Check,
} from 'lucide-react';
import { supabase, Profile as ProfileType, Transaction, Application } from '../lib/supabase';
import { getTheme } from '../lib/themes';
import LoadingSpinner from '../components/LoadingSpinner';

const ROLES: ProfileType['role'][] = ['admin', 'faculty', 'student', 'finance', 'standard'];

export default function AdminUserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<ProfileType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    role: 'standard' as ProfileType['role'],
    is_banned: false,
    display_order: 0,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error: e } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (e) { setError(e.message); setLoading(false); return; }
    if (!data) { setError('User not found'); setLoading(false); return; }
    setUserProfile(data);
    setEditForm({ role: data.role, is_banned: data.is_banned, display_order: data.display_order });
    setLoading(false);
  }, [id]);

  const fetchTransactions = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', id)
      .order('payment_date', { ascending: false });
    if (data) setTransactions(data);
  }, [id]);

  const fetchApplications = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', id)
      .order('submitted_at', { ascending: false });
    if (data) setApplications(data);
  }, [id]);

  useEffect(() => {
    async function load() {
      await Promise.all([fetchProfile(), fetchTransactions(), fetchApplications()]);
    }
    load();
  }, [fetchProfile, fetchTransactions, fetchApplications]);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    const { data, error: e2 } = await supabase
      .from('profiles')
      .update({
        role: editForm.role,
        is_banned: editForm.is_banned,
        display_order: editForm.display_order,
      })
      .eq('id', id)
      .select()
      .single();
    if (e2) { setError(e2.message); setSaving(false); return; }
    setUserProfile(data);
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function toggleBan() {
    if (!userProfile) return;
    setError(null);
    const newVal = !userProfile.is_banned;
    const { data, error: e } = await supabase
      .from('profiles')
      .update({ is_banned: newVal })
      .eq('id', userProfile.id)
      .select()
      .single();
    if (e) { setError(e.message); return; }
    setUserProfile(data);
    setEditForm((prev) => ({ ...prev, is_banned: newVal }));
  }

  async function deleteUser() {
    if (!id) return;
    setError(null);
    const { error: e } = await supabase.functions.invoke('delete-user', { body: { userId: id } });
    if (e) { setError(e.message); return; }
    navigate('/admin');
  }

  if (loading) return <LoadingSpinner message="Loading user profile..." />;

  if (!userProfile) {
    return (
      <div className="page-container py-8">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
          <p className="text-slate-600 dark:text-slate-300">{error || 'User not found'}</p>
          <Link to="/admin" className="btn-primary mt-4 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const theme = getTheme(userProfile.profile_theme);

  return (
    <div className="page-container py-8">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {saved && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> Changes saved
        </div>
      )}

      <Link to="/admin" className="mb-4 inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-navy-700 dark:hover:text-amber-400 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="card overflow-hidden mb-6">
        <div className={`relative h-40 sm:h-52 ${theme.coverClass} ${theme.shimmerClass || ''}`}>
          {theme.shimmerClass && <div className={`absolute inset-0 ${theme.shimmerClass}`} />}
          <div className="absolute inset-0 flex items-end px-6 pb-4">
            <div className="flex items-end gap-4">
              <div className={`relative ${theme.ringClass} rounded-full`}>
                {userProfile.avatar_url ? (
                  <img src={userProfile.avatar_url} alt={userProfile.full_name || ''} className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 ${theme.avatarBorderClass}`} />
                ) : (
                  <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center border-4 ${theme.avatarBorderClass}`}>
                    <User className="w-12 h-12 text-slate-500" />
                  </div>
                )}
              </div>
              <div className="pb-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                  {userProfile.full_name || 'Unnamed'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${theme.badgeClass}`}>
                    {userProfile.role}
                  </span>
                  {userProfile.is_banned && <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-red-900/90 text-red-100">Banned</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl font-bold text-navy-950 dark:text-slate-100">Profile Information</h2>
            <div className="flex gap-2">
              <button onClick={() => setEditing(!editing)} className="btn-secondary flex items-center gap-2 py-2">
                {editing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {editing ? 'Cancel' : 'Edit'}
              </button>
              <button onClick={toggleBan} className={`flex items-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                userProfile.is_banned
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200'
                  : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200'
              }`}>
                {userProfile.is_banned ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                {userProfile.is_banned ? 'Unban' : 'Ban'}
              </button>
            </div>
          </div>

          {editing ? (
            <form onSubmit={saveEdit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label">Role</label>
                  <select className="input-field" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as ProfileType['role'] })}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Display Order</label>
                  <input type="number" className="input-field" value={editForm.display_order} onChange={(e) => setEditForm({ ...editForm, display_order: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="label">Banned</label>
                  <select className="input-field" value={editForm.is_banned ? '1' : '0'} onChange={(e) => setEditForm({ ...editForm, is_banned: e.target.value === '1' })}>
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={Mail} label="Email" value={userProfile.email} />
              <InfoRow icon={Phone} label="Phone" value={userProfile.phone} />
              <InfoRow icon={MapPin} label="Address" value={userProfile.address} />
              <InfoRow icon={BookOpen} label="Course" value={userProfile.course} />
              {userProfile.student_year && <InfoRow icon={GraduationCap} label="Year" value={userProfile.student_year.replace('_', ' ')} />}
              {userProfile.admission_date && <InfoRow icon={Calendar} label="Admission Date" value={new Date(userProfile.admission_date).toLocaleDateString()} />}
              {userProfile.qualification && <InfoRow icon={Award} label="Qualification" value={userProfile.qualification} />}
              {userProfile.subject_in_charge && <InfoRow icon={BookOpen} label="Subject" value={userProfile.subject_in_charge} />}
              {userProfile.position && <InfoRow icon={User} label="Position" value={userProfile.position} />}
              <InfoRow icon={Calendar} label="Joined" value={new Date(userProfile.created_at).toLocaleDateString()} />
              <InfoRow icon={User} label="Display Order" value={String(userProfile.display_order)} />
            </div>
          )}

          {userProfile.bio && (
            <div className="mt-6">
              <h3 className="font-serif font-bold text-navy-950 dark:text-slate-100 mb-2">Bio</h3>
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{userProfile.bio}</p>
            </div>
          )}

          {userProfile.graduated && (
            <div className="mt-6 p-4 rounded-lg bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-800">
              <h3 className="font-serif font-bold text-navy-950 dark:text-slate-100 mb-2 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-gold-600" /> Certificate Information
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                {userProfile.completion_date && <div><span className="text-slate-500">Completion Date:</span> <span className="font-medium text-slate-800 dark:text-slate-200">{new Date(userProfile.completion_date).toLocaleDateString()}</span></div>}
                {userProfile.certificate_id && <div><span className="text-slate-500">Certificate ID:</span> <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">{userProfile.certificate_id}</span></div>}
              </div>
              <Link to={`/certificate/${userProfile.id}`} className="btn-primary mt-3 inline-flex items-center gap-2 text-sm py-2">
                <Award className="w-4 h-4" /> View / Generate Certificate
              </Link>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
            <h3 className="font-serif font-bold text-navy-950 dark:text-slate-100 mb-3">Admin Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Link to={`/certificate/${userProfile.id}`} className="btn-secondary flex items-center gap-2 py-2 text-sm">
                <Award className="w-4 h-4" /> Certificate
              </Link>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to permanently delete this user? This cannot be undone.')) deleteUser();
                }}
                className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 font-medium text-sm flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Delete User
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="font-serif font-bold text-navy-950 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-navy-600 dark:text-amber-400" /> Transactions
            <span className="text-sm font-normal text-slate-400">({transactions.length})</span>
          </h3>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="text-left p-2 font-medium">Date</th>
                    <th className="text-left p-2 font-medium">Amount</th>
                    <th className="text-left p-2 font-medium">Type</th>
                    <th className="text-left p-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="p-2 text-slate-600 dark:text-slate-300">{new Date(t.payment_date).toLocaleDateString()}</td>
                      <td className="p-2 font-medium text-slate-800 dark:text-slate-100">₹{Number(t.amount).toLocaleString()}</td>
                      <td className="p-2 text-slate-600 dark:text-slate-300">{t.payment_type}</td>
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
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No transactions</p>
          )}
        </div>

        <div className="card p-4">
          <h3 className="font-serif font-bold text-navy-950 dark:text-slate-100 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-navy-600 dark:text-amber-400" /> Applications
            <span className="text-sm font-normal text-slate-400">({applications.length})</span>
          </h3>
          {applications.length > 0 ? (
            <div className="space-y-3">
              {applications.map((a) => (
                <div key={a.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm text-slate-800 dark:text-slate-100">{a.full_name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      a.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                      a.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}>{a.status}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Applying for: {a.applying_for || a.course_applied || 'N/A'} · Submitted: {new Date(a.submitted_at).toLocaleDateString()}
                  </p>
                  {a.review_notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Notes: {a.review_notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No applications</p>
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
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 break-words">{value}</p>
      </div>
    </div>
  );
}
