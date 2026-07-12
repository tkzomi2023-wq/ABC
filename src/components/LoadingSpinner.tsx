import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-navy-500" />
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}
