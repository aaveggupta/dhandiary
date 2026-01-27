import { SignIn, ClerkLoaded, ClerkLoading } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="flex w-full flex-col items-center">
      {/* Header */}
      <div className="mb-10 text-center">
        <h2 className="mb-3 text-4xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-lg text-muted">Sign in to continue to your dashboard</p>
      </div>

      {/* Loading State */}
      <ClerkLoading>
        <div className="flex w-full max-w-md flex-col items-center justify-center py-16">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted">Loading sign-in...</p>
        </div>
      </ClerkLoading>

      {/* Clerk Sign In Component */}
      <ClerkLoaded>
        <div className="w-full">
          <SignIn
            appearance={{
              elements: {
                rootBox: 'w-full flex justify-center',
                card: 'bg-surface/50 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 w-full max-w-md rounded-2xl p-8',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton:
                  'bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                socialButtonsBlockButtonText: 'font-semibold text-base',
                socialButtonsProviderIcon: 'w-5 h-5',
                dividerLine: 'bg-white/10',
                dividerText: 'text-muted text-xs uppercase tracking-widest bg-surface/50 px-4',
                dividerRow: 'my-6',
                formFieldLabel: 'text-slate-300 font-medium text-sm mb-2',
                formFieldInput:
                  'bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary/50 focus:border-primary rounded-xl py-3.5 px-4 transition-all duration-200',
                formFieldInputShowPasswordButton: 'text-slate-400 hover:text-white',
                formButtonPrimary:
                  'gradient-primary hover:opacity-90 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-2',
                footerAction: 'hidden',
                footer: 'hidden',
                card__footer: 'hidden',
                footerActionLink: 'text-primary hover:text-primary/80 font-semibold',
                identityPreviewText: 'text-white',
                identityPreviewEditButton: 'text-primary hover:text-primary/80',
                formFieldAction: 'text-primary hover:text-primary/80 text-sm',
                formFieldHintText: 'text-slate-500 text-xs',
                alert: 'bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl',
                alertText: 'text-red-400',
                otpCodeFieldInput: 'bg-white/5 border border-white/10 text-white rounded-xl',
                formResendCodeLink: 'text-primary hover:text-primary/80',
                backLink: 'text-primary hover:text-primary/80',
                alternativeMethodsBlockButton:
                  'bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl',
                main: 'gap-6',
                form: 'gap-4',
              },
              variables: {
                colorPrimary: '#10b981',
                colorBackground: 'transparent',
                colorText: '#f8fafc',
                colorTextSecondary: '#94a3b8',
                colorInputBackground: 'transparent',
                colorInputText: '#f8fafc',
                borderRadius: '0.75rem',
                fontFamily: 'inherit',
              },
            }}
          />
        </div>

        {/* Custom Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted">
            Don&apos;t have an account?{' '}
            <a
              href="/sign-up"
              className="font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Sign up
            </a>
          </p>
        </div>
      </ClerkLoaded>
    </div>
  );
}
