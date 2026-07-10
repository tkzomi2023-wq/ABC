import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WhatsAppButton() {
  return (
    <Link
      to="/forum"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-navy-700 hover:bg-navy-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
      aria-label="Join Public Chat"
    >
      <MessageCircle className="w-7 h-7" />
      <span className="absolute right-full mr-3 px-3 py-1.5 bg-navy-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Public Forum
      </span>
    </Link>
  );
}
