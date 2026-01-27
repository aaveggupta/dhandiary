'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, Spinner } from '@/components/ui';
import { useSettings, useCompleteOnboarding } from '@/hooks';
import {
  ArrowRight,
  Check,
  CreditCard,
  DollarSign,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Shield,
  Minus,
  Plus,
} from 'lucide-react';
import type { AccountType } from '@/types';
import { ACCOUNT_TYPES, ACCOUNT_TYPE_CONFIG, CURRENCIES, getCurrencySymbol } from '@/lib/constants';

const STEPS = {
  WELCOME: 0,
  CURRENCY: 1,
  ACCOUNT_TYPES: 2,
  ACCOUNT_COUNT: 3,
  ACCOUNTS_SETUP: 4,
  INCOME: 5,
  COMPLETION: 6,
};

interface AccountSetup {
  type: AccountType;
  name: string;
  balance: number;
  currency: string;
  bankName?: string;
  lastFourDigits?: string;
  description?: string;
  creditLimit?: number;
}

// Generate account type options from config
const accountTypeOptions = Object.entries(ACCOUNT_TYPE_CONFIG).map(([key, config]) => ({
  id: key as AccountType,
  label: config.label,
  Icon: config.icon,
  description: config.description,
  examples: config.examples,
}));

const SplitLayout = ({
  title,
  subtitle,
  step,
  totalSteps = 7,
  children,
}: {
  title: string;
  subtitle: string;
  step: number;
  totalSteps?: number;
  children: React.ReactNode;
}) => (
  <div className="flex min-h-screen bg-background">
    {/* Left Side: Progress & Context */}
    <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-surface p-12 lg:flex lg:w-1/3">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-950/20 to-transparent" />

      <div>
        <div className="mb-12 flex items-center gap-3">
          <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-lg shadow-emerald-500/20">
            <span className="text-lg font-bold text-white">D</span>
          </div>
          <span className="text-xl font-bold tracking-tight">DhanDiary</span>
        </div>

        <div className="space-y-6">
          {[
            { step: STEPS.WELCOME, label: 'Welcome' },
            { step: STEPS.CURRENCY, label: 'Currency' },
            { step: STEPS.ACCOUNT_TYPES, label: 'Account Types' },
            { step: STEPS.ACCOUNT_COUNT, label: 'How Many' },
            { step: STEPS.ACCOUNTS_SETUP, label: 'Account Details' },
            { step: STEPS.INCOME, label: 'Income' },
            { step: STEPS.COMPLETION, label: 'Finish' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  step > s.step
                    ? 'border-primary bg-primary text-white'
                    : step === s.step
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-700 bg-transparent text-slate-600'
                } `}
              >
                {step > s.step ? (
                  <Check size={16} strokeWidth={3} />
                ) : (
                  <span className="text-sm font-semibold">{i + 1}</span>
                )}
              </div>
              <span
                className={`font-medium transition-colors ${step >= s.step ? 'text-white' : 'text-slate-500'}`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-sm text-slate-500">
        <p>&copy; 2024 DhanDiary</p>
      </div>
    </div>

    {/* Right Side: Interaction */}
    <div className="flex w-full flex-col overflow-y-auto p-6 lg:w-2/3 lg:p-16">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center">
        {/* Mobile Progress Bar */}
        <div className="mb-8 lg:hidden">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted">
            <span>
              Step {step + 1} of {totalSteps}
            </span>
            <span className="font-medium">{title}</span>
          </div>
        </div>

        <div className="mb-8 animate-fade-in">
          <h2 className="mb-3 text-3xl font-bold tracking-tight lg:text-4xl">{title}</h2>
          <p className="text-lg text-muted">{subtitle}</p>
        </div>

        <div className="flex-1 animate-fade-in">{children}</div>
      </div>
    </div>
  </div>
);

// Validation helper functions
const validateLastFourDigits = (value: string | undefined): string | null => {
  if (!value || value === '') return null; // Optional field
  if (value.length !== 4) return 'Must be exactly 4 digits';
  if (!/^\d{4}$/.test(value)) return 'Must contain only digits';
  return null;
};

const validateAccount = (account: AccountSetup): string | null => {
  if (!account.name.trim()) return 'Account name is required';
  const lastFourError = validateLastFourDigits(account.lastFourDigits);
  if (lastFourError) return `Last 4 digits: ${lastFourError}`;
  return null;
};

export default function OnboardingPage() {
  const router = useRouter();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const completeOnboarding = useCompleteOnboarding();

  const [step, setStep] = useState(STEPS.WELCOME);
  const [currency, setCurrency] = useState('INR');
  const [selectedTypes, setSelectedTypes] = useState<AccountType[]>([]);
  const [accountCounts, setAccountCounts] = useState<Record<AccountType, number>>({
    [ACCOUNT_TYPES.BANK]: 1,
    [ACCOUNT_TYPES.CREDIT]: 1,
    [ACCOUNT_TYPES.CASH]: 1,
  } as Record<AccountType, number>);
  const [accounts, setAccounts] = useState<AccountSetup[]>([]);
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Redirect to dashboard if onboarding is already complete
  useEffect(() => {
    if (settings?.onboardingComplete) {
      router.replace('/dashboard');
    }
  }, [settings, router]);

  // Show loading while checking settings
  if (settingsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Don't render if already completed (while redirect is happening)
  if (settings?.onboardingComplete) {
    return null;
  }

  const handleNext = () => {
    // Clear any previous validation errors
    setValidationError(null);
    setSubmitError(null);

    if (step === STEPS.WELCOME) {
      setStep(STEPS.CURRENCY);
    } else if (step === STEPS.CURRENCY) {
      setStep(STEPS.ACCOUNT_TYPES);
    } else if (step === STEPS.ACCOUNT_TYPES) {
      if (selectedTypes.length === 0) return;
      setStep(STEPS.ACCOUNT_COUNT);
    } else if (step === STEPS.ACCOUNT_COUNT) {
      // Create account setup entries based on counts
      const initialAccounts: AccountSetup[] = [];
      selectedTypes.forEach((type) => {
        const count = accountCounts[type] || 1;
        const typeLabel = accountTypeOptions.find((t) => t.id === type)?.label || type;
        for (let i = 0; i < count; i++) {
          initialAccounts.push({
            type,
            name: count > 1 ? `${typeLabel} ${i + 1}` : typeLabel,
            balance: 0,
            currency,
          });
        }
      });
      setAccounts(initialAccounts);
      setCurrentAccountIndex(0);
      setStep(STEPS.ACCOUNTS_SETUP);
    } else if (step === STEPS.ACCOUNTS_SETUP) {
      // Validate current account before proceeding
      const currentAccount = accounts[currentAccountIndex];
      const error = validateAccount(currentAccount);
      if (error) {
        setValidationError(error);
        return;
      }

      if (currentAccountIndex < accounts.length - 1) {
        setCurrentAccountIndex((prev) => prev + 1);
      } else {
        setStep(STEPS.INCOME);
      }
    } else if (step === STEPS.INCOME) {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Validate all accounts before submitting
      for (let i = 0; i < accounts.length; i++) {
        const error = validateAccount(accounts[i]);
        if (error) {
          setSubmitError(`Account ${i + 1} (${accounts[i].name}): ${error}`);
          setIsSubmitting(false);
          return;
        }
      }

      // Use the batch API to create all accounts atomically
      await completeOnboarding.mutateAsync({
        accounts: accounts.map((account) => ({
          name: account.name,
          type: account.type,
          balance: account.balance,
          currency: account.currency,
          bankName: account.bankName || undefined,
          lastFourDigits: account.lastFourDigits || undefined,
          description: account.description || undefined,
          creditLimit: account.type === ACCOUNT_TYPES.CREDIT ? account.creditLimit : undefined,
        })),
        currency,
        monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
      });

      setStep(STEPS.COMPLETION);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to complete setup. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    // Clear any validation errors when going back
    setValidationError(null);
    setSubmitError(null);

    if (step === STEPS.ACCOUNTS_SETUP && currentAccountIndex > 0) {
      setCurrentAccountIndex((prev) => prev - 1);
    } else if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  // Step: Welcome
  if (step === STEPS.WELCOME) {
    return (
      <SplitLayout
        step={step}
        title="Welcome to DhanDiary"
        subtitle="Your personal finance diary in under 2 minutes."
      >
        <div className="space-y-5">
          {[
            {
              icon: <TrendingUp className="text-emerald-400" size={22} />,
              title: 'Track Net Worth',
              desc: 'See all your money in one place - bank accounts, credit cards, and cash.',
            },
            {
              icon: <CreditCard className="text-emerald-400" size={22} />,
              title: 'Manage Credit Cards',
              desc: 'Track outstanding amounts, available limits, and utilization.',
            },
            {
              icon: <Shield className="text-emerald-400" size={22} />,
              title: 'Privacy First',
              desc: 'Your data stays secure. We never access your actual bank accounts.',
            },
          ].map((item, i) => (
            <Card
              key={i}
              className="flex gap-4 border-slate-800 p-5 transition-colors hover:border-slate-700"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                {item.icon}
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-muted">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-10">
          <Button onClick={handleNext} size="lg" className="w-full px-10 sm:w-auto">
            Get Started <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </SplitLayout>
    );
  }

  // Step: Currency
  if (step === STEPS.CURRENCY) {
    return (
      <SplitLayout
        step={step}
        title="Select Currency"
        subtitle="Choose your primary currency for tracking expenses."
      >
        <div className="grid grid-cols-2 gap-4">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setCurrency(c.code)}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-5 transition-all duration-200 ${
                currency === c.code
                  ? 'border-primary bg-primary/10 text-white'
                  : 'border-slate-800 bg-surface text-muted hover:border-slate-600 hover:bg-surfaceHighlight'
              } `}
            >
              <span className="text-3xl font-bold">{c.symbol}</span>
              <span className="text-lg font-semibold">{c.code}</span>
              <span className="text-xs opacity-60">{c.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-10 flex gap-4">
          <Button variant="ghost" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleNext}>
            Continue <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </SplitLayout>
    );
  }

  // Step: Account Types
  if (step === STEPS.ACCOUNT_TYPES) {
    return (
      <SplitLayout
        step={step}
        title="What do you want to track?"
        subtitle="Select all account types you have. You can add more later."
      >
        <div className="space-y-4">
          {accountTypeOptions.map((opt) => {
            const isSelected = selectedTypes.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (isSelected) setSelectedTypes((prev) => prev.filter((t) => t !== opt.id));
                  else setSelectedTypes((prev) => [...prev, opt.id]);
                }}
                className={`group flex w-full items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-800 bg-surface hover:border-slate-600'
                } `}
              >
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isSelected
                      ? 'bg-primary text-white'
                      : 'bg-slate-800 text-slate-400 group-hover:text-white'
                  }`}
                >
                  <opt.Icon size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}
                    >
                      {opt.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 size={22} className="flex-shrink-0 text-primary" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">{opt.description}</p>
                  <p className="mt-1 text-xs text-slate-600">e.g. {opt.examples}</p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-10 flex gap-4">
          <Button variant="ghost" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={selectedTypes.length === 0}>
            Continue <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </SplitLayout>
    );
  }

  // Step: Account Count
  if (step === STEPS.ACCOUNT_COUNT) {
    return (
      <SplitLayout
        step={step}
        title="How many of each?"
        subtitle="Tell us how many accounts you have for each type."
      >
        <div className="space-y-5">
          {selectedTypes.map((type) => {
            const opt = accountTypeOptions.find((t) => t.id === type);
            const count = accountCounts[type] || 1;
            return (
              <Card key={type} className="flex items-center justify-between border-slate-800 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
                    {opt && <opt.Icon size={22} />}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{opt?.label}</p>
                    <p className="text-sm text-muted">
                      {count === 1 ? '1 account' : `${count} accounts`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setAccountCounts((prev) => ({ ...prev, [type]: Math.max(1, count - 1) }))
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700"
                    disabled={count <= 1}
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-8 text-center text-xl font-bold text-white">{count}</span>
                  <button
                    onClick={() =>
                      setAccountCounts((prev) => ({ ...prev, [type]: Math.min(10, count + 1) }))
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700"
                    disabled={count >= 10}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-muted">
          You can add more accounts anytime from the Accounts page.
        </p>
        <div className="mt-10 flex gap-4">
          <Button variant="ghost" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleNext}>
            Continue <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </SplitLayout>
    );
  }

  // Step: Account Setup
  if (step === STEPS.ACCOUNTS_SETUP) {
    const currentAccount = accounts[currentAccountIndex];
    const updateAccount = (key: keyof AccountSetup, value: string | number | undefined) => {
      // Clear validation error when user starts editing
      if (validationError) setValidationError(null);

      const newAccounts = [...accounts];
      newAccounts[currentAccountIndex] = { ...currentAccount, [key]: value };
      setAccounts(newAccounts);
    };

    const isCreditCard = currentAccount?.type === ACCOUNT_TYPES.CREDIT;
    const isBankAccount = currentAccount?.type === ACCOUNT_TYPES.BANK;
    const isCash = currentAccount?.type === ACCOUNT_TYPES.CASH;
    const typeLabel = accountTypeOptions.find((t) => t.id === currentAccount?.type)?.label || '';

    return (
      <SplitLayout
        step={step}
        title={`Setup ${typeLabel}`}
        subtitle={`Account ${currentAccountIndex + 1} of ${accounts.length}`}
      >
        <Card className="space-y-5 border-slate-800 bg-surface/50 p-6">
          {/* Account Type Header */}
          <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {(() => {
                const TypeIcon = accountTypeOptions.find(
                  (t) => t.id === currentAccount?.type
                )?.Icon;
                return TypeIcon ? <TypeIcon size={24} /> : null;
              })()}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Account Type
              </p>
              <p className="text-lg font-semibold text-white">{typeLabel}</p>
            </div>
          </div>

          {/* Form Fields */}
          <Input
            label="Account Name"
            value={currentAccount?.name || ''}
            onChange={(e) => updateAccount('name', e.target.value)}
            placeholder={
              isCreditCard
                ? 'e.g. HDFC Regalia'
                : isBankAccount
                  ? 'e.g. HDFC Savings'
                  : 'e.g. Home Loan'
            }
          />

          {(isBankAccount || isCreditCard) && (
            <Input
              label={isCreditCard ? 'Card Issuer / Bank' : 'Bank Name'}
              value={currentAccount?.bankName || ''}
              onChange={(e) => updateAccount('bankName', e.target.value)}
              placeholder={isCreditCard ? 'e.g. HDFC, ICICI, Amex' : 'e.g. HDFC Bank, SBI'}
            />
          )}

          {(isBankAccount || isCreditCard) && (
            <Input
              label={
                isCreditCard
                  ? 'Last 4 Digits of Card (Optional)'
                  : 'Last 4 Digits of Account (Optional)'
              }
              value={currentAccount?.lastFourDigits || ''}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                updateAccount('lastFourDigits', val);
              }}
              placeholder="e.g. 1234"
              maxLength={4}
            />
          )}

          {isCreditCard && (
            <>
              <Input
                label="Credit Limit"
                type="number"
                value={currentAccount?.creditLimit || ''}
                onChange={(e) => updateAccount('creditLimit', parseFloat(e.target.value) || 0)}
                placeholder="e.g. 200000"
              />
              <Input
                label="Current Outstanding (Amount you owe)"
                type="number"
                value={currentAccount?.balance || ''}
                onChange={(e) => updateAccount('balance', parseFloat(e.target.value) || 0)}
                placeholder="e.g. 15000"
              />
            </>
          )}

          {(isBankAccount || isCash) && (
            <Input
              label="Current Balance"
              type="number"
              value={currentAccount?.balance || ''}
              onChange={(e) => updateAccount('balance', parseFloat(e.target.value) || 0)}
              placeholder={isCash ? 'e.g. 5000' : 'e.g. 50000'}
            />
          )}

          <Input
            label="Description (Optional)"
            value={currentAccount?.description || ''}
            onChange={(e) => updateAccount('description', e.target.value)}
            placeholder="e.g. Emergency fund, Joint account"
          />
        </Card>

        {/* Validation Error */}
        {validationError && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {validationError}
          </div>
        )}

        {/* Progress Dots */}
        {accounts.length > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {accounts.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentAccountIndex
                    ? 'w-8 bg-primary'
                    : i < currentAccountIndex
                      ? 'w-2 bg-primary/50'
                      : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <Button variant="ghost" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={!currentAccount?.name}>
            {currentAccountIndex === accounts.length - 1 ? 'Continue' : 'Next Account'}
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </SplitLayout>
    );
  }

  // Step: Income
  if (step === STEPS.INCOME) {
    const currencySymbol = getCurrencySymbol(currency);

    return (
      <SplitLayout
        step={step}
        title="Monthly Income"
        subtitle="This helps us show your savings rate and budget utilization."
      >
        <div className="flex flex-col items-center py-8">
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/30 bg-surface text-primary">
              <DollarSign size={40} />
            </div>
          </div>

          <div className="w-full max-w-sm">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-primary">
                {currencySymbol}
              </span>
              <input
                className="w-full rounded-2xl border-2 border-slate-700 bg-surface py-5 pl-12 pr-4 text-center text-3xl font-bold transition-colors focus:border-primary focus:outline-none"
                placeholder="0"
                type="text"
                inputMode="numeric"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>
            <p className="mt-4 text-center text-sm text-muted">
              Monthly take-home salary (after tax)
            </p>
          </div>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {submitError}
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
            Back
          </Button>
          <Button onClick={handleNext} className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Setting up...' : monthlyIncome ? 'Complete Setup' : 'Skip for now'}
          </Button>
        </div>
      </SplitLayout>
    );
  }

  // Step: Completion
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in text-center">
        <div className="gradient-primary mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full text-white shadow-[0_0_40px_rgba(16,185,129,0.4)]">
          <Check size={40} strokeWidth={3} />
        </div>

        <h1 className="mb-3 text-4xl font-bold">You&apos;re all set!</h1>
        <p className="mb-8 text-lg text-muted">Your financial dashboard is ready.</p>

        <Card className="mb-8 border-slate-800 p-5 text-left">
          <div className="flex items-center justify-between border-b border-slate-800 py-3">
            <span className="text-muted">Accounts Added</span>
            <span className="font-bold text-white">{accounts.length}</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-800 py-3">
            <span className="text-muted">Currency</span>
            <span className="font-bold text-primary">{currency}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-muted">Monthly Income</span>
            <span className="font-bold text-white">
              {monthlyIncome ? `${currency} ${Number(monthlyIncome).toLocaleString()}` : 'Not set'}
            </span>
          </div>
        </Card>

        <Button onClick={() => router.push('/dashboard')} size="lg" fullWidth className="text-lg">
          Go to Dashboard <ArrowRight size={18} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}
