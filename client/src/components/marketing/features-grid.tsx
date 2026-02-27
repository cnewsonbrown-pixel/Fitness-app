import {
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  Megaphone,
  Trophy,
  Video,
  Zap,
  Globe,
  Shield,
  Smartphone,
  Webhook,
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Member Management',
    description:
      'Full member profiles with lifecycle stages, tags, attendance history, and automated communications.',
    tier: 'All plans',
    color: 'blue',
  },
  {
    icon: Calendar,
    title: 'Class Scheduling',
    description:
      'Drag-and-drop class scheduler with capacity limits, waitlists, instructor assignment, and online booking.',
    tier: 'All plans',
    color: 'violet',
  },
  {
    icon: CreditCard,
    title: 'Billing & Payments',
    description:
      'Automated recurring billing via Stripe. Handle memberships, drop-ins, refunds, and revenue reporting.',
    tier: 'All plans',
    color: 'emerald',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description:
      'Real-time KPIs — revenue, retention, attendance trends, and popular class times — in one view.',
    tier: 'All plans',
    color: 'amber',
  },
  {
    icon: Megaphone,
    title: 'Marketing & CRM',
    description:
      'Run email campaigns, manage leads, build automation journeys, and score prospects automatically.',
    tier: 'Growth+',
    color: 'pink',
  },
  {
    icon: Trophy,
    title: 'Gamification',
    description:
      'Keep members engaged with badges, challenges, streak tracking, and leaderboards.',
    tier: 'Growth+',
    color: 'orange',
  },
  {
    icon: Video,
    title: 'Video Library',
    description:
      'Upload and stream on-demand workouts. Organize into programs and track member watch history.',
    tier: 'Elite',
    color: 'red',
  },
  {
    icon: Zap,
    title: 'Custom Analytics',
    description:
      'Build your own dashboards, drag-and-drop widgets, and export reports in any format.',
    tier: 'Elite',
    color: 'indigo',
  },
  {
    icon: Globe,
    title: 'White-label Branding',
    description:
      'Full brand control — logo, colors, fonts, and custom CSS to make the platform yours.',
    tier: 'Elite',
    color: 'teal',
  },
  {
    icon: Smartphone,
    title: 'Member Mobile App',
    description:
      'Native iOS and Android app for members to book classes, track progress, and engage.',
    tier: 'All plans',
    color: 'cyan',
  },
  {
    icon: Shield,
    title: 'Staff & Roles',
    description:
      'Role-based permissions for owners, admins, instructors, and front desk staff.',
    tier: 'All plans',
    color: 'slate',
  },
  {
    icon: Webhook,
    title: 'API & Webhooks',
    description:
      'Full REST API and webhook system to integrate FitStudio with any tool in your stack.',
    tier: 'Growth+',
    color: 'gray',
  },
];

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  violet: 'bg-violet-50 text-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  pink: 'bg-pink-50 text-pink-600',
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  teal: 'bg-teal-50 text-teal-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  slate: 'bg-slate-100 text-slate-600',
  gray: 'bg-gray-100 text-gray-600',
};

export function FeaturesGrid() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-2">
            Everything you need
          </p>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
            One platform. Every feature.
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From day-one essentials to advanced growth tools — FitStudio scales with your studio.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            const iconClass = colorMap[feature.color] || colorMap.slate;
            return (
              <div
                key={feature.title}
                className="group p-6 bg-white rounded-2xl border border-slate-200 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-50 transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 text-base">{feature.title}</h3>
                  <span className="ml-2 shrink-0 text-xs font-medium text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">
                    {feature.tier}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
