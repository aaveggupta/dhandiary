'use client';

import { TrendingUp, Shield, Zap } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel - Branding (Hidden on Mobile) */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-background to-background" />
        <div className="absolute left-0 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-teal-500/10 blur-3xl" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="gradient-primary flex h-11 w-11 items-center justify-center rounded-xl shadow-lg shadow-emerald-500/30">
              <span className="text-xl font-bold text-white">D</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">DhanDiary</span>
          </div>

          {/* Main Content */}
          <div className="max-w-lg">
            <h1 className="mb-6 text-5xl font-bold leading-tight">
              Take control of your{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                financial future
              </span>
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-slate-400">
              Track expenses, manage accounts, and gain insights into your spending habits with our
              intuitive dashboard.
            </p>

            {/* Features */}
            <div className="space-y-4">
              {[
                {
                  icon: <TrendingUp size={20} />,
                  title: 'Real-time Tracking',
                  desc: 'Monitor your net worth across all accounts',
                },
                {
                  icon: <Zap size={20} />,
                  title: 'Smart Insights',
                  desc: 'AI-powered spending analysis and suggestions',
                },
                {
                  icon: <Shield size={20} />,
                  title: 'Bank-grade Security',
                  desc: 'Your data is encrypted and protected',
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.07]"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="mb-0.5 font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-slate-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-slate-500">
            <p>&copy; 2024 DhanDiary. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="relative flex w-full items-center justify-center p-6 lg:w-1/2 lg:p-12">
        {/* Subtle gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-emerald-950/10" />

        <div className="relative z-10 w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-10 flex flex-col items-center lg:hidden">
            <div className="gradient-primary mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl shadow-emerald-500/30">
              <span className="text-2xl font-bold text-white">D</span>
            </div>
            <span className="text-xl font-bold tracking-tight">DhanDiary</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
