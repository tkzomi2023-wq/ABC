import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, Text, View, StyleSheet, PDFViewer, pdf } from '@react-pdf/renderer';
import { Download, ArrowLeft, CircleAlert as AlertCircle } from 'lucide-react';
import { supabase, Profile } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 60,
    alignItems: 'center',
    fontFamily: 'Helvetica',
  },
  border: {
    position: 'absolute',
    top: 20,
    bottom: 20,
    left: 20,
    right: 20,
    borderWidth: 3,
    borderColor: '#d97706',
    borderStyle: 'solid',
  },
  innerBorder: {
    position: 'absolute',
    top: 28,
    bottom: 28,
    left: 28,
    right: 28,
    borderWidth: 1,
    borderColor: '#4338ca',
    borderStyle: 'solid',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: '#4338ca',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 28,
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  collegeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#312e81',
    marginBottom: 4,
  },
  collegeSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#d97706',
    marginBottom: 30,
    textDecoration: 'underline',
  },
  bodyText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 1.8,
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#312e81',
    marginVertical: 16,
  },
  courseText: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 30,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%',
    marginBottom: 40,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 40,
  },
  signatureBlock: {
    alignItems: 'center',
  },
  signatureLine: {
    width: 200,
    borderWidth: 1,
    borderColor: '#374151',
    borderStyle: 'solid',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 12,
    color: '#374151',
    fontWeight: 'bold',
  },
  signatureSubLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
});

type CertificateData = {
  studentName: string;
  course: string;
  completionDate: string;
  certificateId: string;
};

function CertificateDocument({ data }: { data: CertificateData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <View style={pdfStyles.border} />
        <View style={pdfStyles.innerBorder} />

        <View style={pdfStyles.logoPlaceholder}>
          <Text style={pdfStyles.logoText}>ABC</Text>
        </View>

        <Text style={pdfStyles.collegeName}>Aizawl Bible College</Text>
        <Text style={pdfStyles.collegeSubtitle}>Aizawl, Mizoram, India</Text>

        <Text style={pdfStyles.title}>Certificate of Completion</Text>

        <Text style={pdfStyles.bodyText}>This is to certify that</Text>
        <Text style={pdfStyles.studentName}>{data.studentName}</Text>
        <Text style={pdfStyles.bodyText}>has successfully completed the course of study</Text>
        <Text style={pdfStyles.courseText}>{data.course}</Text>

        <View style={pdfStyles.detailsRow}>
          <View style={pdfStyles.detailItem}>
            <Text style={pdfStyles.detailLabel}>Date of Completion</Text>
            <Text style={pdfStyles.detailValue}>{data.completionDate}</Text>
          </View>
          <View style={pdfStyles.detailItem}>
            <Text style={pdfStyles.detailLabel}>Certificate ID</Text>
            <Text style={pdfStyles.detailValue}>{data.certificateId}</Text>
          </View>
        </View>

        <View style={pdfStyles.signatureSection}>
          <View style={pdfStyles.signatureBlock}>
            <View style={pdfStyles.signatureLine} />
            <Text style={pdfStyles.signatureLabel}>Principal</Text>
            <Text style={pdfStyles.signatureSubLabel}>Aizawl Bible College</Text>
          </View>
          <View style={pdfStyles.signatureBlock}>
            <View style={pdfStyles.signatureLine} />
            <Text style={pdfStyles.signatureLabel}>Academic Office</Text>
            <Text style={pdfStyles.signatureSubLabel}>Registrar</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function CertificatePreview() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError('No user ID provided.');
      setLoading(false);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        setError(error.message);
      } else if (!data) {
        setError('User profile not found.');
      } else {
        setProfile(data as Profile);
      }
      setLoading(false);
    })();
  }, [userId]);

  async function handleDownload() {
    if (!profile) return;
    const data: CertificateData = {
      studentName: profile.full_name || 'Unknown',
      course: profile.course || 'Theological Studies',
      completionDate: formatDate(profile.completion_date),
      certificateId: profile.certificate_id || `ABC-${profile.id.slice(0, 8)}`,
    };
    const blob = await pdf(<CertificateDocument data={data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificate-${profile.full_name?.replace(/\s+/g, '-') || 'student'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <LoadingSpinner message="Loading certificate..." />;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-50 dark:bg-navy-950 px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-navy-900 dark:text-navy-50 mb-2">
            Error
          </h1>
          <p className="text-navy-600 dark:text-navy-300 mb-6">{error || 'Unable to load certificate.'}</p>
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 py-2.5 px-5 rounded-lg bg-navy-600 hover:bg-navy-700 text-white font-medium transition"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const certificateData: CertificateData = {
    studentName: profile.full_name || 'Unknown',
    course: profile.course || 'Theological Studies',
    completionDate: formatDate(profile.completion_date),
    certificateId: profile.certificate_id || `ABC-${profile.id.slice(0, 8)}`,
  };

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-2 text-sm text-navy-600 dark:text-navy-300 hover:text-navy-800 dark:hover:text-navy-100 mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy-900 dark:text-navy-50">
              Certificate Preview
            </h1>
            <p className="text-sm text-navy-600 dark:text-navy-300 mt-1">
              {profile.full_name} — {profile.email}
            </p>
          </div>
          <button
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg bg-gold-600 hover:bg-gold-700 text-white font-medium transition"
          >
            <Download className="w-5 h-5" /> Download PDF
          </button>
        </div>

        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-navy-100 dark:border-navy-800 p-2 sm:p-4">
          <div className="w-full h-[600px] sm:h-[700px]">
            <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
              <CertificateDocument data={certificateData} />
            </PDFViewer>
          </div>
        </div>
      </div>
    </div>
  );
}
