import { Link } from 'react-router-dom';
import { MailCheck, LogIn } from 'lucide-react';

export default function EmailConfirmation() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-50 dark:bg-navy-950 px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-navy-600 text-gold-400 mb-6">
          <MailCheck className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-navy-900 dark:text-navy-50 mb-4">
          Check Your Email
        </h1>
        <p className="text-navy-600 dark:text-navy-300 mb-2">
          We&apos;ve sent a confirmation link to your email address.
        </p>
        <p className="text-sm text-navy-500 dark:text-navy-400 mb-8">
          Please click the link in the email to verify your account, then sign in below.
        </p>

        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-navy-600 hover:bg-navy-700 text-white font-medium transition"
        >
          <LogIn className="w-5 h-5" />
          Go to Login
        </Link>
      </div>
    </div>
  );
}
