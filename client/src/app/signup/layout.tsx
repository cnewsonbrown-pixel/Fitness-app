import Link from 'next/link';
import { Dumbbell } from 'lucide-react';

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-indigo-50 flex flex-col">
      {/* Simple header */}
      <header className="py-5 px-6">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-lg text-brand-600">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          FitStudio
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 pb-16 pt-8">
        {children}
      </div>

      {/* Footer note */}
      <div className="py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} FitStudio &bull;{' '}
        <Link href="/contact" className="hover:text-slate-600">
          Support
        </Link>{' '}
        &bull;{' '}
        <Link href="#" className="hover:text-slate-600">
          Privacy
        </Link>
      </div>
    </div>
  );
}
