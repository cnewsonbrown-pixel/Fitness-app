import { Star } from 'lucide-react';

const stats = [
  { value: '500+', label: 'Studios worldwide' },
  { value: '120K+', label: 'Active members managed' },
  { value: '$24M+', label: 'Revenue processed monthly' },
  { value: '4.9/5', label: 'Average rating' },
];

const testimonials = [
  {
    quote:
      'FitStudio replaced four separate tools for us. Our team saves 15 hours a week on admin alone.',
    name: 'Marcus Reid',
    title: 'Owner, Iron & Oak Fitness',
    initials: 'MR',
    color: 'bg-brand-600',
  },
  {
    quote:
      "The member mobile app was a game changer. Bookings went up 40% in our first month because it's so easy to use.",
    name: 'Priya Sharma',
    title: 'Co-founder, Studio Kinetic',
    initials: 'PS',
    color: 'bg-emerald-600',
  },
  {
    quote:
      "We went from chasing payments manually to having everything automated. Revenue is up and stress is down.",
    name: 'Jake Thompson',
    title: 'Director, CrossCore Athletics',
    initials: 'JT',
    color: 'bg-violet-600',
  },
];

export function SocialProof() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-extrabold text-brand-600 mb-1">{stat.value}</p>
              <p className="text-sm text-slate-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
            Loved by studio owners
          </h2>
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
            <span className="ml-2 text-sm text-slate-600 font-medium">
              4.9 out of 5 from 300+ reviews
            </span>
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <blockquote className="text-slate-700 text-sm leading-relaxed mb-5">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${t.color}`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
