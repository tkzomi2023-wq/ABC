import { FileText, ShieldCheck } from 'lucide-react';

type PrivacySection = {
  title: string;
  paragraphs: string[];
};

const SECTIONS: PrivacySection[] = [
  {
    title: '1. Introduction',
    paragraphs: [
      'Aizawl Bible College ("we", "us", or "our") is committed to protecting the privacy of visitors to our website and users of our services. This Privacy Policy explains how we collect, use, and safeguard your personal information.',
      'By using our website, you consent to the collection and use of your information as described in this policy.',
    ],
  },
  {
    title: '2. Information We Collect',
    paragraphs: [
      'We may collect the following types of personal information when you interact with our website:',
      'Account information: name, email address, phone number, and other details you provide when registering for an account or submitting an application.',
      'Application information: personal, academic, church, and family details provided in the application form.',
      'Contact information: name, email, and message content submitted through our contact form.',
      'Usage data: information about how you access and use the website, including IP address, browser type, and pages visited.',
    ],
  },
  {
    title: '3. How We Use Your Information',
    paragraphs: [
      'We use the information we collect for the following purposes:',
      'To process and review applications for admission to the college.',
      'To communicate with you regarding your application, account, or inquiries.',
      'To provide and improve our services, courses, and website features.',
      'To send important notices, updates, and academic information.',
      'To comply with legal obligations and protect the rights and safety of the college and its community.',
    ],
  },
  {
    title: '4. How We Share Your Information',
    paragraphs: [
      'We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:',
      'With faculty and staff members who need the information to process your application or provide academic services.',
      'With third-party service providers who perform services on our behalf, such as hosting and analytics providers, under appropriate confidentiality agreements.',
      'When required by law, court order, or government regulation, or to protect the rights, property, or safety of the college or others.',
    ],
  },
  {
    title: '5. Data Security',
    paragraphs: [
      'We implement appropriate technical, administrative, and physical safeguards designed to protect your personal information from unauthorized access, disclosure, alteration, or destruction.',
      'However, no method of transmission over the Internet or electronic storage is completely secure. While we strive to protect your information, we cannot guarantee absolute security.',
    ],
  },
  {
    title: '6. Cookies',
    paragraphs: [
      'Our website may use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and remember your preferences. You can choose to disable cookies through your browser settings, though some features of the site may not function properly without them.',
    ],
  },
  {
    title: '7. Your Rights',
    paragraphs: [
      'You have the right to access, update, or correct the personal information we hold about you. You may also request that we delete your personal information, subject to certain legal and academic record-keeping obligations.',
      'To exercise any of these rights, please contact us using the information provided at the end of this policy.',
    ],
  },
  {
    title: '8. Children\'s Privacy',
    paragraphs: [
      'Our website and services are intended for individuals who are at least 18 years of age or who have parental consent. We do not knowingly collect personal information from children under 18 without parental consent.',
    ],
  },
  {
    title: '9. Changes to This Privacy Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically to stay informed about how we protect your information.',
    ],
  },
  {
    title: '10. Contact Us',
    paragraphs: [
      'If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at info@aizawlbiblecollege.edu.in or by mail at Aizawl Bible College, Aizawl, Mizoram 796001, India.',
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950">
      <section className="bg-navy-800 dark:bg-navy-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <ShieldCheck className="w-12 h-12 text-gold-400 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-4">Privacy Policy</h1>
          <p className="text-navy-100 dark:text-navy-300 text-lg">
            How we collect, use, and protect your personal information
          </p>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-navy-100 dark:border-navy-800 p-6 sm:p-10">
          <div className="flex items-center gap-2 text-sm text-navy-500 dark:text-navy-400 mb-8 pb-6 border-b border-navy-100 dark:border-navy-800">
            <FileText className="w-4 h-4" />
            <span>Last updated: January 2025</span>
          </div>

          <div className="space-y-10">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-serif font-bold text-navy-900 dark:text-navy-50 mb-4">
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {section.paragraphs.map((para, i) => (
                    <p key={i} className="text-navy-700 dark:text-navy-200 leading-relaxed text-sm sm:text-base">
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
