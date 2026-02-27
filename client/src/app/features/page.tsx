import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { FeaturesGrid } from '@/components/marketing/features-grid';
import { CtaBanner } from '@/components/marketing/cta-banner';
import {
  Users,
  Calendar,
  CreditCard,
  Smartphone,
  BarChart3,
  Megaphone,
} from 'lucide-react';

const highlights = [
  {
    icon: Users,
    title: 'Member Management, reimagined',
    description:
      'Every member gets a rich profile: visit history, membership status, payment records, signed waivers, tags, lifecycle stage, and communication history — all in one place. Bulk actions, advanced filtering, and automated lifecycle management reduce manual work to near zero.',
    side: 'left',
  },
  {
    icon: Calendar,
    title: 'Scheduling that just works',
    description:
      'Build your weekly class schedule in minutes. Set capacity limits, enable waitlists, assign instructors, and let members book via the web or mobile app. Real-time roster management with check-in tracking means you always know who showed up.',
    side: 'right',
  },
  {
    icon: CreditCard,
    title: 'Billing on autopilot',
    description:
      'Connect Stripe and watch payments collect themselves. Set up membership plans with weekly, monthly, or annual billing. Handle failed payments, dunning, refunds, and revenue reporting without touching a spreadsheet.',
    side: 'left',
  },
  {
    icon: Smartphone,
    title: 'A member app they will actually use',
    description:
      'Your members get a native iOS and Android app to book classes, view their progress, earn badges, watch on-demand content, and stay connected to your community. All branded to your studio.',
    side: 'right',
  },
  {
    icon: BarChart3,
    title: 'Analytics that drive decisions',
    description:
      'Track revenue trends, class attendance, member retention rates, peak booking times, and instructor performance. Build custom dashboards with the metrics that matter to your business and export data on your terms.',
    side: 'left',
  },
  {
    icon: Megaphone,
    title: 'Marketing built for gyms',
    description:
      'Capture leads with embeddable forms, run targeted email and SMS campaigns, build automation journeys for trial-to-member conversion, and score leads based on engagement. CRM tools designed for fitness businesses.',
    side: 'right',
  },
];

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-brand-50 to-white">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
              Platform features
            </p>
            <h1 className="text-5xl font-extrabold text-slate-900 mb-5">
              Every tool your studio needs
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              FitStudio was built by people who understand fitness businesses. Every feature solves
              a real problem that studio owners face every day.
            </p>
          </div>
        </section>

        {/* Feature highlights */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto space-y-24">
            {highlights.map((item, i) => {
              const Icon = item.icon;
              const isRight = item.side === 'right';
              return (
                <div
                  key={item.title}
                  className={`flex flex-col ${isRight ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}
                >
                  <div className="flex-1">
                    <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6 text-brand-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-4">{item.title}</h2>
                    <p className="text-lg text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gradient-to-br from-slate-100 to-brand-50 rounded-2xl aspect-video flex items-center justify-center">
                      <div className="text-center">
                        <Icon className="w-16 h-16 text-brand-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-400">Feature screenshot</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* All features grid */}
        <FeaturesGrid />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
