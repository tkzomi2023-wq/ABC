import { FileText, RotateCcw } from 'lucide-react';

type PolicySection = {
  title: string;
  paragraphs: string[];
};

const SECTIONS: PolicySection[] = [
  {
    title: '1. Overview',
    paragraphs: [
      'This Cancellation and Refund Policy outlines the terms under which cancellations and refunds are processed for payments made to Aizawl Bible College, including tuition fees, application fees, and digital product purchases.',
      'By making a payment to the college, you agree to the terms set out in this policy.',
    ],
  },
  {
    title: '2. Application Fee',
    paragraphs: [
      'The application fee submitted with your admission application is non-refundable under all circumstances, as it covers the administrative cost of processing and reviewing your application.',
      'Submission of an application does not guarantee admission. The fee is charged regardless of the outcome of the application review.',
    ],
  },
  {
    title: '3. Tuition Fee Cancellation',
    paragraphs: [
      'If you wish to cancel your enrollment after paying tuition fees, the following refund schedule applies:',
      'Cancellation before the start of the academic term: 90% of the tuition fee will be refunded.',
      'Cancellation within the first 14 days of the term: 50% of the tuition fee will be refunded.',
      'Cancellation after 14 days from the start of the term: No refund will be issued.',
    ],
  },
  {
    title: '4. Digital Product Purchases',
    paragraphs: [
      'Due to the nature of digital products such as downloadable study materials, e-books, and course recordings, all sales of digital products are final and non-refundable once the download link has been accessed or the content has been delivered.',
      'If you experience a technical issue that prevents you from accessing a purchased digital product, please contact us within 7 days of purchase for assistance or a replacement.',
    ],
  },
  {
    title: '5. Refund Processing',
    paragraphs: [
      'Approved refunds will be processed back to the original payment method used for the transaction. Refund processing times may vary depending on your bank or payment provider, typically taking 5 to 10 business days.',
      'Any refund will be issued in the same currency as the original payment and may be subject to exchange rate fluctuations.',
    ],
  },
  {
    title: '6. Non-Refundable Items',
    paragraphs: [
      'The following fees and charges are non-refundable:',
      'Application processing fees.',
      'Examination fees once the exam period has begun.',
      'Library or laboratory fines and penalties.',
      'Graduation and certificate fees once the certificate has been issued.',
    ],
  },
  {
    title: '7. How to Request a Cancellation or Refund',
    paragraphs: [
      'To request a cancellation or refund, please contact the college office in writing at info@aizawlbiblecollege.edu.in with your full name, student ID or application number, payment receipt details, and the reason for your request.',
      'All refund requests will be reviewed and processed within 10 business days of receipt.',
    ],
  },
  {
    title: '8. Changes to This Policy',
    paragraphs: [
      'We reserve the right to update or modify this Cancellation and Refund Policy at any time. Any changes will be posted on this page with an updated revision date.',
    ],
  },
  {
    title: '9. Contact Us',
    paragraphs: [
      'If you have any questions about this policy, please contact us at info@aizawlbiblecollege.edu.in or by mail at Aizawl Bible College, Aizawl, Mizoram 796001, India.',
    ],
  },
];

export default function CancellationAndRefunds() {
  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950">
      <section className="bg-navy-800 dark:bg-navy-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <RotateCcw className="w-12 h-12 text-gold-400 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-4">
            Cancellation and Refunds
          </h1>
          <p className="text-navy-100 dark:text-navy-300 text-lg">
            Our policy on cancellations, refunds, and returns
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
