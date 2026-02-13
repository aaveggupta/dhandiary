'use client';

import React, { useState } from 'react';
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { TRANSACTION_TYPES } from '@/lib/constants';
import type { TransactionType, Account, Category } from '@/types';

interface TableFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  typeFilter?: TransactionType;
  onTypeFilterChange: (value?: TransactionType) => void;
  accountFilter?: string;
  onAccountFilterChange: (value?: string) => void;
  categoryFilter?: string;
  onCategoryFilterChange: (value?: string) => void;
  startDate?: string;
  onStartDateChange: (value?: string) => void;
  endDate?: string;
  onEndDateChange: (value?: string) => void;
  accounts?: Account[];
  categories?: Category[];
}

export function TableFilters({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  accountFilter,
  onAccountFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  accounts,
  categories,
}: TableFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const hasActiveFilters = !!(
    typeFilter ||
    accountFilter ||
    categoryFilter ||
    startDate ||
    endDate
  );

  const clearFilters = () => {
    onTypeFilterChange(undefined);
    onAccountFilterChange(undefined);
    onCategoryFilterChange(undefined);
    onStartDateChange(undefined);
    onEndDateChange(undefined);
  };

  const filteredCategories = categories?.filter((c) => !typeFilter || c.type === typeFilter);

  return (
    <div className="space-y-3">
      {/* Primary row: search + type pills + expand toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm placeholder-white/40 transition-all focus:border-primary/50 focus:bg-primary/5 focus:outline-none"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex gap-2">
          {[
            { value: undefined as TransactionType | undefined, label: 'All', icon: null },
            {
              value: TRANSACTION_TYPES.INCOME as TransactionType | undefined,
              label: 'Income',
              icon: <ArrowDownRight size={14} />,
            },
            {
              value: TRANSACTION_TYPES.EXPENSE as TransactionType | undefined,
              label: 'Expense',
              icon: <ArrowUpRight size={14} />,
            },
            {
              value: TRANSACTION_TYPES.TRANSFER as TransactionType | undefined,
              label: 'Transfer',
              icon: <ArrowLeftRight size={14} />,
            },
          ].map((filter) => (
            <button
              key={filter.label}
              onClick={() => onTypeFilterChange(filter.value)}
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

        {/* Expand toggle for advanced filters */}
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            hasActiveFilters
              ? 'border border-primary/20 bg-primary/10 text-primary'
              : 'bg-white/5 text-muted hover:bg-white/10 hover:text-text'
          }`}
        >
          <Filter size={14} />
          Filters
          {hasActiveFilters && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
              {
                [typeFilter, accountFilter, categoryFilter, startDate, endDate].filter(Boolean)
                  .length
              }
            </span>
          )}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expanded filter row */}
      {expanded && (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          {/* Account Filter */}
          {accounts && accounts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted">
                Account
              </label>
              <select
                value={accountFilter || ''}
                onChange={(e) => onAccountFilterChange(e.target.value || undefined)}
                className="rounded-xl border border-white/10 bg-surface/30 px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
              >
                <option value="">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category Filter */}
          {filteredCategories && filteredCategories.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted">
                Category
              </label>
              <select
                value={categoryFilter || ''}
                onChange={(e) => onCategoryFilterChange(e.target.value || undefined)}
                className="rounded-xl border border-white/10 bg-surface/30 px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
              >
                <option value="">All Categories</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range */}
          <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted">
              From
            </label>
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => onStartDateChange(e.target.value || undefined)}
              className="rounded-xl border border-white/10 bg-surface/30 px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted">
              To
            </label>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => onEndDateChange(e.target.value || undefined)}
              className="rounded-xl border border-white/10 bg-surface/30 px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
