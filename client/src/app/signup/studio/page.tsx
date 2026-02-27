'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StepIndicator } from '@/components/signup/step-indicator';
import { StudioForm } from '@/components/signup/studio-form';
import { useSignupStore } from '@/stores/signup.store';

export default function SignupStep2Page() {
  const router = useRouter();
  const account = useSignupStore((s) => s.account);

  // Guard: must complete step 1 first
  useEffect(() => {
    if (!account) {
      router.replace('/signup');
    }
  }, [account, router]);

  if (!account) return null;

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <StepIndicator currentStep={2} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1.5">
            Tell us about your studio
          </h1>
          <p className="text-slate-600 text-sm">
            This sets up your unique FitStudio workspace.
          </p>
        </div>

        <StudioForm />

        <button
          onClick={() => router.push('/signup')}
          className="w-full text-center mt-4 text-sm text-slate-500 hover:text-slate-700"
        >
          &larr; Back to account details
        </button>
      </div>
    </div>
  );
}
