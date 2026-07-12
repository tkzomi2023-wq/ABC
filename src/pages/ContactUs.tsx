import { useState, FormEvent } from 'react';
import { Mail, User, Tag, MessageSquare, Send, CircleCheck as CheckCircle, MapPin, Phone, Clock, Facebook, Youtube } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ContactUs() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const { error } = await supabase.from('contact_messages').insert({
      name,
      email,
      subject,
      message,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950">
      <section className="bg-navy-800 dark:bg-navy-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">Contact Us</h1>
          <p className="text-navy-100 dark:text-navy-300">
            We&apos;d love to hear from you. Reach out with any questions or inquiries.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-navy-100 dark:border-navy-800 p-6 sm:p-8">
          <h2 className="text-2xl font-serif font-bold text-navy-900 dark:text-navy-50 mb-6">
            Send Us a Message
          </h2>

          {success && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">
                Thank you! Your message has been sent. We&apos;ll get back to you soon.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-navy-800 dark:text-navy-200 mb-2">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-800 text-navy-900 dark:text-navy-50 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy-800 dark:text-navy-200 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-800 text-navy-900 dark:text-navy-50 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-navy-800 dark:text-navy-200 mb-2">
                Subject
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
                <input
                  id="subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What is this about?"
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-800 text-navy-900 dark:text-navy-50 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-navy-800 dark:text-navy-200 mb-2">
                Message
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-navy-400" />
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your message..."
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-800 text-navy-900 dark:text-navy-50 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition resize-y"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-navy-600 hover:bg-navy-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium transition"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-navy-100 dark:border-navy-800 p-6 sm:p-8">
            <h2 className="text-2xl font-serif font-bold text-navy-900 dark:text-navy-50 mb-6">
              College Information
            </h2>
            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-navy-100 dark:bg-navy-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-navy-600 dark:text-navy-300" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy-900 dark:text-navy-50">Address</h3>
                  <p className="text-sm text-navy-600 dark:text-navy-300 mt-1">
                    Aizawl Bible College<br />
                    Aizawl, Mizoram 796001<br />
                    India
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-navy-100 dark:bg-navy-800 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-navy-600 dark:text-navy-300" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy-900 dark:text-navy-50">Phone</h3>
                  <p className="text-sm text-navy-600 dark:text-navy-300 mt-1">
                    +91 389 234 5678
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-navy-100 dark:bg-navy-800 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-navy-600 dark:text-navy-300" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy-900 dark:text-navy-50">Email</h3>
                  <p className="text-sm text-navy-600 dark:text-navy-300 mt-1">
                    info@aizawlbiblecollege.edu.in
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-navy-100 dark:bg-navy-800 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-navy-600 dark:text-navy-300" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy-900 dark:text-navy-50">Office Hours</h3>
                  <p className="text-sm text-navy-600 dark:text-navy-300 mt-1">
                    Monday – Friday: 9:00 AM – 4:00 PM<br />
                    Saturday – Sunday: Closed
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-navy-100 dark:border-navy-800 p-6 sm:p-8">
            <h2 className="text-2xl font-serif font-bold text-navy-900 dark:text-navy-50 mb-6">
              Connect With Us
            </h2>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-12 h-12 rounded-lg bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300 hover:bg-navy-600 hover:text-white dark:hover:bg-navy-600 dark:hover:text-white transition"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-12 h-12 rounded-lg bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300 hover:bg-navy-600 hover:text-white dark:hover:bg-navy-600 dark:hover:text-white transition"
                aria-label="YouTube"
              >
                <Youtube className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
