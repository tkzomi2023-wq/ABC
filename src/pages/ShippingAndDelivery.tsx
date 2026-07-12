import { FileText, Truck, Download, Monitor, Clock, Mail } from 'lucide-react';

type PolicySection = {
  title: string;
  paragraphs: string[];
};

const SECTIONS: PolicySection[] = [
  {
    title: '1. Overview',
    paragraphs: [
      'Aizawl Bible College offers a range of digital products including downloadable study materials, e-books, recorded lectures, and other electronic resources. This Shipping and Delivery Policy explains how these digital products are delivered to you.',
      'Since all our products are digital, there are no physical goods shipped and no shipping charges applied.',
    ],
  },
  {
    title: '2. Digital Product Delivery',
    paragraphs: [
      'Upon successful completion of your payment, digital products will be made available to you immediately through your account on our website or via a download link sent to your registered email address.',
      'Most digital products are delivered instantly. In some cases, delivery may take up to 24 hours due to processing or technical verification. If you do not receive your digital product within 24 hours, please contact us.',
    ],
  },
  {
    title: '3. Accessing Your Downloads',
    paragraphs: [
      'You can access your purchased digital products in the following ways:',
      'Through your account dashboard on the website, where all purchased and available downloads are listed.',
      'Through a direct download link sent to your email address at the time of purchase.',
      'Download links are valid for 30 days from the date of purchase. Please download and save your files before the link expires.',
    ],
  },
  {
    title: '4. System Requirements',
    paragraphs: [
      'To access and use our digital products, you will need:',
      'A device (computer, tablet, or smartphone) with an internet connection.',
      'A modern web browser such as Chrome, Firefox, Safari, or Edge.',
      'Appropriate software to open the downloaded files, such as a PDF reader for PDF documents or a media player for video and audio recordings.',
    ],
  },
  {
    title: '5. Download Limits',
    paragraphs: [
      'Unless otherwise specified, each digital product may be downloaded up to 5 times per purchase. This limit helps us manage server resources and prevent unauthorized distribution.',
      'If you experience issues with your downloads or need additional download attempts, please contact us and we will assist you.',
    ],
  },
  {
    title: '6. Technical Issues',
    paragraphs: [
      'If you encounter technical difficulties while downloading or accessing a digital product, please contact us at info@aizawlbiblecollege.edu.in with details of the issue, your purchase receipt, and your account information. We will provide support and, if necessary, issue a replacement download link.',
    ],
  },
  {
    title: '7. No Physical Shipping',
    paragraphs: [
      'Aizawl Bible College does not ship physical products. All items available for purchase on our website are delivered electronically. There are no shipping fees, handling charges, or delivery delays associated with physical transit.',
    ],
  },
  {
    title: '8. Changes to This Policy',
    paragraphs: [
      'We reserve the right to update or modify this Shipping and Delivery Policy at any time. Any changes will be posted on this page with an updated revision date.',
    ],
  },
  {
    title: '9. Contact Us',
    paragraphs: [
      'If you have any questions about this policy or need assistance with a digital product, please contact us at info@aizawlbiblecollege.edu.in or by mail at Aizawl Bible College, Aizawl, Mizoram 796001, India.',
    ],
  },
];

export default function ShippingAndDelivery() {
  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950">
      <section className="bg-navy-800 dark:bg-navy-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Truck className="w-12 h-12 text-gold-400 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-4">Shipping and Delivery</h1>
          <p className="text-navy-100 dark:text-navy-300 text-lg">
            Information about delivery of our digital products
          </p>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-navy-100 dark:border-navy-800 p-6 sm:p-10">
          <div className="flex items-center gap-2 text-sm text-navy-500 dark:text-navy-400 mb-8 pb-6 border-b border-navy-100 dark:border-navy-800">
            <FileText className="w-4 h-4" />
            <span>Last updated: January 2025</span>
          </div>

          <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-navy-50 dark:bg-navy-800">
              <Download className="w-8 h-8 text-navy-600 dark:text-gold-400 mb-2" />
              <h3 className="text-sm font-semibold text-navy-900 dark:text-navy-50">Instant Access</h3>
              <p className="text-xs text-navy-600 dark:text-navy-300 mt-1">Download immediately after purchase</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-navy-50 dark:bg-navy-800">
              <Monitor className="w-8 h-8 text-navy-600 dark:text-gold-400 mb-2" />
              <h3 className="text-sm font-semibold text-navy-900 dark:text-navy-50">Digital Only</h3>
              <p className="text-xs text-navy-600 dark:text-navy-300 mt-1">No physical items shipped</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-navy-50 dark:bg-navy-800">
              <Clock className="w-8 h-8 text-navy-600 dark:text-gold-400 mb-2" />
              <h3 className="text-sm font-semibold text-navy-900 dark:text-navy-50">30-Day Window</h3>
              <p className="text-xs text-navy-600 dark:text-navy-300 mt-1">Links valid for 30 days</p>
            </div>
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

          <div className="mt-10 pt-6 border-t border-navy-100 dark:border-navy-800">
            <div className="flex items-center gap-2 text-sm text-navy-600 dark:text-navy-300">
              <Mail className="w-4 h-4" />
              <span>Need help? Contact us at info@aizawlbiblecollege.edu.in</span>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
