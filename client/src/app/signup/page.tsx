import Link from 'next/link';
import { StepIndicator } from '@/components/signup/step-indicator';
import { AccountForm } from '@/components/signup/account-form';

export const metadata = {
  title: 'Create your FitStudio account',
};

export default function SignupStep1Page() {
  return (
    <div className="w-full max-w-md">
      {/* Step indicator */}
      <div className="mb-8">
        <StepIndicator currentStep={1} />
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1.5">Create your account</h1>
          <p className="text-slate-600 text-sm">
            Start your 14-day free trial. No credit card required.
          </p>
        </div>

        <AccountForm />

        <p className="text-sm text-center text-slate-500 mt-5">
          Already have an account?{' '}
          <Link
            href={process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'}
            className="text-brand-600 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
