import { Facebook, Youtube, Instagram, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-950 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Aizawl Bible College" className="w-10 h-10 rounded-full object-cover border-2 border-gold-400" />
              <div>
                <h3 className="font-serif font-bold text-white text-lg">Aizawl Bible College</h3>
                <p className="text-xs text-slate-400">Assemblies of God Mizoram District</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              A theological institution dedicated to biblical education and ministry training, equipping servants of God for His kingdom work.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="https://www.facebook.com/people/Aizawl-Bible-College/100072019050045/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://youtube.com/@AizawlBibleCollege" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="https://instagram.com/@AizawlBibleCollege" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://wa.me/918973000000" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-gold-400 transition-colors">About Us</Link></li>
              <li><Link to="/notices" className="hover:text-gold-400 transition-colors">Notice Board</Link></li>
              <li><Link to="/blog" className="hover:text-gold-400 transition-colors">Blog</Link></li>
              <li><Link to="/gallery" className="hover:text-gold-400 transition-colors">Photo Gallery</Link></li>
              <li><Link to="/teachers" className="hover:text-gold-400 transition-colors">Faculty</Link></li>
              <li><Link to="/board" className="hover:text-gold-400 transition-colors">Board of Management</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/apply" className="hover:text-gold-400 transition-colors">Apply Online</Link></li>
              <li><Link to="/academics" className="hover:text-gold-400 transition-colors">Academic Info</Link></li>
              <li><Link to="/prologue" className="hover:text-gold-400 transition-colors">Prologue</Link></li>
              <li><Link to="/doctrine" className="hover:text-gold-400 transition-colors">Doctrine</Link></li>
              <li><Link to="/downloads" className="hover:text-gold-400 transition-colors">Downloads</Link></li>
              <li><Link to="/contact" className="hover:text-gold-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">&copy; {year} Aizawl Bible College. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link to="/refunds" className="hover:text-slate-300 transition-colors">Refunds</Link>
            <Link to="/shipping" className="hover:text-slate-300 transition-colors">Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
