'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSignupStore, PlanTier } from '@/stores/signup.store';
import { signupApi } from '@/lib/api/signup.api';
import { PricingCards } from '@/components/marketing/pricing-cards';

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';

export function PlanSelector() {
  const router = useRouter();
  const { account, studio, setPlan, reset } = useSignupStore();
  const [selected, setSelected] = useState<PlanTier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!selected || !account || !studio) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Register the user
      const auth = await signupApi.register({
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        password: account.password,
      });

      // 2. Create the tenant using the returned token
      await signupApi.createTenant(
        {
          name: studio.studioName,
          slug: studio.slug,
          timezone: studio.timezone,
          country: studio.country,
          tier: selected,
        },
        auth.accessToken
      );

      setPlan(selected);
      reset();

      // 3. Redirect to admin dashboard with tokens for auto-login
      const params = new URLSearchParams({
        token: auth.accessToken,
        refresh: auth.refreshToken,
      });
      window.location.href = `${ADMIN_URL}/auth/handoff?${params.toString()}`;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.';
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div>
      <PricingCards onSelect={setSelected} selectedTier={selected ?? undefined} />

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
          {error}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={!selected || loading}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Setting up your studio...
            </>
          ) : (
            `Start free trial${selected ? ` — ${selected === 'BASE' ? 'Starter' : selected === 'MID' ? 'Growth' : 'Elite'}` : ''}`
          )}
        </button>
      </div>

      <p className="text-center text-sm text-slate-500 mt-3">
        14-day free trial &bull; No credit card required &bull; Cancel anytime
      </p>
    </div>
  );
}
