import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/marketing/hero';
import { FeaturesGrid } from '@/components/marketing/features-grid';
import { SocialProof } from '@/components/marketing/social-proof';
import { PricingCards } from '@/components/marketing/pricing-cards';
import { CtaBanner } from '@/components/marketing/cta-banner';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <FeaturesGrid />

        {/* Pricing preview section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-2">
                Simple pricing
              </p>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
                Plans that grow with you
              </h2>
              <p className="text-lg text-slate-600 max-w-xl mx-auto">
                Start with the essentials and unlock more as your studio scales.
              </p>
            </div>
            <PricingCards />
            <p className="text-center mt-8 text-sm text-slate-500">
              Need a custom plan?{' '}
              <Link href="/contact" className="text-brand-600 font-medium hover:underline">
                Talk to our team
              </Link>
            </p>
          </div>
        </section>

        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
