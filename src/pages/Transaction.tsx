import { useState, useEffect, useCallback } from 'react';
import { Receipt, CreditCard, Plus, Save, X, CircleAlert as AlertCircle, Check, Clock, Filter, Search, Wallet, FileText } from 'lucide-react';
import { supabase, Transaction as TransactionType, PaymentRequest, SiteSetting } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const PAYMENT_TYPES = ['Tuition Fee', 'Hostel Fee', 'Examination Fee', 'Library Fee', 'Application Fee', 'Late Fee', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Razorpay', 'UPI'];
const STATUSES = ['completed', 'pending', 'failed'];

export default function Transaction() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [paying, setPaying] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'finance';
  const razorpayEnabled = settings['razorpay_enabled'] === 'true';
  const razorpayKeyId = settings['razorpay_key_id'] || '';

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from('site_settings').select('*');
    const map: Record<string, string> = {};
    (data || []).forEach((s: SiteSetting) => { map[s.setting_key] = s.setting_value; });
    setSettings(map);
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    let query = supabase.from('transactions').select('*').order('payment_date', { ascending: false });
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }
    const { data, error: e } = await query.limit(200);
    if (e) { setError(e.message); return; }
    setTransactions(data || []);
  }, [user, isAdmin]);

  const fetchPaymentRequests = useCallback(async () => {
    if (!user) return;
    let query = supabase.from('payment_requests').select('*').order('created_at', { ascending: false });
    if (!isAdmin) {
      query = query.eq('student_id', user.id);
    }
    const { data } = await query;
    setPaymentRequests(data || []);
  }, [user, isAdmin]);

  useEffect(() => {
    async function load() {
      await Promise.all([fetchSettings(), fetchTransactions(), fetchPaymentRequests()]);
      setLoading(false);
    }
    load();
  }, [fetchSettings, fetchTransactions, fetchPaymentRequests]);

  async function addTransaction(data: Partial<TransactionType>) {
    if (!profile) return false;
    setError(null);
    const payload = {
      ...data,
      amount: Number(data.amount),
      recorded_by: profile.id,
      payment_date: data.payment_date || new Date().toISOString(),
    };
    const { data: d, error: e } = await supabase.from('transactions').insert(payload).select().single();
    if (e) { setError(e.message); return false; }
    setTransactions((prev) => [d as TransactionType, ...prev]);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
    return true;
  }

  async function updatePaymentRequestStatus(id: string, status: string) {
    setError(null);
    const { data, error: e } = await supabase
      .from('payment_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (e) { setError(e.message); return; }
    setPaymentRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  }

  async function payWithRazorpay(request: PaymentRequest) {
    if (!user || !profile) return;
    if (!razorpayEnabled || !razorpayKeyId) {
      setError('Razorpay is not enabled. Please contact the finance office.');
      return;
    }
    setPaying(request.id);
    setError(null);

    try {
      const { data: orderData, error: orderErr } = await supabase.functions.invoke('create-razorpay-order', {
        body: { amount: request.amount, paymentRequestId: request.id },
      });
      if (orderErr || !orderData?.order_id) throw new Error(orderErr?.message || 'Failed to create order');

      const options = {
        key: razorpayKeyId,
        amount: Math.round(request.amount * 100),
        currency: 'INR',
        name: 'Aizawl Bible College',
        description: request.title,
        order_id: orderData.order_id,
        prefill: { name: profile.full_name || '', email: profile.email },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const { error: txErr } = await supabase.from('transactions').insert({
            user_id: user.id,
            amount: request.amount,
            payment_type: request.payment_type,
            payment_method: 'Razorpay',
            payment_date: new Date().toISOString(),
            season: new Date().getFullYear().toString(),
            status: 'completed',
            gateway: 'razorpay',
            gateway_order_id: response.razorpay_order_id,
            gateway_payment_id: response.razorpay_payment_id,
            gateway_signature: response.razorpay_signature,
            recorded_by: user.id,
          });
          if (txErr) { setError(txErr.message); return; }

          await supabase.from('payment_requests').update({ status: 'paid' }).eq('id', request.id);
          await fetchTransactions();
          await fetchPaymentRequests();
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        },
        modal: { ondismiss: () => {} },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (resp: { error: { description: string } }) => {
        setError(`Payment failed: ${resp.error.description}`);
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment initiation failed');
    } finally {
      setPaying(null);
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch = t.payment_type.toLowerCase().includes(q) || t.payment_method.toLowerCase().includes(q) || (t.reference_no || '').toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = transactions.filter((t) => t.status === 'completed' || t.status === 'paid').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalPending = transactions.filter((t) => t.status === 'pending').reduce((sum, t) => sum + Number(t.amount), 0);
  const pendingRequests = paymentRequests.filter((r) => r.status === 'pending');

  if (loading) return <LoadingSpinner message="Loading transactions..." />;

  return (
    <div className="page-container py-8">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> Transaction completed successfully
        </div>
      )}

      <div className="mb-6">
        <h1 className="section-title flex items-center gap-3">
          <Receipt className="w-8 h-8 text-navy-700 dark:text-amber-400" />
          {isAdmin ? 'All Transactions' : 'My Transactions'}
        </h1>
        <p className="section-subtitle">{isAdmin ? 'Manage fees and payments' : 'View your payment history and pending fees'}</p>
      </div>

      <div className="grid gap-4 mb-6 sm:grid-cols-3">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/40">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Paid</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">₹{totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Pending</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">₹{totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-navy-100 dark:bg-navy-900/40">
              <FileText className="w-5 h-5 text-navy-600 dark:text-navy-300" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Payment Requests</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{pendingRequests.length} pending</p>
            </div>
          </div>
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className="card p-4 mb-6">
          <h2 className="font-serif text-lg font-bold text-navy-950 dark:text-slate-100 mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-navy-600 dark:text-amber-400" /> Payment Requests
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((r) => (
              <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-800 dark:text-slate-100">{r.title}</h3>
                    <span className="px-2 py-0.5 rounded text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">{r.status}</span>
                  </div>
                  {r.description && <p className="text-sm text-slate-500 dark:text-slate-400">{r.description}</p>}
                  <p className="text-xs text-slate-400 mt-1">
                    {r.payment_type} · {r.due_date ? `Due: ${new Date(r.due_date).toLocaleDateString()}` : 'No due date'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-100">₹{r.amount.toLocaleString()}</span>
                  {!isAdmin && razorpayEnabled && (
                    <button
                      onClick={() => payWithRazorpay(r)}
                      disabled={paying === r.id}
                      className="btn-primary py-2 px-4 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Wallet className="w-4 h-4" /> {paying === r.id ? 'Processing...' : 'Pay Now'}
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => updatePaymentRequestStatus(r.id, 'paid')}
                      className="px-3 py-2 rounded-lg text-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Mark Paid
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {!isAdmin && !razorpayEnabled && (
            <p className="text-xs text-slate-400 mt-2">Online payment is not available. Please pay at the finance office.</p>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field sm:w-40">
            <option value="all">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {isAdmin && (
          <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="text-left p-3 font-medium">Date</th>
                {isAdmin && <th className="text-left p-3 font-medium">User</th>}
                <th className="text-left p-3 font-medium">Amount</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Method</th>
                <th className="text-left p-3 font-medium">Season</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Ref No</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="p-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{new Date(t.payment_date).toLocaleDateString()}</td>
                  {isAdmin && <td className="p-3 font-mono text-xs text-slate-500">{t.user_id.slice(0, 8)}</td>}
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-100">₹{Number(t.amount).toLocaleString()}</td>
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
                  <td className="p-3 text-xs text-slate-400 font-mono">{t.reference_no || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No transactions found</p>
          </div>
        )}
      </div>

      {creating && (
        <NewTransactionModal
          onClose={() => setCreating(false)}
          onSave={async (data) => {
            const ok = await addTransaction(data);
            if (ok) setCreating(false);
            return ok;
          }}
        />
      )}
    </div>
  );
}

function NewTransactionModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Partial<TransactionType>) => Promise<boolean> }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl">
          <h3 className="font-serif text-lg font-bold text-navy-950 dark:text-slate-100">Add Manual Transaction</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-4">
          <div>
            <label className="label">User ID</label>
            <input required className="input-field font-mono text-xs" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} placeholder="Paste user UUID" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Amount (₹)</label>
              <input required type="number" min="0" className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="label">Season</label>
              <input className="input-field" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Payment Type</label>
              <select className="input-field" value={form.payment_type} onChange={(e) => setForm({ ...form, payment_type: e.target.value })}>
                {PAYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select className="input-field" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Reference No</label>
              <input className="input-field" value={form.reference_no} onChange={(e) => setForm({ ...form, reference_no: e.target.value })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input-field" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
