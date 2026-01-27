'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Select, Spinner } from '@/components/ui';
import { useAccounts, useCategories, useCreateTransaction, useSettings } from '@/hooks';
import { TRANSACTION_TYPES, ACCOUNT_TYPES, getCurrencySymbol } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import {
  X,
  ArrowUpRight,
  ArrowDownRight,
  AlignLeft,
  Calendar,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import type { TransactionType } from '@/types';

export default function AddTransactionPage() {
  const router = useRouter();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: settings } = useSettings();
  const createTransaction = useCreateTransaction();

  const [type, setType] = useState<TransactionType>(TRANSACTION_TYPES.EXPENSE);
  const { data: categories, isLoading: categoriesLoading } = useCategories(type);

  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currency = settings?.currency || 'USD';

  // Get selected account details
  const currentAccount = accounts?.find((a) => a.id === selectedAccount);

  // Calculate available funds for the selected account
  const getAvailableFunds = () => {
    if (!currentAccount) return null;

    if (currentAccount.type === ACCOUNT_TYPES.CREDIT) {
      // For credit cards: available = creditLimit - |balance|
      const currentDebt = Math.abs(Number(currentAccount.balance));
      return (Number(currentAccount.creditLimit) || 0) - currentDebt;
    }
    // For bank/cash: available = balance
    return Number(currentAccount.balance);
  };

  const availableFunds = getAvailableFunds();
  const numAmount = parseFloat(amount) || 0;

  // Check if expense exceeds available funds
  const isInsufficientFunds =
    type === TRANSACTION_TYPES.EXPENSE && availableFunds !== null && numAmount > availableFunds;

  // Set default account when accounts load
  useEffect(() => {
    if (accounts?.length && !selectedAccount) {
      setSelectedAccount(accounts[0].id);
    }
  }, [accounts, selectedAccount]);

  // Set default category when categories load
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

    // Frontend validation for insufficient funds
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
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating transaction:', error);
      // Show backend error message
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Failed to create transaction');
      }
    }
  };

  if (accountsLoading || categoriesLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full max-w-lg animate-slide-up flex-col py-6 md:py-12">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-xl border border-border bg-surface p-2 transition-colors hover:bg-surfaceHighlight"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="flex-1 text-2xl font-bold">New Transaction</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="rounded-xl border border-border bg-surface p-2 transition-colors hover:bg-surfaceHighlight"
        >
          <X size={20} />
        </button>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Switcher */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface p-1">
            <button
              type="button"
              onClick={() => {
                setType(TRANSACTION_TYPES.EXPENSE);
                setSelectedCategory('');
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-3 font-medium transition-all ${
                type === TRANSACTION_TYPES.EXPENSE
                  ? 'border border-red-500/20 bg-red-500/10 text-red-400'
                  : 'text-muted hover:bg-surfaceHighlight hover:text-text'
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
              className={`flex items-center justify-center gap-2 rounded-lg py-3 font-medium transition-all ${
                type === TRANSACTION_TYPES.INCOME
                  ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'text-muted hover:bg-surfaceHighlight hover:text-text'
              }`}
            >
              <ArrowDownRight size={18} /> Income
            </button>
          </div>

          {/* Amount Input */}
          <div className="py-6">
            <label className="mb-3 block text-center text-xs font-bold uppercase tracking-wider text-muted">
              Amount
            </label>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold text-muted">{getCurrencySymbol(currency)}</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  // Clear error when user changes amount
                  if (submitError) setSubmitError(null);
                  // Only allow numbers and decimal point
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  // Prevent multiple decimal points
                  const parts = val.split('.');
                  if (parts.length > 2) return;
                  // Limit decimal places to 2
                  if (parts[1] && parts[1].length > 2) return;
                  setAmount(val);
                }}
                placeholder="0.00"
                className={`w-full max-w-[250px] bg-transparent text-center text-5xl font-bold placeholder-zinc-700 focus:outline-none md:text-6xl ${isInsufficientFunds ? 'text-red-400' : 'text-white'}`}
                autoFocus
              />
            </div>

            {/* Available Balance Display */}
            {type === TRANSACTION_TYPES.EXPENSE && currentAccount && availableFunds !== null && (
              <div
                className={`mt-3 text-center text-sm ${isInsufficientFunds ? 'text-red-400' : 'text-muted'}`}
              >
                {currentAccount.type === ACCOUNT_TYPES.CREDIT
                  ? 'Available Credit: '
                  : 'Available Balance: '}
                <span className="font-semibold">{formatCurrency(availableFunds, currency)}</span>
              </div>
            )}

            {/* Insufficient Funds Warning */}
            {isInsufficientFunds && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-red-400">
                <AlertCircle size={16} />
                <span>
                  Exceeds available{' '}
                  {currentAccount?.type === ACCOUNT_TYPES.CREDIT ? 'credit limit' : 'balance'}
                </span>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={
                  categories?.map((c) => ({ value: c.id, label: c.name })) || [
                    { value: '', label: 'Select category' },
                  ]
                }
              />

              <Select
                label="Account"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                options={
                  accounts?.map((a) => ({
                    value: a.id,
                    label: a.name,
                  })) || [{ value: '', label: 'Select account' }]
                }
              />
            </div>

            {/* Date Input */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">
                Date
              </label>
              <div className="relative">
                <Calendar
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 pl-12 text-text transition-colors focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Note Input */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">
                Note (Optional)
              </label>
              <div className="relative">
                <AlignLeft
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="text"
                  placeholder="What was this for?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 pl-12 text-text placeholder-zinc-600 transition-colors focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={
              !amount ||
              parseFloat(amount) <= 0 ||
              createTransaction.isPending ||
              isInsufficientFunds
            }
          >
            {createTransaction.isPending ? 'Saving...' : 'Save Transaction'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
