'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const plans = [
  {
    name: 'Starter',
    tier: 'BASE' as const,
    price: 49,
    description: 'Everything you need to run your studio day-to-day.',
    color: 'slate',
    features: [
      'Unlimited members',
      'Class scheduling & booking',
      'Stripe billing & payments',
      'Member mobile app',
      'Staff & role management',
      'Analytics dashboard',
      'Email support',
    ],
  },
  {
    name: 'Growth',
    tier: 'MID' as const,
    price: 99,
    description: 'Marketing and engagement tools to grow your community.',
    color: 'brand',
    popular: true,
    features: [
      'Everything in Starter',
      'Email & SMS campaigns',
      'Lead management & CRM',
      'Automation journeys',
      'Gamification & rewards',
      'Content library',
      'API access & webhooks',
      'Priority support',
    ],
  },
  {
    name: 'Elite',
    tier: 'PREMIUM' as const,
    price: 199,
    description: 'Advanced features for multi-location and high-growth studios.',
    color: 'violet',
    features: [
      'Everything in Growth',
      'Video on-demand library',
      'Custom analytics builder',
      'White-label branding',
      'Custom CSS & theming',
      'Multi-location support',
      'Dedicated account manager',
      'SLA uptime guarantee',
    ],
  },
];

interface PricingCardsProps {
  onSelect?: (tier: 'BASE' | 'MID' | 'PREMIUM') => void;
  selectedTier?: 'BASE' | 'MID' | 'PREMIUM';
  ctaText?: string;
}

export function PricingCards({ onSelect, selectedTier, ctaText = 'Start free trial' }: PricingCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {plans.map((plan) => {
        const isSelected = selectedTier === plan.tier;
        const isPopular = plan.popular;

        return (
          <div
            key={plan.tier}
            className={cn(
              'relative rounded-2xl p-6 border-2 transition-all duration-200',
              isSelected
                ? 'border-brand-600 shadow-xl shadow-brand-100'
                : isPopular
                ? 'border-brand-400 shadow-lg shadow-brand-50'
                : 'border-slate-200 hover:border-slate-300',
              onSelect && 'cursor-pointer'
            )}
            onClick={() => onSelect?.(plan.tier)}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Most popular
                </span>
              </div>
            )}

            {isSelected && (
              <div className="absolute top-4 right-4">
                <div className="w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
            )}

            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
              <p className="text-sm text-slate-500">{plan.description}</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-extrabold text-slate-900">${plan.price}</span>
              <span className="text-slate-500 text-sm">/month</span>
              <p className="text-xs text-slate-400 mt-1">Billed monthly &bull; Cancel anytime</p>
            </div>

            {!onSelect && (
              <Link
                href={`/signup?plan=${plan.tier}`}
                className={cn(
                  'block w-full text-center py-2.5 rounded-xl font-semibold text-sm mb-6 transition-colors',
                  isPopular
                    ? 'bg-brand-600 text-white hover:bg-brand-700'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                )}
              >
                {ctaText}
              </Link>
            )}

            <ul className="space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
