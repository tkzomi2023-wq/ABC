import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = sessionStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!showPrompt || !deferredPrompt) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-install-dismissed', '1');
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-xs animate-in slide-in-from-bottom duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-navy-900 dark:bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-white dark:text-slate-900" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">Install App</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add Aizawl Bible College to your home screen for quick access.</p>
            <div className="flex items-center gap-2 mt-3">
              <button onClick={handleInstall} className="px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-medium transition-colors dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-900">
                Install
              </button>
              <button onClick={handleDismiss} className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium transition-colors">
                Not now
              </button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
