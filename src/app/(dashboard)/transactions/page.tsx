'use client';

import { useState, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Trash2,
  X,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Download,
} from 'lucide-react';
import type { SortingState, PaginationState } from '@tanstack/react-table';
import { Button, Spinner, Input, Select } from '@/components/ui';
import { DataTable, TableFilters } from '@/components/shared';
import {
  useTransactions,
  useDeleteTransaction,
  useUpdateTransaction,
  useAccounts,
  useCategories,
  useSettings,
  useExportTransactions,
} from '@/hooks';
import { useDebounce } from '@/hooks/use-debounce';
import { formatCurrency, toNumber, roundMoney, getCreditCardStatus } from '@/lib/finance';
import { TRANSACTION_TYPES, ACCOUNT_TYPES } from '@/lib/constants';
import { getTransactionColumns, type TransactionTableMeta } from './columns';
import type { Transaction, TransactionType } from '@/types';
import Link from 'next/link';

const PAGE_SIZE = 20;

interface EditFormState {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string | null;
  accountId: string;
  originalAccountId: string;
  destinationAccountId: string | null;
  originalDestinationAccountId: string | null;
  note: string | null;
  date: string;
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const accountIdFromUrl = searchParams.get('accountId') || undefined;

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>();
  const [accountFilter, setAccountFilter] = useState<string | undefined>(accountIdFromUrl);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  // Modal state
  const [editingTransaction, setEditingTransaction] = useState<EditFormState | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery);

  // Reset pagination when filters change
  const handleFilterChange = useCallback(
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
      (value: T) => {
        setter(value);
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      },
    []
  );

  const { data: transactionsData, isLoading } = useTransactions({
    search: debouncedSearch || undefined,
    type: typeFilter,
    accountId: accountFilter,
    categoryId: categoryFilter,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate + 'T23:59:59.999Z') : undefined,
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
  });
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: settings } = useSettings();
  const deleteTransaction = useDeleteTransaction();
  const updateTransaction = useUpdateTransaction();
  const { exportCSV, isExporting, exportError, clearExportError } = useExportTransactions();

  const currency = settings?.currency || 'USD';
  const transactions = transactionsData?.data || [];
  const totalCount = transactionsData?.meta?.total || 0;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  // Summary calculations
  const totalIncome = roundMoney(
    transactions
      .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
      .reduce((sum, t) => sum + toNumber(t.amount), 0)
  );
  const totalExpense = roundMoney(
    transactions
      .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
      .reduce((sum, t) => sum + toNumber(t.amount), 0)
  );

  const columns = useMemo(() => getTransactionColumns(), []);

  const handleEdit = useCallback((transaction: Transaction) => {
    setEditingTransaction({
      id: transaction.id,
      amount: toNumber(transaction.amount),
      type: transaction.type,
      categoryId: transaction.categoryId,
      accountId: transaction.accountId,
      originalAccountId: transaction.accountId,
      destinationAccountId: transaction.destinationAccountId ?? null,
      originalDestinationAccountId: transaction.destinationAccountId ?? null,
      note: transaction.note,
      date: new Date(transaction.date).toISOString().split('T')[0],
    });
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteConfirm(id);
  }, []);

  const tableMeta: TransactionTableMeta = useMemo(
    () => ({
      onEdit: handleEdit,
      onDelete: handleDeleteClick,
      currency,
    }),
    [handleEdit, handleDeleteClick, currency]
  );

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
    let adjustedBalance = toNumber(account.balance);

    // Only reverse the original transaction's effect if we're editing on the same account
    if (
      originalTransaction &&
      editingTransaction.accountId === editingTransaction.originalAccountId
    ) {
      if (originalTransaction.type === TRANSACTION_TYPES.EXPENSE) {
        adjustedBalance += toNumber(originalTransaction.amount);
      } else if (originalTransaction.type === TRANSACTION_TYPES.INCOME) {
        adjustedBalance -= toNumber(originalTransaction.amount);
      } else if (originalTransaction.type === TRANSACTION_TYPES.TRANSFER) {
        adjustedBalance += toNumber(originalTransaction.amount);
      }
    }

    if (account.type === ACCOUNT_TYPES.CREDIT) {
      const cardStatus = getCreditCardStatus({
        balance: adjustedBalance,
        creditLimit: toNumber(account.creditLimit),
      });
      return cardStatus.availableCredit;
    }
    return adjustedBalance;
  };

  const validateEdit = (): string | null => {
    if (!editingTransaction) return 'No transaction selected';
    const amount = toNumber(editingTransaction.amount);
    if (isNaN(amount) || amount <= 0) return 'Amount must be a positive number';

    if (editingTransaction.type === TRANSACTION_TYPES.TRANSFER) {
      if (!editingTransaction.destinationAccountId) {
        return 'Destination account is required for transfers';
      }
      if (editingTransaction.accountId === editingTransaction.destinationAccountId) {
        return 'Source and destination accounts must be different';
      }
    }

    if (
      editingTransaction.type === TRANSACTION_TYPES.EXPENSE ||
      editingTransaction.type === TRANSACTION_TYPES.TRANSFER
    ) {
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
        amount: toNumber(editingTransaction.amount),
        type: editingTransaction.type,
        categoryId: editingTransaction.categoryId || undefined,
        accountId: editingTransaction.accountId,
        destinationAccountId:
          editingTransaction.type === TRANSACTION_TYPES.TRANSFER
            ? editingTransaction.destinationAccountId
            : null,
        note: editingTransaction.note || undefined,
        date: new Date(editingTransaction.date),
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

  const filteredAccount = accountFilter ? accounts?.find((a) => a.id === accountFilter) : null;
  const isEditTransfer = editingTransaction?.type === TRANSACTION_TYPES.TRANSFER;

  const footerContent = totalCount > 0 && (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span>
        Showing{' '}
        <span className="font-semibold text-text">
          {Math.min(pagination.pageIndex * pagination.pageSize + 1, totalCount)}
        </span>
        {' — '}
        <span className="font-semibold text-text">
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCount)}
        </span>
        {' of '}
        <span className="font-semibold text-text">{totalCount}</span> transactions
      </span>
      {transactions.length > 0 && (
        <>
          <span className="text-emerald-400">+{formatCurrency(totalIncome, currency)}</span>
          <span className="text-red-400">-{formatCurrency(totalExpense, currency)}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          {filteredAccount ? (
            <p className="mt-1 text-sm text-muted">
              Showing transactions for{' '}
              <span className="font-semibold text-primary">{filteredAccount.name}</span>
              <button
                onClick={() => handleFilterChange(setAccountFilter)(undefined)}
                className="ml-2 rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400 hover:bg-red-500/20"
              >
                Clear
              </button>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">Track and manage all your transactions</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              exportCSV({
                type: typeFilter,
                accountId: accountFilter,
                categoryId: categoryFilter,
                startDate: startDate ? new Date(startDate).toISOString() : undefined,
                endDate: endDate ? new Date(endDate + 'T23:59:59.999Z').toISOString() : undefined,
                search: debouncedSearch || undefined,
              })
            }
            disabled={totalCount === 0 || isExporting}
          >
            {isExporting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={18} className="mr-2" />
                Export CSV
              </>
            )}
          </Button>
          <Link href="/transactions/add">
            <Button className="group bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/25 hover:shadow-primary/40">
              <Plus size={18} className="mr-2 transition-transform group-hover:rotate-90" />
              Add Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* Export Error */}
      {exportError && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{exportError}</span>
          </div>
          <button
            onClick={clearExportError}
            className="ml-4 flex h-6 w-6 items-center justify-center rounded-full hover:bg-red-500/20"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
              <TrendingUp size={14} className="text-emerald-400" /> Income
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              +{formatCurrency(totalIncome, currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
              <TrendingDown size={14} className="text-red-400" /> Expenses
            </div>
            <p className="text-2xl font-bold text-red-400">
              -{formatCurrency(totalExpense, currency)}
            </p>
          </div>
          <div className="col-span-2 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 sm:col-span-1">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
              <Sparkles size={14} className="text-primary" /> Net
            </div>
            <p
              className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {totalIncome - totalExpense >= 0 ? '+' : ''}
              {formatCurrency(totalIncome - totalExpense, currency)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <TableFilters
        searchQuery={searchQuery}
        onSearchChange={handleFilterChange(setSearchQuery)}
        typeFilter={typeFilter}
        onTypeFilterChange={handleFilterChange(setTypeFilter)}
        accountFilter={accountFilter}
        onAccountFilterChange={handleFilterChange(setAccountFilter)}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={handleFilterChange(setCategoryFilter)}
        startDate={startDate}
        onStartDateChange={handleFilterChange(setStartDate)}
        endDate={endDate}
        onEndDateChange={handleFilterChange(setEndDate)}
        accounts={accounts}
        categories={categories}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={transactions}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={isLoading && transactions.length === 0}
        footer={footerContent}
        emptyMessage="No transactions found"
        emptyAction={
          <Link href="/transactions/add">
            <Button className="bg-gradient-to-r from-primary to-secondary">
              <Plus size={18} className="mr-2" /> Add Transaction
            </Button>
          </Link>
        }
        meta={tableMeta}
      />

      {/* Edit Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="animate-scale-in w-full max-w-md rounded-3xl border border-white/10 bg-surface p-6">
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

              {(editingTransaction.type === TRANSACTION_TYPES.EXPENSE ||
                editingTransaction.type === TRANSACTION_TYPES.TRANSFER) && (
                <p className="text-sm text-muted">
                  Available:{' '}
                  <span className="font-semibold text-text">
                    {formatCurrency(getAvailableFundsForEdit() || 0, currency)}
                  </span>
                </p>
              )}

              <Select
                label="Type"
                value={editingTransaction.type}
                onChange={(e) => {
                  setEditError(null);
                  const newType = e.target.value as TransactionType;
                  setEditingTransaction({
                    ...editingTransaction,
                    type: newType,
                    categoryId: null,
                    destinationAccountId:
                      newType === TRANSACTION_TYPES.TRANSFER
                        ? editingTransaction.destinationAccountId
                        : null,
                  });
                }}
                options={[
                  { value: TRANSACTION_TYPES.EXPENSE, label: 'Expense' },
                  { value: TRANSACTION_TYPES.INCOME, label: 'Income' },
                  { value: TRANSACTION_TYPES.TRANSFER, label: 'Transfer' },
                ]}
              />

              {accounts && accounts.length > 0 && (
                <Select
                  label={isEditTransfer ? 'From Account' : 'Account'}
                  value={editingTransaction.accountId}
                  onChange={(e) => {
                    setEditError(null);
                    const newAccountId = e.target.value;
                    setEditingTransaction({
                      ...editingTransaction,
                      accountId: newAccountId,
                      // Clear destination if it now matches source
                      destinationAccountId:
                        editingTransaction.destinationAccountId === newAccountId
                          ? null
                          : editingTransaction.destinationAccountId,
                    });
                  }}
                  options={accounts.map((acc) => ({
                    value: acc.id,
                    label: acc.name,
                  }))}
                />
              )}

              {isEditTransfer && accounts && accounts.length > 1 && (
                <Select
                  label="To Account"
                  value={editingTransaction.destinationAccountId || ''}
                  onChange={(e) => {
                    setEditError(null);
                    setEditingTransaction({
                      ...editingTransaction,
                      destinationAccountId: e.target.value || null,
                    });
                  }}
                  options={[
                    { value: '', label: 'Select destination...' },
                    ...accounts
                      .filter((acc) => acc.id !== editingTransaction.accountId)
                      .map((acc) => ({
                        value: acc.id,
                        label: acc.name,
                      })),
                  ]}
                />
              )}

              {!isEditTransfer && (
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
              )}

              <Input
                label="Date"
                type="date"
                value={editingTransaction.date}
                onChange={(e) =>
                  setEditingTransaction({
                    ...editingTransaction,
                    date: e.target.value,
                  })
                }
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
                disabled={updateTransaction.isPending || toNumber(editingTransaction.amount) <= 0}
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
          <div className="animate-scale-in w-full max-w-sm rounded-3xl border border-white/10 bg-surface p-6 text-center">
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
          0% {
            transform: scale(0.95);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
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
