'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StepIndicator } from '@/components/signup/step-indicator';
import { PlanSelector } from '@/components/signup/plan-selector';
import { useSignupStore } from '@/stores/signup.store';

export default function SignupStep3Page() {
  const router = useRouter();
  const account = useSignupStore((s) => s.account);
  const studio = useSignupStore((s) => s.studio);

  useEffect(() => {
    if (!account) {
      router.replace('/signup');
    } else if (!studio) {
      router.replace('/signup/studio');
    }
  }, [account, studio, router]);

  if (!account || !studio) return null;

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-8 flex justify-center">
        <StepIndicator currentStep={3} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1.5">
            Choose your plan
          </h1>
          <p className="text-slate-600 text-sm">
            All plans include a 14-day free trial. You can change your plan anytime.
          </p>
        </div>

        <PlanSelector />

        <button
          onClick={() => router.push('/signup/studio')}
          className="w-full text-center mt-6 text-sm text-slate-500 hover:text-slate-700"
        >
          &larr; Back to studio details
        </button>
      </div>
    </div>
  );
}
