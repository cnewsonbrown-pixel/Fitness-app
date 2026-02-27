'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useSignupStore, StudioData } from '@/stores/signup.store';
import { signupApi } from '@/lib/api/signup.api';
import { useEffect } from 'react';

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Dubai',
];

const countries = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Singapore',
  'United Arab Emirates',
  'Japan',
  'Other',
];

const schema = z.object({
  studioName: z.string().min(2, 'Studio name must be at least 2 characters'),
  slug: z
    .string()
    .min(3, 'URL must be at least 3 characters')
    .max(40, 'URL must be 40 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  timezone: z.string().min(1, 'Timezone is required'),
  country: z.string().min(1, 'Country is required'),
});

type FormData = z.infer<typeof schema>;

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function StudioForm() {
  const router = useRouter();
  const setStudio = useSignupStore((s) => s.setStudio);
  const existing = useSignupStore((s) => s.studio);

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [slugValue, setSlugValue] = useState(existing?.slug ?? '');
  const [debouncedSlug] = useDebounce(slugValue, 500);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: existing ?? { timezone: 'America/New_York', country: 'United States' },
  });

  const studioName = watch('studioName');

  // Auto-generate slug from studio name
  useEffect(() => {
    if (studioName && !existing?.slug) {
      const generated = slugify(studioName);
      setValue('slug', generated);
      setSlugValue(generated);
    }
  }, [studioName, setValue, existing?.slug]);

  // Check slug availability
  useEffect(() => {
    if (!debouncedSlug || debouncedSlug.length < 3) {
      setSlugStatus('idle');
      return;
    }
    setSlugStatus('checking');
    signupApi
      .checkSlug(debouncedSlug)
      .then((res) => setSlugStatus(res.available ? 'available' : 'taken'))
      .catch(() => setSlugStatus('idle'));
  }, [debouncedSlug]);

  function onSubmit(data: StudioData) {
    if (slugStatus === 'taken') return;
    setStudio(data);
    router.push('/signup/plan');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Studio name</label>
        <input
          {...register('studioName')}
          type="text"
          placeholder="Iron & Oak Fitness"
          className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
        />
        {errors.studioName && (
          <p className="text-xs text-red-600 mt-1">{errors.studioName.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Your FitStudio URL
        </label>
        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition">
          <span className="px-3.5 py-3 bg-slate-50 text-sm text-slate-500 border-r border-slate-200 whitespace-nowrap">
            app.fitstudio.com/
          </span>
          <input
            {...register('slug', {
              onChange: (e) => {
                setSlugValue(e.target.value);
              },
            })}
            type="text"
            placeholder="my-studio"
            className="flex-1 px-3 py-3 text-sm focus:outline-none"
          />
          <div className="px-3">
            {slugStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
            {slugStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            {slugStatus === 'taken' && <XCircle className="w-4 h-4 text-red-500" />}
          </div>
        </div>
        {errors.slug && <p className="text-xs text-red-600 mt-1">{errors.slug.message}</p>}
        {slugStatus === 'available' && (
          <p className="text-xs text-emerald-600 mt-1">This URL is available</p>
        )}
        {slugStatus === 'taken' && (
          <p className="text-xs text-red-600 mt-1">This URL is already taken. Try another.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Timezone</label>
        <select
          {...register('timezone')}
          className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white transition"
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace('_', ' ')}
            </option>
          ))}
        </select>
        {errors.timezone && <p className="text-xs text-red-600 mt-1">{errors.timezone.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Country</label>
        <select
          {...register('country')}
          className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white transition"
        >
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors.country && <p className="text-xs text-red-600 mt-1">{errors.country.message}</p>}
      </div>

      <button
        type="submit"
        disabled={slugStatus === 'taken' || slugStatus === 'checking'}
        className="w-full py-3.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </form>
  );
}
