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

// Edit form state type (with number instead of Decimal)
interface EditFormState {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string | null;
  accountId: string;
  note: string | null;
}

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

  // Get the account name if filtering by account
  const filteredAccount = accountFilter ? accounts?.find((a) => a.id === accountFilter) : null;

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction.mutateAsync(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // Get available funds for validation
  const getAvailableFundsForEdit = () => {
    if (!editingTransaction) return null;
    const account = accounts?.find((a) => a.id === editingTransaction.accountId);
    if (!account) return null;

    // When editing, we need to add back the original transaction's effect first
    const originalTransaction = transactions.find((t) => t.id === editingTransaction.id);
    let adjustedBalance = Number(account.balance);

    if (originalTransaction) {
      // Reverse the original transaction's effect
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
    if (isNaN(amount) || amount <= 0) {
      return 'Amount must be a positive number';
    }

    // Check available funds for expenses
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
      console.error('Error updating transaction:', error);
      if (error instanceof Error) {
        setEditError(error.message);
      } else {
        setEditError('Failed to update transaction');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          {filteredAccount ? (
            <p className="text-sm text-muted">
              Showing transactions for <span className="text-primary">{filteredAccount.name}</span>
              <button
                onClick={() => setAccountFilter(undefined)}
                className="ml-2 text-xs text-red-400 hover:underline"
              >
                Clear filter
              </button>
            </p>
          ) : (
            <p className="text-sm text-muted">Manage and track your history.</p>
          )}
        </div>
        <Link href="/transactions/add">
          <Button icon={<Plus size={16} />}>Add Transaction</Button>
        </Link>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col gap-3 md:flex-row">
        {/* SEARCH BAR */}
        <Card className="flex flex-1 items-center gap-2 p-2" variant="default">
          <Search size={20} className="ml-2 text-muted" />
          <input
            className="w-full bg-transparent py-2 text-sm text-text placeholder-zinc-600 focus:outline-none"
            placeholder="Search by note or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Card>

        {/* TYPE FILTER */}
        <div className="flex gap-2">
          <Button
            variant={typeFilter === undefined ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setTypeFilter(undefined)}
          >
            All
          </Button>
          <Button
            variant={typeFilter === TRANSACTION_TYPES.INCOME ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setTypeFilter(TRANSACTION_TYPES.INCOME)}
          >
            Income
          </Button>
          <Button
            variant={typeFilter === TRANSACTION_TYPES.EXPENSE ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setTypeFilter(TRANSACTION_TYPES.EXPENSE)}
          >
            Expenses
          </Button>
        </div>

        {/* ACCOUNT FILTER */}
        {accounts && accounts.length > 0 && (
          <select
            value={accountFilter || ''}
            onChange={(e) => setAccountFilter(e.target.value || undefined)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
          >
            <option value="">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* TRANSACTIONS LIST */}
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <Card className="flex flex-col items-center justify-center border-dashed py-20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-zinc-600">
              <Search size={32} />
            </div>
            <p className="mb-4 font-medium text-muted">No transactions found</p>
            <Link href="/transactions/add">
              <Button size="sm">Add your first transaction</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-3">
            {transactions.map((t) => (
              <Card
                key={t.id}
                variant="default"
                className="group flex items-center justify-between p-4 transition-colors hover:bg-surfaceHighlight"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 transition-colors ${
                      t.type === TRANSACTION_TYPES.INCOME
                        ? 'bg-emerald-500/5 text-emerald-500 group-hover:bg-emerald-500/10'
                        : 'bg-red-500/5 text-red-500 group-hover:bg-red-500/10'
                    }`}
                  >
                    {t.type === TRANSACTION_TYPES.INCOME ? (
                      <ArrowDownRight size={20} />
                    ) : (
                      <ArrowUpRight size={20} />
                    )}
                  </div>
                  <div>
                    <p className="text-base font-semibold">{t.category?.name || 'Uncategorized'}</p>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span>{formatRelativeDate(t.date)}</span>
                      <span>•</span>
                      <span>{t.account?.name || 'Unknown Account'}</span>
                      {t.note && (
                        <>
                          <span>•</span>
                          <span className="max-w-[150px] truncate">{t.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`block font-mono text-lg font-bold ${t.type === TRANSACTION_TYPES.INCOME ? 'text-emerald-400' : 'text-text'}`}
                  >
                    {t.type === TRANSACTION_TYPES.INCOME ? '+' : '-'}
                    {formatCurrency(Number(t.amount), currency)}
                  </span>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                      className="rounded-lg bg-surfaceHighlight p-2 text-muted transition-colors hover:bg-primary/20 hover:text-primary"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(t.id)}
                      className="rounded-lg bg-surfaceHighlight p-2 text-muted transition-colors hover:bg-red-500/20 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md space-y-6 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Transaction</h2>
              <button
                onClick={() => {
                  setEditingTransaction(null);
                  setEditError(null);
                }}
                className="text-muted hover:text-text"
              >
                <X size={20} />
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

              {/* Show available balance when editing expense */}
              {editingTransaction.type === TRANSACTION_TYPES.EXPENSE && (
                <div className="text-sm text-muted">
                  Available:{' '}
                  <span className="font-semibold text-text">
                    {formatCurrency(getAvailableFundsForEdit() || 0, currency)}
                  </span>
                </div>
              )}

              <Select
                label="Type"
                value={editingTransaction.type}
                onChange={(e) => {
                  setEditError(null);
                  setEditingTransaction({
                    ...editingTransaction,
                    type: e.target.value as TransactionType,
                    categoryId: null, // Reset category when type changes
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
                  ...(categories
                    ?.filter((c) => c.type === editingTransaction.type)
                    .map((c) => ({
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

            {/* Validation Error */}
            {editError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div className="flex gap-3">
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
                className="flex-1"
              >
                {updateTransaction.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm space-y-6 p-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h2 className="mb-2 text-xl font-bold">Delete Transaction?</h2>
              <p className="text-sm text-muted">
                This will permanently delete this transaction and update your account balance.
              </p>
            </div>

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
          </Card>
        </div>
      )}
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
