import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const phone = '918973000000';
  const message = encodeURIComponent("Hello, I'd like to know more about Aizawl Bible College.");

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 group"
    >
      <MessageCircle className="w-7 h-7 text-white" />
      <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20 group-hover:opacity-0 transition-opacity" />
    </a>
  );
}
