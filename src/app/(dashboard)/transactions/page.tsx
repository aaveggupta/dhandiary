'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Plus,
  Trash2,
  Pencil,
  X,
  AlertCircle,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { Card, Button, Spinner, Input, Select } from '@/components/ui';
import {
  useTransactions,
  useDeleteTransaction,
  useUpdateTransaction,
  useAccounts,
  useCategories,
  useSettings,
} from '@/hooks';
import { formatCurrency, formatRelativeDate } from '@/lib/utils';
import { TRANSACTION_TYPES, ACCOUNT_TYPES } from '@/lib/constants';
import type { Transaction, TransactionType } from '@/types';
import Link from 'next/link';

interface EditFormState {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string | null;
  accountId: string;
  note: string | null;
}

// Category icons mapping
const categoryIcons: Record<string, string> = {
  'Bills & Utilities': '🏠',
  'Education': '📚',
  'Entertainment': '🎬',
  'Food & Dining': '🍔',
  'Healthcare': '🏥',
  'Other': '📦',
  'Shopping': '🛍️',
  'Transportation': '🚗',
  'Freelance': '💼',
  'Gift': '🎁',
  'Investment': '📈',
  'Other Income': '💰',
  'Salary': '💵',
};

function TransactionsContent() {
  const searchParams = useSearchParams();
  const accountIdFromUrl = searchParams.get('accountId') || undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>();
  const [accountFilter, setAccountFilter] = useState<string | undefined>(accountIdFromUrl);
  const [editingTransaction, setEditingTransaction] = useState<EditFormState | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: transactionsData, isLoading } = useTransactions({
    search: searchQuery || undefined,
    type: typeFilter,
    accountId: accountFilter,
  });
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: settings } = useSettings();
  const deleteTransaction = useDeleteTransaction();
  const updateTransaction = useUpdateTransaction();

  const currency = settings?.currency || 'USD';
  const transactions = transactionsData?.data || [];

  const filteredAccount = accountFilter ? accounts?.find((a) => a.id === accountFilter) : null;

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction.mutateAsync(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const getAvailableFundsForEdit = () => {
    if (!editingTransaction) return null;
    const account = accounts?.find((a) => a.id === editingTransaction.accountId);
    if (!account) return null;

    const originalTransaction = transactions.find((t) => t.id === editingTransaction.id);
    let adjustedBalance = Number(account.balance);

    if (originalTransaction) {
      if (originalTransaction.type === TRANSACTION_TYPES.EXPENSE) {
        adjustedBalance += Number(originalTransaction.amount);
      } else if (originalTransaction.type === TRANSACTION_TYPES.INCOME) {
        adjustedBalance -= Number(originalTransaction.amount);
      }
    }

    if (account.type === ACCOUNT_TYPES.CREDIT) {
      const currentDebt = Math.abs(adjustedBalance);
      return (Number(account.creditLimit) || 0) - currentDebt;
    }
    return adjustedBalance;
  };

  const validateEdit = (): string | null => {
    if (!editingTransaction) return 'No transaction selected';
    const amount = Number(editingTransaction.amount);
    if (isNaN(amount) || amount <= 0) return 'Amount must be a positive number';

    if (editingTransaction.type === TRANSACTION_TYPES.EXPENSE) {
      const available = getAvailableFundsForEdit();
      if (available !== null && amount > available) {
        const account = accounts?.find((a) => a.id === editingTransaction.accountId);
        const isCredit = account?.type === ACCOUNT_TYPES.CREDIT;
        return `Insufficient ${isCredit ? 'credit' : 'balance'}. Available: ${formatCurrency(available, currency)}`;
      }
    }
    return null;
  };

  const handleUpdate = async () => {
    if (!editingTransaction) return;
    const validationError = validateEdit();
    if (validationError) {
      setEditError(validationError);
      return;
    }

    try {
      await updateTransaction.mutateAsync({
        id: editingTransaction.id,
        amount: Number(editingTransaction.amount),
        type: editingTransaction.type,
        categoryId: editingTransaction.categoryId || undefined,
        note: editingTransaction.note || undefined,
      });
      setEditingTransaction(null);
      setEditError(null);
    } catch (error) {
      if (error instanceof Error) {
        setEditError(error.message);
      } else {
        setEditError('Failed to update transaction');
      }
    }
  };

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups: Record<string, typeof transactions>, transaction) => {
    const date = new Date(transaction.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Spinner className="mx-auto h-10 w-10" />
          <p className="mt-4 text-sm text-muted">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          {filteredAccount ? (
            <p className="mt-1 text-sm text-muted">
              Showing transactions for <span className="font-semibold text-primary">{filteredAccount.name}</span>
              <button
                onClick={() => setAccountFilter(undefined)}
                className="ml-2 rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400 hover:bg-red-500/20"
              >
                Clear
              </button>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">Track and manage all your transactions</p>
          )}
        </div>
        <Link href="/transactions/add">
          <Button className="group bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/25 hover:shadow-primary/40">
            <Plus size={18} className="mr-2 transition-transform group-hover:rotate-90" />
            Add Transaction
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
              <TrendingUp size={14} className="text-emerald-400" /> Income
            </div>
            <p className="text-2xl font-bold text-emerald-400">+{formatCurrency(totalIncome, currency)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
              <TrendingDown size={14} className="text-red-400" /> Expenses
            </div>
            <p className="text-2xl font-bold text-red-400">-{formatCurrency(totalExpense, currency)}</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 sm:col-span-1">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
              <Sparkles size={14} className="text-primary" /> Net
            </div>
            <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalIncome - totalExpense >= 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpense, currency)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm placeholder-white/40 transition-all focus:border-primary/50 focus:bg-primary/5 focus:outline-none"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex gap-2">
          {[
            { value: undefined, label: 'All', icon: null },
            { value: TRANSACTION_TYPES.INCOME, label: 'Income', icon: <ArrowDownRight size={14} /> },
            { value: TRANSACTION_TYPES.EXPENSE, label: 'Expense', icon: <ArrowUpRight size={14} /> },
          ].map((filter) => (
            <button
              key={filter.label}
              onClick={() => setTypeFilter(filter.value)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                typeFilter === filter.value
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-white/5 text-muted hover:bg-white/10 hover:text-text'
              }`}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>

        {/* Account Filter */}
        {accounts && accounts.length > 0 && (
          <select
            value={accountFilter || ''}
            onChange={(e) => setAccountFilter(e.target.value || undefined)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-text focus:border-primary focus:outline-none"
          >
            <option value="">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Transactions List - Grouped by Date */}
      <div className="space-y-6">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 py-20">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
              <Search size={40} className="text-muted" />
            </div>
            <p className="mb-2 text-lg font-semibold">No transactions found</p>
            <p className="mb-6 text-sm text-muted">Start tracking your money by adding your first transaction</p>
            <Link href="/transactions/add">
              <Button className="bg-gradient-to-r from-primary to-secondary">
                <Plus size={18} className="mr-2" /> Add Transaction
              </Button>
            </Link>
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
            <div key={date}>
              <div className="mb-3 flex items-center gap-3">
                <Calendar size={14} className="text-muted" />
                <h3 className="text-sm font-semibold text-muted">{date}</h3>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="space-y-2">
                {dateTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="flex items-center gap-4">
                      {/* Category Icon */}
                      <div
                        className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-2xl transition-transform group-hover:scale-110 ${
                          t.type === TRANSACTION_TYPES.INCOME
                            ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20'
                            : 'bg-gradient-to-br from-red-500/20 to-orange-500/20'
                        }`}
                      >
                        {categoryIcons[t.category?.name || ''] || (
                          t.type === TRANSACTION_TYPES.INCOME ? (
                            <ArrowDownRight className="text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="text-red-400" />
                          )
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{t.category?.name || 'Uncategorized'}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                          <span className="rounded-full bg-white/10 px-2 py-0.5">{t.account?.name}</span>
                          {t.note && <span className="truncate max-w-[200px]">{t.note}</span>}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <p
                          className={`text-xl font-bold ${
                            t.type === TRANSACTION_TYPES.INCOME ? 'text-emerald-400' : 'text-white'
                          }`}
                        >
                          {t.type === TRANSACTION_TYPES.INCOME ? '+' : '-'}
                          {formatCurrency(Number(t.amount), currency)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 opacity-0 transition-all group-hover:opacity-100">
                        <button
                          onClick={() =>
                            setEditingTransaction({
                              id: t.id,
                              amount: Number(t.amount),
                              type: t.type,
                              categoryId: t.categoryId,
                              accountId: t.accountId,
                              note: t.note,
                            })
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-muted transition-all hover:bg-primary/20 hover:text-primary"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(t.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-muted transition-all hover:bg-red-500/20 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-scale-in rounded-3xl border border-white/10 bg-surface p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Transaction</h2>
              <button
                onClick={() => {
                  setEditingTransaction(null);
                  setEditError(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-muted hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Amount"
                type="number"
                value={editingTransaction.amount}
                onChange={(e) => {
                  setEditError(null);
                  setEditingTransaction({
                    ...editingTransaction,
                    amount: parseFloat(e.target.value) || 0,
                  });
                }}
              />

              {editingTransaction.type === TRANSACTION_TYPES.EXPENSE && (
                <p className="text-sm text-muted">
                  Available: <span className="font-semibold text-text">{formatCurrency(getAvailableFundsForEdit() || 0, currency)}</span>
                </p>
              )}

              <Select
                label="Type"
                value={editingTransaction.type}
                onChange={(e) => {
                  setEditError(null);
                  setEditingTransaction({
                    ...editingTransaction,
                    type: e.target.value as TransactionType,
                    categoryId: null,
                  });
                }}
                options={[
                  { value: TRANSACTION_TYPES.EXPENSE, label: 'Expense' },
                  { value: TRANSACTION_TYPES.INCOME, label: 'Income' },
                ]}
              />

              <Select
                label="Category"
                value={editingTransaction.categoryId || ''}
                onChange={(e) =>
                  setEditingTransaction({
                    ...editingTransaction,
                    categoryId: e.target.value || null,
                  })
                }
                options={[
                  { value: '', label: 'Uncategorized' },
                  ...(categories?.filter((c) => c.type === editingTransaction.type).map((c) => ({
                    value: c.id,
                    label: c.name,
                  })) || []),
                ]}
              />

              <Input
                label="Note (optional)"
                value={editingTransaction.note || ''}
                onChange={(e) =>
                  setEditingTransaction({
                    ...editingTransaction,
                    note: e.target.value,
                  })
                }
              />
            </div>

            {editError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                <AlertCircle size={16} />
                <span>{editError}</span>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingTransaction(null);
                  setEditError(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateTransaction.isPending || Number(editingTransaction.amount) <= 0}
                className="flex-1 bg-gradient-to-r from-primary to-secondary"
              >
                {updateTransaction.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-scale-in rounded-3xl border border-white/10 bg-surface p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <Trash2 size={32} className="text-red-500" />
            </div>
            <h2 className="mb-2 text-xl font-bold">Delete Transaction?</h2>
            <p className="mb-6 text-sm text-muted">
              This will permanently delete this transaction and update your account balance.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteTransaction.isPending}
                className="flex-1"
              >
                {deleteTransaction.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes scale-in {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <TransactionsContent />
    </Suspense>
  );
}
