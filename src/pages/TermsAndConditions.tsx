import { FileText, Scale } from 'lucide-react';

type LegalSection = {
  title: string;
  paragraphs: string[];
};

const SECTIONS: LegalSection[] = [
  {
    title: '1. Acceptance of Terms',
    paragraphs: [
      'By accessing and using the Aizawl Bible College website (the "Site"), you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Site.',
      'These terms apply to all visitors, users, and others who access or use the Site, whether you are a registered student, faculty member, or general visitor.',
    ],
  },
  {
    title: '2. Use of the Site',
    paragraphs: [
      'You agree to use the Site only for lawful purposes and in a manner that does not infringe the rights of, restrict, or inhibit anyone else\'s use and enjoyment of the Site.',
      'Prohibited behavior includes harassing or causing distress or inconvenience to any other user, transmitting obscene or offensive content, or disrupting the normal flow of dialogue within the Site.',
      'You agree not to attempt to gain unauthorized access to any portion of the Site, any server on which the Site is stored, or any server or computer connected to the Site.',
    ],
  },
  {
    title: '3. Intellectual Property',
    paragraphs: [
      'The content, organization, graphics, design, compilation, and other matters related to the Site, including all software used on the Site, are the property of Aizawl Bible College unless otherwise indicated.',
      'You may not copy, distribute, republish, download, or transmit any material from the Site without our prior written consent, except where indicated or permitted under applicable law.',
    ],
  },
  {
    title: '4. User Accounts',
    paragraphs: [
      'When you create an account on the Site, you are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.',
      'You agree to immediately notify us of any unauthorized use of your account or any other breach of security. We will not be liable for any loss or damage arising from your failure to comply with this obligation.',
    ],
  },
  {
    title: '5. Applications and Admissions',
    paragraphs: [
      'Submission of an application through the Site does not guarantee admission to Aizawl Bible College. All applications are subject to review and approval by the admissions committee.',
      'You agree to provide accurate, complete, and current information in your application. Any false or misleading information may result in the rejection of your application or dismissal from the college.',
    ],
  },
  {
    title: '6. Limitation of Liability',
    paragraphs: [
      'The Site is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied. We do not warrant that the Site will be uninterrupted, secure, or error-free.',
      'To the fullest extent permitted by law, Aizawl Bible College shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of or inability to use the Site.',
    ],
  },
  {
    title: '7. Third-Party Links',
    paragraphs: [
      'The Site may contain links to third-party websites or services that are not owned or controlled by Aizawl Bible College. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites.',
    ],
  },
  {
    title: '8. Changes to These Terms',
    paragraphs: [
      'We reserve the right to revise these Terms and Conditions at any time. Updated terms will be posted on this page with a revised date. Your continued use of the Site after any changes constitutes acceptance of the new terms.',
    ],
  },
  {
    title: '9. Contact Us',
    paragraphs: [
      'If you have any questions about these Terms and Conditions, please contact us at info@aizawlbiblecollege.edu.in or by mail at Aizawl Bible College, Aizawl, Mizoram 796001, India.',
    ],
  },
];

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950">
      <section className="bg-navy-800 dark:bg-navy-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Scale className="w-12 h-12 text-gold-400 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-4">Terms and Conditions</h1>
          <p className="text-navy-100 dark:text-navy-300 text-lg">
            Please read these terms carefully before using our website
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
