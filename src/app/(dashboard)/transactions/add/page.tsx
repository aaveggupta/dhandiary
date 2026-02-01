'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Spinner } from '@/components/ui';
import {
  useAccounts,
  useCategories,
  useCreateTransaction,
  useSettings,
  useSharedCreditLimits,
} from '@/hooks';
import { TRANSACTION_TYPES, ACCOUNT_TYPES, getCurrencySymbol } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { getCreditCardStatus, toNumber } from '@/lib/finance';
import {
  X,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronLeft,
  AlertCircle,
  Wallet,
  CreditCard,
  Banknote,
  Sparkles,
  Check,
  FileText,
  ChevronDown,
} from 'lucide-react';
import type { TransactionType } from '@/types';

// Category icons mapping
const categoryIcons: Record<string, string> = {
  'Bills & Utilities': '🏠',
  Education: '📚',
  Entertainment: '🎬',
  'Food & Dining': '🍔',
  Healthcare: '🏥',
  Other: '📦',
  Shopping: '🛍️',
  Transportation: '🚗',
  Freelance: '💼',
  Gift: '🎁',
  Investment: '📈',
  'Other Income': '💰',
  Salary: '💵',
};

export default function AddTransactionPage() {
  const router = useRouter();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: settings } = useSettings();
  const { data: sharedLimits } = useSharedCreditLimits();
  const createTransaction = useCreateTransaction();

  const [type, setType] = useState<TransactionType>(TRANSACTION_TYPES.EXPENSE);
  const { data: categories, isLoading: categoriesLoading } = useCategories(type);

  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // UI State
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const currency = settings?.currency || 'USD';

  // Get selected account details
  const currentAccount = accounts?.find((a) => a.id === selectedAccount);
  const currentCategory = categories?.find((c) => c.id === selectedCategory);
  const currentSharedLimit = currentAccount?.sharedCreditLimitId
    ? sharedLimits?.find((sl) => sl.id === currentAccount.sharedCreditLimitId)
    : null;

  const getAvailableFunds = () => {
    if (!currentAccount) return null;
    if (currentAccount.type === ACCOUNT_TYPES.CREDIT) {
      // Use shared limit's available credit if applicable
      if (currentSharedLimit) return currentSharedLimit.availableCredit;
      // Otherwise use getCreditCardStatus for single source of truth
      const cardStatus = getCreditCardStatus({
        balance: toNumber(currentAccount.balance),
        creditLimit: toNumber(currentAccount.creditLimit),
      });
      return cardStatus.availableCredit;
    }
    return toNumber(currentAccount.balance);
  };

  const availableFunds = getAvailableFunds();
  const numAmount = parseFloat(amount) || 0;
  const isInsufficientFunds =
    type === TRANSACTION_TYPES.EXPENSE && availableFunds !== null && numAmount > availableFunds;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target as Node)
      ) {
        setShowAccountDropdown(false);
      }
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (accounts?.length && !selectedAccount) {
      setSelectedAccount(accounts[0].id);
    }
  }, [accounts, selectedAccount]);

  useEffect(() => {
    if (categories?.length && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const submitAmount = parseFloat(amount);
    if (submitAmount <= 0 || !selectedAccount) return;

    if (
      type === TRANSACTION_TYPES.EXPENSE &&
      availableFunds !== null &&
      submitAmount > availableFunds
    ) {
      const accountType = currentAccount?.type === ACCOUNT_TYPES.CREDIT ? 'credit' : 'balance';
      setSubmitError(
        `Insufficient ${accountType}. Available: ${formatCurrency(availableFunds, currency)}`
      );
      return;
    }

    try {
      await createTransaction.mutateAsync({
        amount: submitAmount,
        type,
        categoryId: selectedCategory || undefined,
        accountId: selectedAccount,
        note: note || undefined,
        date: new Date(date).toISOString(),
      });
      setIsSuccess(true);
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Failed to create transaction');
      }
    }
  };

  const getAccountIcon = (accountType: string) => {
    switch (accountType) {
      case ACCOUNT_TYPES.CREDIT:
        return <CreditCard size={18} />;
      case ACCOUNT_TYPES.CASH:
        return <Wallet size={18} />;
      default:
        return <Banknote size={18} />;
    }
  };

  const getAccountColor = (accountType: string) => {
    switch (accountType) {
      case ACCOUNT_TYPES.CREDIT:
        return 'bg-purple-500/20 text-purple-400';
      case ACCOUNT_TYPES.CASH:
        return 'bg-amber-500/20 text-amber-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  if (accountsLoading || categoriesLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Spinner className="mx-auto h-10 w-10" />
          <p className="mt-4 text-sm text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-scale-in text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500">
            <Check size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold">Transaction Saved!</h2>
          <p className="mt-2 text-muted">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 mb-6 flex items-center gap-4 bg-background/80 py-4 backdrop-blur-xl">
        <button
          onClick={() => router.back()}
          className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all hover:bg-white/10"
        >
          <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-0.5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">New Transaction</h1>
          <p className="text-xs text-muted">Add income or expense</p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all hover:bg-white/10"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
        {/* Type Switcher */}
        <div className="flex justify-center">
          <div className="relative inline-flex rounded-2xl bg-white/5 p-1.5">
            <div
              className={`absolute top-1.5 h-[calc(100%-12px)] w-[calc(50%-6px)] rounded-xl transition-all duration-300 ease-out ${
                type === TRANSACTION_TYPES.EXPENSE
                  ? 'left-1.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 shadow-lg shadow-red-500/10'
                  : 'left-[calc(50%+3px)] bg-gradient-to-r from-emerald-500/20 to-teal-500/20 shadow-lg shadow-emerald-500/10'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                setType(TRANSACTION_TYPES.EXPENSE);
                setSelectedCategory('');
              }}
              className={`relative z-10 flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all ${
                type === TRANSACTION_TYPES.EXPENSE ? 'text-red-400' : 'text-muted hover:text-text'
              }`}
            >
              <ArrowUpRight size={18} /> Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType(TRANSACTION_TYPES.INCOME);
                setSelectedCategory('');
              }}
              className={`relative z-10 flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all ${
                type === TRANSACTION_TYPES.INCOME
                  ? 'text-emerald-400'
                  : 'text-muted hover:text-text'
              }`}
            >
              <ArrowDownRight size={18} /> Income
            </button>
          </div>
        </div>

        {/* Amount Input - Hero Style */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/5 p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-gradient-to-br from-secondary/20 to-transparent blur-3xl" />

          <div className="relative">
            <label className="mb-4 block text-center text-xs font-bold uppercase tracking-[0.2em] text-muted">
              Amount
            </label>
            <div className="flex items-center justify-center gap-2">
              <span
                className={`text-4xl font-bold transition-colors ${numAmount > 0 ? 'text-white' : 'text-muted'}`}
              >
                {getCurrencySymbol(currency)}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  if (submitError) setSubmitError(null);
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = val.split('.');
                  if (parts.length > 2) return;
                  if (parts[1] && parts[1].length > 2) return;
                  setAmount(val);
                }}
                placeholder="0"
                className={`w-full max-w-[200px] bg-transparent text-center text-6xl font-bold placeholder-white/20 focus:outline-none ${
                  isInsufficientFunds ? 'text-red-400' : 'text-white'
                }`}
                autoFocus
              />
            </div>

            {type === TRANSACTION_TYPES.EXPENSE && currentAccount && availableFunds !== null && (
              <div
                className={`mt-4 text-center text-sm ${isInsufficientFunds ? 'text-red-400' : 'text-muted'}`}
              >
                Available:{' '}
                <span className="font-semibold">{formatCurrency(availableFunds, currency)}</span>
              </div>
            )}

            {isInsufficientFunds && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-red-400">
                <AlertCircle size={16} className="animate-pulse" />
                <span>
                  Exceeds available{' '}
                  {currentAccount?.type === ACCOUNT_TYPES.CREDIT ? 'credit' : 'balance'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Account & Category Dropdowns */}
        <div className="grid grid-cols-2 gap-3">
          {/* Account Dropdown */}
          <div className="relative" ref={accountDropdownRef}>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted">
              Account
            </label>
            <button
              type="button"
              onClick={() => {
                setShowAccountDropdown(!showAccountDropdown);
                setShowCategoryDropdown(false);
              }}
              className={`flex w-full items-center gap-3 rounded-2xl border bg-white/5 p-3 transition-all hover:bg-white/10 ${
                showAccountDropdown ? 'border-primary/50' : 'border-white/10'
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${currentAccount ? getAccountColor(currentAccount.type) : 'bg-white/10'}`}
              >
                {currentAccount && getAccountIcon(currentAccount.type)}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold">{currentAccount?.name || 'Select'}</p>
                <p className="truncate text-xs text-muted">
                  {currentAccount && formatCurrency(toNumber(currentAccount.balance), currency)}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`flex-shrink-0 text-muted transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Account Dropdown List */}
            {showAccountDropdown && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-white/10 bg-surface/95 p-2 shadow-2xl backdrop-blur-xl">
                {accounts?.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => {
                      setSelectedAccount(account.id);
                      setShowAccountDropdown(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 transition-all ${
                      selectedAccount === account.id ? 'bg-primary/20' : 'hover:bg-white/10'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${getAccountColor(account.type)}`}
                    >
                      {getAccountIcon(account.type)}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-medium">{account.name}</p>
                      <p className="text-xs text-muted">
                        {formatCurrency(toNumber(account.balance), currency)}
                      </p>
                    </div>
                    {selectedAccount === account.id && (
                      <Check size={16} className="flex-shrink-0 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="relative" ref={categoryDropdownRef}>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted">
              Category
            </label>
            <button
              type="button"
              onClick={() => {
                setShowCategoryDropdown(!showCategoryDropdown);
                setShowAccountDropdown(false);
              }}
              className={`flex w-full items-center gap-3 rounded-2xl border bg-white/5 p-3 transition-all hover:bg-white/10 ${
                showCategoryDropdown ? 'border-primary/50' : 'border-white/10'
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${
                  type === TRANSACTION_TYPES.EXPENSE ? 'bg-red-500/10' : 'bg-emerald-500/10'
                }`}
              >
                {categoryIcons[currentCategory?.name || ''] || '📌'}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold">
                  {currentCategory?.name || 'Select'}
                </p>
                <p className="text-xs text-muted">Tap to change</p>
              </div>
              <ChevronDown
                size={16}
                className={`flex-shrink-0 text-muted transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Category Dropdown List */}
            {showCategoryDropdown && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-white/10 bg-surface/95 p-2 shadow-2xl backdrop-blur-xl">
                {categories?.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setShowCategoryDropdown(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 transition-all ${
                      selectedCategory === category.id
                        ? type === TRANSACTION_TYPES.EXPENSE
                          ? 'bg-red-500/20'
                          : 'bg-emerald-500/20'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg ${
                        type === TRANSACTION_TYPES.EXPENSE ? 'bg-red-500/10' : 'bg-emerald-500/10'
                      }`}
                    >
                      {categoryIcons[category.name] || '📌'}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{category.name}</p>
                    </div>
                    {selectedCategory === category.id && (
                      <Check
                        size={16}
                        className={
                          type === TRANSACTION_TYPES.EXPENSE ? 'text-red-400' : 'text-emerald-400'
                        }
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Date & Note */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all focus-within:border-primary/50">
            <label className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-muted">
              <Calendar size={12} /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent font-semibold focus:outline-none"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all focus-within:border-primary/50">
            <label className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-muted">
              <FileText size={12} /> Note
            </label>
            <input
              type="text"
              placeholder="Optional"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-transparent font-semibold placeholder-white/30 focus:outline-none"
            />
          </div>
        </div>

        {/* Error Display */}
        {submitError && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <AlertCircle size={20} className="flex-shrink-0 text-red-400" />
            <span className="text-sm text-red-400">{submitError}</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={
            !amount || parseFloat(amount) <= 0 || createTransaction.isPending || isInsufficientFunds
          }
          className={`relative overflow-hidden rounded-2xl py-5 text-lg font-bold transition-all ${
            !amount || parseFloat(amount) <= 0 || isInsufficientFunds
              ? 'bg-white/10 text-muted'
              : type === TRANSACTION_TYPES.EXPENSE
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
          }`}
        >
          {createTransaction.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner className="h-5 w-5" /> Saving...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Sparkles size={20} /> Save Transaction
            </span>
          )}
        </Button>
      </form>

      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
