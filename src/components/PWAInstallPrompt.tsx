import { useEffect, useState, useCallback } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'abc_pwa_install_dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) { setInstalled(true); return; }

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < DISMISS_DURATION) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => { setInstalled(true); setVisible(false); };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }, 400);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
    handleClose();
  }, [deferredPrompt, handleClose]);

  if (installed || !visible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-50"
      style={{
        animation: closing
          ? 'pwaSlideOut 0.4s ease-in forwards'
          : 'pwaSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div className="relative overflow-hidden bg-white rounded-xl shadow-xl border border-slate-200 w-[158px]">
        {/* Top accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-navy-700 via-navy-500 to-gold-400" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors duration-200 z-10"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Content */}
        <div className="p-3 pt-2.5">
          {/* Icon + title row */}
          <div className="flex items-center gap-2 pr-4">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-navy-100 rounded-lg animate-ping opacity-50" style={{ animationDuration: '2s' }} />
              <div className="relative w-7 h-7 bg-gradient-to-br from-navy-700 to-navy-900 rounded-lg flex items-center justify-center shadow-sm">
                <Smartphone className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <span className="font-serif text-[11px] font-semibold text-navy-900 leading-tight">
              Install ABC App
            </span>
          </div>

          <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
            Add to home screen for quick access.
          </p>

          {/* CTA button */}
          <button
            onClick={handleInstall}
            className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-gradient-to-r from-navy-700 to-navy-800 text-white rounded-lg font-medium text-[10px] hover:from-navy-800 hover:to-navy-900 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md group"
          >
            <Download className="w-3 h-3 group-hover:translate-y-px transition-transform duration-200" />
            <span>Add to Home Screen</span>
          </button>
        </div>

        {/* Shimmer */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
            animation: 'pwaShimmer 3s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}
