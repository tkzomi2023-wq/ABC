import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PrincipalGreetingModal() {
  const [show, setShow] = useState(false);
  const [greetingImage, setGreetingImage] = useState('/images/PrincipalsGreets.jpg');
  const [principalName, setPrincipalName] = useState('Principal');
  const [principalTitle, setPrincipalTitle] = useState('Aizawl Bible College');

  useEffect(() => {
    const dismissed = sessionStorage.getItem('greeting-dismissed');
    if (dismissed) return;

    supabase
      .from('site_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['principal_greeting_enabled', 'principal_greeting_image', 'principal_greeting_name', 'principal_greeting_title'])
      .then(({ data }) => {
        if (!data) return;
        const settings = Object.fromEntries(data.map((s) => [s.setting_key, s.setting_value]));
        if (settings.principal_greeting_enabled === 'false') return;
        if (settings.principal_greeting_image) setGreetingImage(settings.principal_greeting_image);
        if (settings.principal_greeting_name) setPrincipalName(settings.principal_greeting_name);
        if (settings.principal_greeting_title) setPrincipalTitle(settings.principal_greeting_title);
        setShow(true);
      });
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={() => { setShow(false); sessionStorage.setItem('greeting-dismissed', '1'); }}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <button
            onClick={() => { setShow(false); sessionStorage.setItem('greeting-dismissed', '1'); }}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors"
            aria-label="Close greeting"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>
          <img
            src={greetingImage}
            alt="Principal's Greetings"
            className="w-full rounded-t-xl border-b border-slate-200 dark:border-slate-700"
          />
        </div>
        <div className="p-6 text-center">
          <h2 className="font-serif text-xl font-bold text-navy-950 dark:text-slate-100 mb-1">{principalName}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{principalTitle}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Welcome to Aizawl Bible College. We are delighted to have you visit our portal.
            May God bless you as you explore what He is doing through this institution.
          </p>
          <button
            onClick={() => { setShow(false); sessionStorage.setItem('greeting-dismissed', '1'); }}
            className="mt-4 px-6 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium transition-colors dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-900"
          >
            Thank you
          </button>
        </div>
      </div>
    </div>
  );
}
