'use client';

import Link from 'next/link';
import { ArrowRight, Play, Star } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-indigo-50 -z-10" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-100 rounded-full blur-3xl opacity-30 -z-10 translate-x-1/3 -translate-y-1/3" />

      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border border-brand-200 rounded-full text-sm font-medium text-brand-700 mb-6">
            <Star className="w-3.5 h-3.5 fill-brand-500 text-brand-500" />
            Trusted by 500+ fitness studios worldwide
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            Run your gym{' '}
            <span className="gradient-text">smarter, not harder</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto">
            FitStudio brings your members, classes, billing, and analytics into one powerful
            platform. Less admin. More coaching. Better results.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 hover:shadow-brand-300 hover:-translate-y-0.5"
            >
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 transition-all hover:-translate-y-0.5">
              <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center">
                <Play className="w-3 h-3 text-brand-600 fill-brand-600 ml-0.5" />
              </div>
              Watch demo
            </button>
          </div>

          <p className="mt-4 text-sm text-slate-500">14-day free trial &bull; No credit card required &bull; Cancel anytime</p>
        </div>

        {/* Dashboard preview */}
        <div className="mt-16 relative max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-200 overflow-hidden">
            {/* Browser chrome */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded-md px-3 py-1 text-xs text-slate-400 text-center">
                  app.fitstudio.com/dashboard
                </div>
              </div>
            </div>
            {/* Dashboard mockup */}
            <div className="bg-slate-50 p-6">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Active Members', value: '1,284', change: '+12%', color: 'brand' },
                  { label: 'Monthly Revenue', value: '$48,320', change: '+8%', color: 'emerald' },
                  { label: 'Classes Today', value: '24', change: '3 full', color: 'violet' },
                  { label: 'New Leads', value: '37', change: '+5 today', color: 'amber' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">{stat.change}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm border border-slate-100 h-32 flex items-center justify-center">
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>Revenue trend</span><span>Last 30 days</span>
                    </div>
                    <div className="flex items-end gap-1 h-16">
                      {[40, 55, 45, 60, 50, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-brand-100 rounded-sm"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 h-32">
                  <p className="text-xs text-slate-500 mb-2">Upcoming classes</p>
                  <div className="space-y-1.5">
                    {['HIIT 6:00am', 'Yoga 9:00am', 'Spin 12:00pm'].map((c) => (
                      <div key={c} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                        <span className="text-xs text-slate-700">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg border border-slate-200 p-3 hidden lg:flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-emerald-600 text-sm font-bold">✓</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">Payment received</p>
              <p className="text-xs text-slate-500">$89.00 from Sarah K.</p>
            </div>
          </div>

          <div className="absolute -right-6 bottom-16 bg-white rounded-xl shadow-lg border border-slate-200 p-3 hidden lg:flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
              <span className="text-brand-600 text-sm font-bold">+</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">New member joined</p>
              <p className="text-xs text-slate-500">Premium plan &bull; just now</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
