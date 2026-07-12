import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, GraduationCap,
  Church, Heart, Users, BookOpen, Languages, FileText, Camera,
  Trash2, Plus, ChevronRight, ChevronLeft, CheckCircle,
  AlertCircle, Send, Eye,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

type SectionKey =
  | 'personal' | 'academic' | 'church' | 'spiritual'
  | 'family' | 'course' | 'languages' | 'statement' | 'review';

const SECTIONS: { key: SectionKey; label: string; icon: typeof User }[] = [
  { key: 'personal', label: 'Personal', icon: User },
  { key: 'academic', label: 'Academic', icon: GraduationCap },
  { key: 'church', label: 'Church', icon: Church },
  { key: 'spiritual', label: 'Spiritual', icon: Heart },
  { key: 'family', label: 'Family', icon: Users },
  { key: 'course', label: 'Course', icon: BookOpen },
  { key: 'languages', label: 'Languages', icon: Languages },
  { key: 'statement', label: 'Statement', icon: FileText },
  { key: 'review', label: 'Review', icon: Eye },
];

const COURSE_OPTIONS = [
  'Bachelor of Theology (B.Th)',
  'Master of Divinity (M.Div)',
  'Diploma in Theology (Dip.Th)',
  'Certificate in Biblical Studies',
];

const APPLYING_FOR_OPTIONS = ['Freshman', 'Transfer', 'Readmission'];
const GENDER_OPTIONS = ['Male', 'Female'];
const MARITAL_OPTIONS = ['Single', 'Married', 'Widowed', 'Divorced'];

type FormData = {
  full_name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  pin_code: string;
  previous_education: string;
  academic_qualifications: string[];
  church_name: string;
  pastor_name: string;
  denomination: string;
  church_involvement: string;
  born_again: string;
  water_baptism_date: string;
  practices_vices: boolean;
  calling_aim: string;
  guardian_name: string;
  annual_income: string;
  parent_occupation: string;
  marital_status: string;
  course_applied: string;
  applying_for: string;
  fee_sponsor: string;
  can_pay_fees: boolean;
  mother_tongue: string;
  other_languages: string;
  statement_of_purpose: string;
};

const EMPTY_FORM: FormData = {
  full_name: '',
  email: '',
  phone: '',
  dob: '',
  gender: '',
  address: '',
  pin_code: '',
  previous_education: '',
  academic_qualifications: [],
  church_name: '',
  pastor_name: '',
  denomination: '',
  church_involvement: '',
  born_again: '',
  water_baptism_date: '',
  practices_vices: false,
  calling_aim: '',
  guardian_name: '',
  annual_income: '',
  parent_occupation: '',
  marital_status: '',
  course_applied: '',
  applying_for: '',
  fee_sponsor: '',
  can_pay_fees: false,
  mother_tongue: '',
  other_languages: '',
  statement_of_purpose: '',
};

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-800 text-navy-900 dark:text-navy-50 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition';
const labelClass = 'block text-sm font-medium text-navy-800 dark:text-navy-200 mb-1.5';

