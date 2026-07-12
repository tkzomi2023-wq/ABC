import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Upload, User, CircleAlert as AlertCircle, GripVertical } from 'lucide-react';
import { supabase, BoardMember } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ResponsiveImage from '../components/ResponsiveImage';
import LoadingSpinner from '../components/LoadingSpinner';
import { compressImage } from '../lib/imageCompress';

const DEFAULT_PHOTO = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400';
const STORAGE_BUCKET = 'photos';

type EditForm = {
  name: string;
  designation: string;
  photo_url: string;
  display_order: number;
};

const EMPTY_FORM: EditForm = {
  name: '',
  designation: '',
  photo_url: '',
  display_order: 0,
};

export default function BoardOfManagement() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<BoardMember | null>(null);
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<BoardMember | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('board_members')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching board members:', error);
      setError('Failed to load board members. Please try again.');
    } else {
      setMembers((data || []) as BoardMember[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  useEffect(() => {
    if (deleteConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [deleteConfirm]);

  const openAddModal = () => {
    setEditingMember(null);
    setForm({ ...EMPTY_FORM, display_order: members.length });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (member: BoardMember) => {
    setEditingMember(member);
    setForm({
      name: member.name,
      designation: member.designation || '',
      photo_url: member.photo_url || '',
      display_order: member.display_order,
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMember(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormError('Please select an image file.');
      return;
    }

    setUploading(true);
    setFormError(null);
    try {
      const compressed = await compressImage(file);
      const ext = compressed.name.split('.').pop() || 'jpg';
      const filePath = `board/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, compressed);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        setForm((prev) => ({ ...prev, photo_url: urlData.publicUrl }));
      }
    } catch (err) {
      console.error('Upload error:', err);
      setFormError('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Name is required.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        designation: form.designation.trim() || null,
        photo_url: form.photo_url || null,
        display_order: form.display_order,
      };

      if (editingMember) {
        const { error } = await supabase
          .from('board_members')
          .update(payload)
          .eq('id', editingMember.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('board_members')
          .insert(payload);
        if (error) throw error;
      }

      closeModal();
      await fetchMembers();
    } catch (err) {
      console.error('Save error:', err);
      setFormError('Failed to save board member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('board_members')
        .delete()
        .eq('id', deleteConfirm.id);
      if (error) throw error;
      setDeleteConfirm(null);
      await fetchMembers();
    } catch (err) {
      console.error('Delete error:', err);
      setFormError('Failed to delete board member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading board members..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-500 dark:text-red-400 text-center">{error}</p>
        <button
          onClick={fetchMembers}
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
            Board of Management
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            The dedicated leaders who guide the vision, governance, and direction of Aizawl Bible College.
          </p>
        </div>
      </section>

      {/* Board Members Grid */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-900 dark:text-white">
              Board Members
            </h2>
            {isAdmin && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-600 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Member
              </button>
            )}
          </div>

          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <User className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                No board members have been added yet.
              </p>
              {isAdmin && (
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-600 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add the first member
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {members.map((member) => (
                <article
                  key={member.id}
                  className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow relative group"
                >
                  {isAdmin && (
                    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(member)}
                        className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-700/90 flex items-center justify-center text-navy-700 dark:text-gold-400 hover:bg-white dark:hover:bg-slate-600 transition-colors shadow"
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(member)}
                        className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-700/90 flex items-center justify-center text-red-600 hover:bg-white dark:hover:bg-slate-600 transition-colors shadow"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700">
                    {member.photo_url ? (
                      <ResponsiveImage
                        src={member.photo_url}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        widths={[200, 300, 400]}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        aspectRatio="1/1"
                        fallbackSrc={DEFAULT_PHOTO}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-navy-100 dark:bg-navy-800">
                        <User className="w-16 h-16 text-navy-300 dark:text-navy-600" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 text-center">
                    <h3 className="font-serif text-lg font-bold text-navy-900 dark:text-white mb-1">
                      {member.name}
                    </h3>
                    {member.designation && (
                      <p className="text-sm text-navy-600 dark:text-gold-400">
                        {member.designation}
                      </p>
                    )}
                    {isAdmin && (
                      <p className="flex items-center justify-center gap-1 text-xs text-slate-400 dark:text-slate-500 mt-2">
                        <GripVertical className="w-3 h-3" />
                        Order: {member.display_order}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-serif text-xl font-bold text-navy-900 dark:text-white">
                {editingMember ? 'Edit Board Member' : 'Add Board Member'}
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              {/* Photo Preview & Upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600">
                  {form.photo_url ? (
                    <ResponsiveImage
                      src={form.photo_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      widths={[200, 300]}
                      sizes="112px"
                      aspectRatio="1/1"
                      fallbackSrc={DEFAULT_PHOTO}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-navy-100 dark:bg-navy-800">
                      <User className="w-10 h-10 text-navy-300 dark:text-navy-600" />
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-navy-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-500 dark:focus:ring-gold-400"
                  placeholder="Full name"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => setForm((prev) => ({ ...prev, designation: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-500 dark:focus:ring-gold-400"
                  placeholder="e.g. Chairman, Secretary"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-500 dark:focus:ring-gold-400"
                  min={0}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Lower numbers appear first.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingMember ? 'Update' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="font-serif text-lg font-bold text-navy-900 dark:text-white">
                  Delete Board Member
                </h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
