'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Mail, MessageSquare, Phone } from 'lucide-react';

const contactOptions = [
  {
    icon: MessageSquare,
    title: 'Sales',
    description: 'Talk to our team about the right plan for your studio.',
    detail: 'sales@fitstudio.com',
  },
  {
    icon: Mail,
    title: 'Support',
    description: 'Need help with your account or a technical issue?',
    detail: 'support@fitstudio.com',
  },
  {
    icon: Phone,
    title: 'Phone',
    description: 'Elite plan customers get direct phone support.',
    detail: '+1 (555) 123-4567',
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Simulate submission
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-brand-50 to-white">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
              Get in touch
            </p>
            <h1 className="text-5xl font-extrabold text-slate-900 mb-5">
              We would love to hear from you
            </h1>
            <p className="text-xl text-slate-600">
              Questions about FitStudio? Our team typically responds within a few hours.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
            {/* Contact options */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">Other ways to reach us</h2>
              <div className="space-y-5 mb-10">
                {contactOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <div key={opt.title} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{opt.title}</p>
                        <p className="text-sm text-slate-600 mb-0.5">{opt.description}</p>
                        <p className="text-sm font-medium text-brand-600">{opt.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-brand-50 rounded-2xl p-6 border border-brand-100">
                <p className="font-semibold text-slate-900 mb-1">Not ready to reach out yet?</p>
                <p className="text-sm text-slate-600">
                  Start a free 14-day trial and explore FitStudio at your own pace. No credit card
                  needed.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-emerald-600 text-2xl">✓</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Message sent!</h3>
                  <p className="text-slate-600">
                    Thanks for reaching out. We will get back to you within a few hours.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-slate-900 mb-6">Send us a message</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          First name
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          placeholder="Alex"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Last name
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          placeholder="Johnson"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Work email
                      </label>
                      <input
                        type="email"
                        required
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        placeholder="alex@mygym.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Studio name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        placeholder="My Awesome Studio"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        How can we help?
                      </label>
                      <select className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white">
                        <option>I am interested in a demo</option>
                        <option>I have a question about pricing</option>
                        <option>I need technical support</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Message
                      </label>
                      <textarea
                        required
                        rows={4}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                        placeholder="Tell us about your studio and what you need..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-60"
                    >
                      {loading ? 'Sending...' : 'Send message'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
