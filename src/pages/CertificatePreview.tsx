import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Loader, AlertCircle, User } from 'lucide-react';
import { supabase, Profile } from '../lib/supabase';
import { CertificateDocument } from '../components/CertificateDocument';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';

export default function CertificatePreview() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  async function loadUser() {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('User not found');
      if (!data.graduated) throw new Error('This user has not graduated yet');

      setUser(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-navy-700 animate-spin" />
          <p className="text-slate-500 text-sm">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-serif font-bold text-navy-900 mb-2">Certificate Not Found</h2>
          <p className="text-slate-500 mb-6">{error || 'The requested certificate could not be found.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate(-1)} className="btn-secondary">
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
            <Link to="/admin?tab=graduated" className="btn-primary">
              View Graduates
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const certYear = user.completion_date ? new Date(user.completion_date).getFullYear() : new Date().getFullYear();
  const certificateId = user.certificate_id || `ABC-${certYear}-${user.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-navy-900 text-white py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-serif font-bold">Certificate Preview</h1>
              <p className="text-slate-300 text-sm">{user.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/admin/users/${user.id}`} className="btn-secondary text-sm">
              <User className="w-4 h-4" /> View Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Certificate Info Bar */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-sm">
            <div>
              <p className="text-slate-500">Certificate ID</p>
              <p className="font-mono font-semibold text-navy-900">{certificateId}</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-slate-500">Course</p>
              <p className="font-semibold text-navy-900">{user.course || '—'}</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-slate-500">Completion Date</p>
              <p className="font-semibold text-navy-900">
                {user.completion_date ? new Date(user.completion_date).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric'
                }) : '—'}
              </p>
            </div>
            {user.pata_reg_no && (
              <>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <p className="text-slate-500">PATA Reg No</p>
                  <p className="font-semibold text-navy-900">{user.pata_reg_no}</p>
                </div>
              </>
            )}
          </div>
          <PDFDownloadLink
            document={
              <CertificateDocument
                studentName={user.full_name || 'Student'}
                course={user.course || 'Course'}
                completionDate={user.completion_date || new Date().toISOString()}
                certificateId={certificateId}
                pataRegNo={user.pata_reg_no || undefined}
              />
            }
            fileName={`certificate-${user.full_name?.replace(/\s+/g, '-') || 'student'}.pdf`}
            className="btn-primary"
          >
            {({ loading }) => (
              loading ? (
                <><Loader className="w-4 h-4 animate-spin" /> Preparing...</>
              ) : (
                <><Download className="w-4 h-4" /> Download PDF</>
              )
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="p-4 sm:p-6 flex justify-center">
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-600 font-medium">Certificate Document</span>
            <span className="text-xs text-slate-400">PDF Preview</span>
          </div>
          <div className="h-[600px]">
            <PDFViewer
              showToolbar={false}
              width="100%"
              height="100%"
              className="border-0"
            >
              <CertificateDocument
                studentName={user.full_name || 'Student'}
                course={user.course || 'Course'}
                completionDate={user.completion_date || new Date().toISOString()}
                certificateId={certificateId}
                pataRegNo={user.pata_reg_no || undefined}
              />
            </PDFViewer>
          </div>
        </div>
      </div>
    </div>
  );
}
