'use client';

import { useState } from 'react';
import { Link2, ChevronDown, ChevronUp, Settings2, Trash2 } from 'lucide-react';
import { formatCurrency, getUtilizationBarClass, getUtilizationBgClass } from '@/lib/finance';
import type { Account, SharedCreditLimitWithStats } from '@/types';
import { AccountCard } from './AccountCard';

interface SharedLimitGroupProps {
  sharedLimit: SharedCreditLimitWithStats;
  linkedAccounts: Account[];
  currency: string;
  onEditLimit: (limit: SharedCreditLimitWithStats) => void;
  onDeleteLimit: (id: string) => void;
  onManageCards: (limit: SharedCreditLimitWithStats) => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onAdjustAccount: (account: Account) => void;
}

export function SharedLimitGroup({
  sharedLimit,
  linkedAccounts,
  currency,
  onEditLimit,
  onDeleteLimit,
  onManageCards,
  onEditAccount,
  onDeleteAccount,
  onAdjustAccount,
}: SharedLimitGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Use centralized utility functions for utilization colors
  const utilizationBarClass = getUtilizationBarClass(sharedLimit.utilization);
  const utilizationBgClass = getUtilizationBgClass(sharedLimit.utilization);

  return (
    <div className="relative">
      {/* Group Header - The "Pool" indicator */}
      <div className={`relative mb-4 overflow-hidden rounded-2xl border ${utilizationBgClass} p-4`}>
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5" />

        <div className="relative z-10">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-3 text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                <Link2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white">{sharedLimit.name}</h3>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                    {linkedAccounts.length} card{linkedAccounts.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-sm text-white/50">Shared Credit Pool</p>
              </div>
              {isExpanded ? (
                <ChevronUp size={20} className="ml-2 text-white/30" />
              ) : (
                <ChevronDown size={20} className="ml-2 text-white/30" />
              )}
            </button>

            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="hidden text-right sm:block">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-white/40">Available</p>
                    <p className="font-mono text-lg font-bold text-emerald-400">
                      {formatCurrency(sharedLimit.availableCredit, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Total Limit</p>
                    <p className="font-mono text-lg font-bold text-white/80">
                      {formatCurrency(sharedLimit.totalLimit, currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onManageCards(sharedLimit)}
                  className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  title="Manage linked cards"
                >
                  <Settings2 size={18} />
                </button>
                <button
                  onClick={() => onDeleteLimit(sharedLimit.id)}
                  className="rounded-lg p-2 text-white/50 transition-colors hover:bg-red-500/20 hover:text-red-400"
                  title="Delete shared limit"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Utilization bar - full width */}
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-black/20">
              <div
                className={`h-full transition-all duration-500 ${utilizationBarClass}`}
                style={{ width: `${Math.min(sharedLimit.utilization, 100)}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-xs">
              <span className="text-white/50">
                {sharedLimit.utilization}% used (
                {formatCurrency(sharedLimit.totalOutstanding, currency)} outstanding)
              </span>
              <button
                onClick={() => onEditLimit(sharedLimit)}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Edit limit
              </button>
            </div>
          </div>

          {/* Mobile stats */}
          <div className="mt-3 flex gap-4 sm:hidden">
            <div>
              <p className="text-xs text-white/40">Available</p>
              <p className="font-mono font-bold text-emerald-400">
                {formatCurrency(sharedLimit.availableCredit, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/40">Limit</p>
              <p className="font-mono font-bold text-white/80">
                {formatCurrency(sharedLimit.totalLimit, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Linked Cards - Visually connected */}
      {isExpanded && linkedAccounts.length > 0 && (
        <div className="relative ml-5 border-l-2 border-indigo-500/20 pl-6">
          {/* Connector line decoration */}
          <div className="absolute -left-[5px] top-0 h-3 w-2 rounded-bl-lg border-b-2 border-l-2 border-indigo-500/20" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {linkedAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                sharedLimitStats={sharedLimit}
                onEdit={onEditAccount}
                onDelete={onDeleteAccount}
                onAdjust={onAdjustAccount}
              />
            ))}
          </div>
        </div>
      )}

      {isExpanded && linkedAccounts.length === 0 && (
        <div className="ml-5 border-l-2 border-indigo-500/20 pl-6">
          <button
            onClick={() => onManageCards(sharedLimit)}
            className="flex w-full max-w-sm items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 bg-white/5 py-8 text-white/40 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white/60"
          >
            <Link2 size={20} />
            <span>Link credit cards to this pool</span>
          </button>
        </div>
      )}
    </div>
  );
}
