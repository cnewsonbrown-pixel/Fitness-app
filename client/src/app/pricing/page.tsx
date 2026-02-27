import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { PricingCards } from '@/components/marketing/pricing-cards';
import { CtaBanner } from '@/components/marketing/cta-banner';
import Link from 'next/link';
import { Check } from 'lucide-react';

const faqs = [
  {
    q: 'Is there a free trial?',
    a: 'Yes — all plans include a 14-day free trial. No credit card required to start.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Absolutely. Upgrade or downgrade anytime from your account settings. Changes take effect at the next billing cycle.',
  },
  {
    q: 'Are there setup fees or contracts?',
    a: 'No setup fees, no long-term contracts. FitStudio is month-to-month and you can cancel anytime.',
  },
  {
    q: 'How does billing work?',
    a: 'You are billed monthly on the date you signed up. We accept all major credit cards via Stripe.',
  },
  {
    q: 'What happens if I exceed my member limit?',
    a: "FitStudio doesn't cap the number of members on any plan — grow without limits.",
  },
  {
    q: 'Do you offer discounts for annual billing?',
    a: 'Yes — annual billing saves you 20% versus monthly. Contact us to set this up.',
  },
];

const allFeatures = [
  { feature: 'Members (unlimited)', starter: true, growth: true, elite: true },
  { feature: 'Locations', starter: '1', growth: '3', elite: 'Unlimited' },
  { feature: 'Class scheduling & booking', starter: true, growth: true, elite: true },
  { feature: 'Member mobile app', starter: true, growth: true, elite: true },
  { feature: 'Stripe billing & payments', starter: true, growth: true, elite: true },
  { feature: 'Analytics dashboard', starter: true, growth: true, elite: true },
  { feature: 'Staff & role management', starter: true, growth: true, elite: true },
  { feature: 'Email support', starter: true, growth: true, elite: true },
  { feature: 'Marketing campaigns', starter: false, growth: true, elite: true },
  { feature: 'CRM & lead management', starter: false, growth: true, elite: true },
  { feature: 'Automation journeys', starter: false, growth: true, elite: true },
  { feature: 'Gamification & rewards', starter: false, growth: true, elite: true },
  { feature: 'Content library', starter: false, growth: true, elite: true },
  { feature: 'API access & webhooks', starter: false, growth: true, elite: true },
  { feature: 'Priority support', starter: false, growth: true, elite: true },
  { feature: 'Video on-demand library', starter: false, growth: false, elite: true },
  { feature: 'Custom analytics builder', starter: false, growth: false, elite: true },
  { feature: 'White-label branding', starter: false, growth: false, elite: true },
  { feature: 'Custom CSS & theming', starter: false, growth: false, elite: true },
  { feature: 'Dedicated account manager', starter: false, growth: false, elite: true },
  { feature: 'SLA uptime guarantee', starter: false, growth: false, elite: true },
];

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <td className="px-4 py-3 text-center text-sm text-slate-700 font-medium">{value}</td>;
  }
  return (
    <td className="px-4 py-3 text-center">
      {value ? (
        <Check className="w-4 h-4 text-brand-500 mx-auto" />
      ) : (
        <span className="text-slate-300 text-lg leading-none mx-auto block text-center">—</span>
      )}
    </td>
  );
}

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-brand-50 to-white">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
              Pricing
            </p>
            <h1 className="text-5xl font-extrabold text-slate-900 mb-5">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              No hidden fees. No per-member charges. Start free, scale freely.
            </p>
          </div>
        </section>

        {/* Plan cards */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <PricingCards />
          <p className="text-center mt-8 text-sm text-slate-500">
            All plans include a 14-day free trial &bull; No credit card required &bull;{' '}
            <Link href="/contact" className="text-brand-600 hover:underline">
              Contact us
            </Link>{' '}
            for annual billing (save 20%)
          </p>
        </section>

        {/* Comparison table */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-10">
              Full feature comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Feature
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">
                      Starter
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-brand-600 bg-brand-50">
                      Growth
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-violet-600">
                      Elite
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allFeatures.map((row) => (
                    <tr key={row.feature} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-700">{row.feature}</td>
                      <Cell value={row.starter} />
                      <td className="bg-brand-50/30">
                        <Cell value={row.growth} />
                      </td>
                      <Cell value={row.elite} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-10">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.q} className="border-b border-slate-200 pb-6">
                  <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
