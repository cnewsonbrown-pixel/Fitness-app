'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Dumbbell } from 'lucide-react';

const ACCESS_TOKEN_KEY = 'fitstudio_access_token';
const REFRESH_TOKEN_KEY = 'fitstudio_refresh_token';

function HandoffInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');

    if (token && refresh) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
      router.replace('/');
    } else {
      // No valid tokens — send to login
      router.replace('/login');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
        <Dumbbell className="w-7 h-7 text-white" />
      </div>
      <p className="text-slate-500 text-sm">Setting up your studio...</p>
    </div>
  );
}

export default function HandoffPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      }
    >
      <HandoffInner />
    </Suspense>
  );
}