export default function ApplicationForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e1b4b';
  }, [step]);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addQualification() {
    setForm((f) => ({ ...f, academic_qualifications: [...f.academic_qualifications, ''] }));
  }

  function updateQualification(index: number, value: string) {
    setForm((f) => {
      const next = [...f.academic_qualifications];
      next[index] = value;
      return { ...f, academic_qualifications: next };
    });
  }

  function removeQualification(index: number) {
    setForm((f) => ({
      ...f,
      academic_qualifications: f.academic_qualifications.filter((_, i) => i !== index),
    }));
  }

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function getCanvasPos(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getCanvasPos(e);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDrawing() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.full_name.trim()) return 'Full name is required.';
      if (!form.email.trim()) return 'Email is required.';
    }
    return null;
  }

  function nextStep() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, SECTIONS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function prevStep() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.full_name.trim() || !form.email.trim()) {
      setError('Full name and email are required.');
      return;
    }

    setLoading(true);

    let passportPhotoUrl: string | null = null;

    if (photoFile) {
      const ext = photoFile.name.split('.').pop() || 'jpg';
      const path = `applications/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, photoFile, { upsert: false });

      if (uploadError) {
        setError(`Photo upload failed: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path);
      passportPhotoUrl = urlData.publicUrl;
    }

    const { error: insertError } = await supabase.from('applications').insert({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || null,
      dob: form.dob || null,
      gender: form.gender || null,
      address: form.address || null,
      pin_code: form.pin_code || null,
      previous_education: form.previous_education || null,
      academic_qualifications: form.academic_qualifications.filter((q) => q.trim()),
      church_name: form.church_name || null,
      pastor_name: form.pastor_name || null,
      denomination: form.denomination || null,
      church_involvement: form.church_involvement || null,
      born_again: form.born_again || null,
      water_baptism_date: form.water_baptism_date || null,
      practices_vices: form.practices_vices,
      calling_aim: form.calling_aim || null,
      guardian_name: form.guardian_name || null,
      annual_income: form.annual_income || null,
      parent_occupation: form.parent_occupation || null,
      marital_status: form.marital_status || null,
      course_applied: form.course_applied || null,
      applying_for: form.applying_for || null,
      fee_sponsor: form.fee_sponsor || null,
      can_pay_fees: form.can_pay_fees,
      mother_tongue: form.mother_tongue || null,
      other_languages: form.other_languages || null,
      statement: form.statement_of_purpose || null,
      passport_photo_url: passportPhotoUrl,
      signature_data_url: signatureDataUrl,
      status: 'pending',
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-50 dark:bg-navy-950 px-4 py-12">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy-900 dark:text-navy-50 mb-4">
            Application Submitted!
          </h1>
          <p className="text-navy-600 dark:text-navy-300 mb-8">
            Thank you for applying to Aizawl Bible College. We will review your application and contact you soon.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-navy-600 hover:bg-navy-700 text-white font-medium transition"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Submitting your application..." />;
  }

  const currentSection = SECTIONS[step];
  const progress = ((step + 1) / SECTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy-900 dark:text-navy-50 mb-2">
            Application Form
          </h1>
          <p className="text-navy-600 dark:text-navy-300">
            Aizawl Bible College Admission Application
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-navy-700 dark:text-navy-200">
              Step {step + 1} of {SECTIONS.length}: {currentSection.label}
            </span>
            <span className="text-sm text-navy-500 dark:text-navy-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-navy-100 dark:bg-navy-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-navy-600 dark:bg-gold-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="hidden sm:flex items-center justify-between mt-4 overflow-x-auto">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStep(i)}
                  className={`flex flex-col items-center gap-1 px-1 transition ${
                    i === step
                      ? 'text-navy-700 dark:text-gold-400'
                      : i < step
                      ? 'text-navy-500 dark:text-navy-300'
                      : 'text-navy-300 dark:text-navy-600'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition ${
                      i === step
                        ? 'border-navy-600 dark:border-gold-500 bg-navy-600 dark:bg-gold-500 text-white'
                        : i < step
                        ? 'border-navy-400 bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300'
                        : 'border-navy-200 dark:border-navy-700 bg-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs whitespace-nowrap">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-navy-100 dark:border-navy-800 p-6 sm:p-8">
          {step === 0 && (
            <section className="space-y-5">
              <h2 className="text-xl font-serif font-bold text-navy-900 dark:text-navy-50 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-navy-600 dark:text-gold-400" /> Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label htmlFor="full_name" className={labelClass}>Full Name *</label>
                  <input id="full_name" type="text" required value={form.full_name} onChange={(e) => update('full_name', e.target.value)} className={inputClass} placeholder="Your full name" />
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>Email *</label>
                  <input id="email" type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} placeholder="you@example.com" />
                </div>
                <div>
                  <label htmlFor="phone" className={labelClass}>Phone</label>
                  <input id="phone" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inputClass} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label htmlFor="dob" className={labelClass}>Date of Birth</label>
                  <input id="dob" type="date" value={form.dob} onChange={(e) => update('dob', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="gender" className={labelClass}>Gender</label>
                  <select id="gender" value={form.gender} onChange={(e) => update('gender', e.target.value)} className={inputClass}>
                    <option value="">Select...</option>
                    {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className={labelClass}>Address</label>
                  <textarea id="address" rows={2} value={form.address} onChange={(e) => update('address', e.target.value)} className={inputClass} placeholder="Your full address" />
                </div>
                <div>
                  <label htmlFor="pin_code" className={labelClass}>PIN Code</label>
                  <input id="pin_code" type="text" value={form.pin_code} onChange={(e) => update('pin_code', e.target.value)} className={inputClass} placeholder="796001" />
                </div>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="space-y-5">
              <h2 className="text-xl font-serif font-bold text-navy-900 dark:text-navy-50 mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-navy-600 dark:text-gold-400" /> Academic Background
              </h2>
              <div>
                <label htmlFor="previous_education" className={labelClass}>Previous Education</label>
                <input id="previous_education" type="text" value={form.previous_education} onChange={(e) => update('previous_education', e.target.value)} className={inputClass} placeholder="e.g. Higher Secondary, BA, etc." />
              </div>
              <div>
                <label className={labelClass}>Academic Qualifications</label>
                <div className="space-y-3">
                  {form.academic_qualifications.map((q, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={q}
                        onChange={(e) => updateQualification(i, e.target.value)}
                        className={inputClass}
                        placeholder={`Qualification ${i + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeQualification(i)}
                        className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center justify-center transition"
                        aria-label="Remove qualification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addQualification}
                    className="inline-flex items-center gap-2 text-sm text-navy-600 dark:text-gold-400 hover:text-navy-800 dark:hover:text-gold-300 font-medium"
                  >
                    <Plus className="w-4 h-4" /> Add Qualification
                  </button>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-5">
              <h2 className="text-xl font-serif font-bold text-navy-900 dark:text-navy-50 mb-4 flex items-center gap-2">
                <Church className="w-5 h-5 text-navy-600 dark:text-gold-400" /> Church Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="church_name" className={labelClass}>Church Name</label>
                  <input id="church_name" type="text" value={form.church_name} onChange={(e) => update('church_name', e.target.value)} className={inputClass} placeholder="Your church name" />
                </div>
                <div>
                  <label htmlFor="pastor_name" className={labelClass}>Pastor's Name</label>
                  <input id="pastor_name" type="text" value={form.pastor_name} onChange={(e) => update('pastor_name', e.target.value)} className={inputClass} placeholder="Pastor's full name" />
                </div>
                <div>
                  <label htmlFor="denomination" className={labelClass}>Denomination</label>
                  <input id="denomination" type="text" value={form.denomination} onChange={(e) => update('denomination', e.target.value)} className={inputClass} placeholder="e.g. Assemblies of God" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="church_involvement" className={labelClass}>Church Involvement</label>
                  <textarea id="church_involvement" rows={3} value={form.church_involvement} onChange={(e) => update('church_involvement', e.target.value)} className={inputClass} placeholder="Describe your involvement in your church" />
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-5">
              <h2 className="text-xl font-serif font-bold text-navy-900 dark:text-navy-50 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-navy-600 dark:text-gold-400" /> Spiritual Background
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="born_again" className={labelClass}>Born Again Date / Year</label>
                  <input id="born_again" type="text" value={form.born_again} onChange={(e) => update('born_again', e.target.value)} className={inputClass} placeholder="e.g. 2015 or a specific date" />
                </div>
                <div>
                  <label htmlFor="water_baptism_date" className={labelClass}>Water Baptism Date</label>
                  <input id="water_baptism_date" type="date" value={form.water_baptism_date} onChange={(e) => update('water_baptism_date', e.target.value)} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.practices_vices}
                      onChange={(e) => update('practices_vices', e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-navy-300 dark:border-navy-600 text-navy-600 focus:ring-navy-500"
                    />
                    <span className="text-sm text-navy-800 dark:text-navy-200">
                      I acknowledge that I do not practice any vices (smoking, alcohol, drugs, etc.)
                    </span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="calling_aim" className={labelClass}>Calling & Aim</label>
                  <textarea id="calling_aim" rows={3} value={form.calling_aim} onChange={(e) => update('calling_aim', e.target.value)} className={inputClass} placeholder="Describe your calling and aim for ministry" />
                </div>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-5">
              <h2 className="text-xl font-serif font-bold text-navy-900 dark:text-navy-50 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-navy-600 dark:text-gold-400" /> Family Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="guardian_name" className={labelClass}>Guardian / Parent Name</label>
                  <input id="guardian_name" type="text" value={form.guardian_name} onChange={(e) => update('guardian_name', e.target.value)} className={inputClass} placeholder="Guardian's full name" />
                </div>
                <div>
                  <label htmlFor="annual_income" className={labelClass}>Annual Family Income</label>
                  <input id="annual_income" type="text" value={form.annual_income} onChange={(e) => update('annual_income', e.target.value)} className={inputClass} placeholder="e.g. 2,00,000 INR" />
                </div>
                <div>
                  <label htmlFor="parent_occupation" className={labelClass}>Parent's Occupation</label>
                  <input id="parent_occupation" type="text" value={form.parent_occupation} onChange={(e) => update('parent_occupation', e.target.value)} className={inputClass} placeholder="Parent's occupation" />
                </div>
                <div>
                  <label htmlFor="marital_status" className={labelClass}>Marital Status</label>
                  <select id="marital_status" value={form.marital_status} onChange={(e) => update('marital_status', e.target.value)} className={inputClass}>
                    <option value="">Select...</option>
                    {MARITAL_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </section>
          )}

          {step === 5 && (
            <section className="space-y-5">
              <h2 className="text-xl font-serif font-bold text-navy-900 dark:text-navy-50 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-navy-600 dark:text-gold-400" /> Course Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="course_applied" className={labelClass}>Course Applied For</label>
                  <select id="course_applied" value={form.course_applied} onChange={(e) => update('course_applied', e.target.value)} className={inputClass}>
                    <option value="">Select a course...</option>
                    {COURSE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="applying_for" className={labelClass}>Applying For</label>
                  <select id="applying_for" value={form.applying_for} onChange={(e) => update('applying_for', e.target.value)} className={inputClass}>
                    <option value="">Select...</option>
                    {APPLYING_FOR_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="fee_sponsor" className={labelClass}>Fee Sponsor</label>
                  <input id="fee_sponsor" type="text" value={form.fee_sponsor} onChange={(e) => update('fee_sponsor', e.target.value)} className={inputClass} placeholder="Who will sponsor your fees?" />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.can_pay_fees}
                      onChange={(e) => update('can_pay_fees', e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-navy-300 dark:border-navy-600 text-navy-600 focus:ring-navy-500"
                    />
                    <span className="text-sm text-navy-800 dark:text-navy-200">
                      I confirm that I / my sponsor can pay the required fees
                    </span>
                  </label>
                </div>
              </div>
            </section>
          )}

          {step === 6 && (
            <section className="space-y-5">
              <h2 className="text-xl font-serif font-bold text-navy-900 dark:text-navy-50 mb-4 flex items-center gap-2">
                <Languages className="w-5 h-5 text-navy-600 dark:text-gold-400" /> Language Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="mother_tongue" className={labelClass}>Mother Tongue</label>
                  <input id="mother_tongue" type="text" value={form.mother_tongue} onChange={(e) => update('mother_tongue', e.target.value)} className={inputClass} placeholder="e.g. Mizo, Hindi, English" />
                </div>
                <div>
                  <label htmlFor="other_languages" className={labelClass}>Other Languages</label>
                  <input id="other_languages" type="text" value={form.other_languages} onChange={(e) => update('other_languages', e.target.value)} className={inputClass} placeholder="e.g. English, Hindi, Bengali" />
                </div>
              </div>
            </section>
          )}

          {step === 7 && (
            <section className="space-y-5">
              <h2 className="text-xl font-serif font-bold text-navy-900 dark:text-navy-50 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-navy-600 dark:text-gold-400" /> Statement of Purpose
              </h2>
              <div>
                <label htmlFor="statement_of_purpose" className={labelClass}>Statement of Purpose</label>
                <textarea
                  id="statement_of_purpose"
                  rows={8}
                  value={form.statement_of_purpose}
                  onChange={(e) => update('statement_of_purpose', e.target.value)}
                  className={inputClass}
                  placeholder="Write a brief statement about why you want to study at Aizawl Bible College, your ministry goals, and how this training will help you serve God..."
                />
              </div>

              <div className="pt-4 border-t border-navy-100 dark:border-navy-800">
                <label className={labelClass}>Passport Photo</label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-32 h-40 rounded-lg border-2 border-dashed border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Passport preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-navy-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="block w-full text-sm text-navy-600 dark:text-navy-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-navy-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-navy-700"
                    />
                    <p className="mt-2 text-xs text-navy-500 dark:text-navy-400">
                      Upload a recent passport-size photo (JPG/PNG)
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-navy-100 dark:border-navy-800">
                <label className={labelClass}>Signature</label>
                <div className="border-2 border-navy-200 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-800 p-2">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    className="w-full touch-none cursor-crosshair rounded"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                  >
                    <Trash2 className="w-4 h-4" /> Clear Signature
                  </button>
                  <span className="text-xs text-navy-500 dark:text-navy-400">
                    {signatureDataUrl ? 'Signature captured' : 'Draw your signature above'}
                  </span>
                </div>
              </div>
            </section>
          )}

          {step === 8 && (
            <section className="space-y-5">
              <h2 className="text-xl font-serif font-bold text-navy-900 dark:text-navy-50 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-navy-600 dark:text-gold-400" /> Review Your Application
              </h2>
              <div className="space-y-4">
                <ReviewBlock title="Personal" data={{
                  'Full Name': form.full_name,
                  'Email': form.email,
                  'Phone': form.phone,
                  'Date of Birth': form.dob,
                  'Gender': form.gender,
                  'Address': form.address,
                  'PIN Code': form.pin_code,
                }} />
                <ReviewBlock title="Academic" data={{
                  'Previous Education': form.previous_education,
                  'Qualifications': form.academic_qualifications.filter((q) => q.trim()).join(', ') || '—',
                }} />
                <ReviewBlock title="Church" data={{
                  'Church Name': form.church_name,
                  "Pastor's Name": form.pastor_name,
                  'Denomination': form.denomination,
                  'Church Involvement': form.church_involvement,
                }} />
                <ReviewBlock title="Spiritual" data={{
                  'Born Again': form.born_again,
                  'Water Baptism Date': form.water_baptism_date,
                  'Practices Vices': form.practices_vices ? 'Yes' : 'No',
                  'Calling & Aim': form.calling_aim,
                }} />
                <ReviewBlock title="Family" data={{
                  'Guardian Name': form.guardian_name,
                  'Annual Income': form.annual_income,
                  "Parent's Occupation": form.parent_occupation,
                  'Marital Status': form.marital_status,
                }} />
                <ReviewBlock title="Course" data={{
                  'Course Applied': form.course_applied,
                  'Applying For': form.applying_for,
                  'Fee Sponsor': form.fee_sponsor,
                  'Can Pay Fees': form.can_pay_fees ? 'Yes' : 'No',
                }} />
                <ReviewBlock title="Languages" data={{
                  'Mother Tongue': form.mother_tongue,
                  'Other Languages': form.other_languages,
                }} />
                <ReviewBlock title="Statement" data={{
                  'Statement of Purpose': form.statement_of_purpose || '—',
                }} />
                <ReviewBlock title="Uploads" data={{
                  'Passport Photo': photoPreview ? 'Uploaded' : 'Not uploaded',
                  'Signature': signatureDataUrl ? 'Captured' : 'Not captured',
                }} />
              </div>
            </section>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-navy-100 dark:border-navy-800">
            {step > 0 ? (
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-2 py-2.5 px-5 rounded-lg border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 font-medium transition"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
            ) : (
              <span />
            )}

            {step < SECTIONS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 py-2.5 px-5 rounded-lg bg-navy-600 hover:bg-navy-700 text-white font-medium transition"
              >
                Next <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                className="inline-flex items-center gap-2 py-2.5 px-6 rounded-lg bg-gold-600 hover:bg-gold-700 text-white font-medium transition"
              >
                <Send className="w-5 h-5" /> Submit Application
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewBlock({ title, data }: { title: string; data: Record<string, string> }) {
  return (
    <div className="rounded-lg border border-navy-100 dark:border-navy-800 overflow-hidden">
      <div className="bg-navy-50 dark:bg-navy-800 px-4 py-2">
        <h3 className="text-sm font-semibold text-navy-800 dark:text-navy-100">{title}</h3>
      </div>
      <dl className="px-4 py-3 space-y-1.5">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex flex-col sm:flex-row sm:gap-2 text-sm">
            <dt className="font-medium text-navy-600 dark:text-navy-400 sm:w-40 flex-shrink-0">{key}:</dt>
            <dd className="text-navy-900 dark:text-navy-100 break-words">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
