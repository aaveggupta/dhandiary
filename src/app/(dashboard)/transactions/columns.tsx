'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui';
import { CategoryIcon } from '@/lib/category-icons';
import { formatDate } from '@/lib/utils';
import { toNumber, formatCurrency } from '@/lib/finance';
import { TRANSACTION_TYPES, TRANSACTION_TYPE_CONFIG } from '@/lib/constants';
import type { Transaction } from '@/types';

export interface TransactionTableMeta {
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  currency: string;
}

const columnHelper = createColumnHelper<Transaction>();

export function getTransactionColumns() {
  return [
    columnHelper.accessor('date', {
      header: 'Date',
      cell: (info) => (
        <span className="whitespace-nowrap text-sm text-text">{formatDate(info.getValue())}</span>
      ),
      size: 120,
    }),
    columnHelper.accessor((row) => row.category?.name ?? 'Uncategorized', {
      id: 'category',
      header: 'Category',
      cell: (info) => {
        const row = info.row.original;
        const color =
          row.category?.color || (row.type === TRANSACTION_TYPES.INCOME ? '#10b981' : '#ef4444');
        return (
          <div className="flex items-center gap-2">
            <CategoryIcon icon={row.category?.icon} color={color} size={16} />
            <span className="text-sm">{info.getValue()}</span>
          </div>
        );
      },
      size: 160,
    }),
    columnHelper.accessor((row) => row.account?.name ?? '', {
      id: 'account',
      header: 'Account',
      cell: (info) => (
        <span className="hidden whitespace-nowrap rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-muted md:inline-block">
          {info.getValue()}
        </span>
      ),
      meta: { className: 'hidden md:table-cell' },
      size: 140,
    }),
    columnHelper.accessor('note', {
      header: 'Note',
      cell: (info) => (
        <span className="hidden max-w-[200px] truncate text-sm text-muted md:inline-block">
          {info.getValue() || '—'}
        </span>
      ),
      enableSorting: false,
      meta: { className: 'hidden md:table-cell' },
      size: 200,
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: (info) => {
        const type = info.getValue();
        const config = TRANSACTION_TYPE_CONFIG[type];
        const variant = type === TRANSACTION_TYPES.INCOME ? 'success' : 'danger';
        return <Badge variant={variant}>{config.label}</Badge>;
      },
      size: 100,
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: (info) => {
        const row = info.row.original;
        const amount = toNumber(info.getValue());
        const currency = (info.table.options.meta as TransactionTableMeta)?.currency || 'INR';
        const isIncome = row.type === TRANSACTION_TYPES.INCOME;
        return (
          <span
            className={`whitespace-nowrap text-sm font-semibold ${
              isIncome ? 'text-emerald-400' : 'text-white'
            }`}
          >
            {isIncome ? '+' : '-'}
            {formatCurrency(amount, currency)}
          </span>
        );
      },
      size: 130,
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: (info) => {
        const meta = info.table.options.meta as TransactionTableMeta;
        const row = info.row.original;
        return (
          <div className="flex justify-end gap-1">
            <button
              onClick={() => meta.onEdit(row)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-muted transition-all hover:bg-primary/20 hover:text-primary"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => meta.onDelete(row.id)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-muted transition-all hover:bg-red-500/20 hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      },
      size: 80,
    }),
  ];
}
