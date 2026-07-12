import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://btgdrgabotjenoruzncr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'faculty' | 'student' | 'standard' | 'finance';
  student_year: '1st_year' | '2nd_year' | 'final_year' | null;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  bio: string | null;
  course: string | null;
  completion_date: string | null;
  certificate_url: string | null;
  graduated: boolean;
  admission_date: string | null;
  qualification: string | null;
  subject_in_charge: string | null;
  pata_reg_no: string | null;
  position: string | null;
  profile_theme: string;
  display_order: number;
  is_banned: boolean;
  show_transactions_public: boolean;
  certificate_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Notice = {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  is_published: boolean;
  image_url: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
};

export type Download = {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_size_kb: number | null;
  category: string;
  semester: string | null;
  is_active: boolean;
  uploaded_by: string | null;
  created_at: string;
};

export type Photo = {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  album: string;
  link_url: string | null;
  is_published: boolean;
  uploaded_by: string | null;
  created_at: string;
};

export type Teacher = {
  id: string;
  full_name: string;
  photo_url: string | null;
  subject_in_charge: string | null;
  qualification: string | null;
  bio: string | null;
  is_current: boolean;
  joined_at: string | null;
  left_at: string | null;
  display_order: number;
  address: string | null;
  created_at: string;
  updated_at: string;
};

export type BoardMember = {
  id: string;
  name: string;
  designation: string | null;
  photo_url: string | null;
  display_order: number;
  created_at: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  author_name: string;
  author_id: string | null;
  featured_image_url: string | null;
  supporting_image_url: string | null;
  second_image_url: string | null;
  intro_text: string | null;
  body_text: string | null;
  conclusion_text: string | null;
  takeaway: string | null;
  youtube_url: string | null;
  hashtags: string[];
  is_published: boolean;
  published_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
};

export type SiteSetting = {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  submitted_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  payment_type: string;
  payment_method: string;
  payment_date: string;
  season: string;
  reference_no: string | null;
  receipt_number: string | null;
  notes: string | null;
  recorded_by: string | null;
  status: string;
  gateway: string | null;
  gateway_order_id: string | null;
  gateway_payment_id: string | null;
  gateway_signature: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  sent_by: string | null;
  created_at: string;
};

export type ForumPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  author_id: string;
  reply_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
};

export type ForumReply = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type Application = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  address: string | null;
  applying_for: string | null;
  previous_education: string | null;
  church_name: string | null;
  pastor_name: string | null;
  statement: string | null;
  status: string;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  passport_photo_url: string | null;
  signature_data_url: string | null;
  course_applied: string | null;
  pin_code: string | null;
  mother_tongue: string | null;
  other_languages: string | null;
  guardian_name: string | null;
  annual_income: string | null;
  parent_occupation: string | null;
  marital_status: string | null;
  born_again: string | null;
  water_baptism_date: string | null;
  practices_vices: boolean | null;
  church_involvement: string | null;
  calling_aim: string | null;
  fee_sponsor: string | null;
  can_pay_fees: boolean | null;
  denomination: string | null;
  academic_qualifications: string[];
};

export type PaymentRequest = {
  id: string;
  student_id: string;
  title: string;
  description: string | null;
  amount: number;
  payment_type: string;
  status: string;
  due_date: string | null;
  requested_by: string | null;
  created_at: string;
  updated_at: string;
};
