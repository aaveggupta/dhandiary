'use client';

import { Pencil, Trash2, Link2, CreditCard, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { SharedCreditLimitWithStats } from '@/types';

interface SharedCreditLimitCardProps {
  sharedLimit: SharedCreditLimitWithStats;
  currency: string;
  onEdit: (sharedLimit: SharedCreditLimitWithStats) => void;
  onDelete: (id: string) => void;
  onManageCards: (sharedLimit: SharedCreditLimitWithStats) => void;
}

export function SharedCreditLimitCard({
  sharedLimit,
  currency,
  onEdit,
  onDelete,
  onManageCards,
}: SharedCreditLimitCardProps) {
  const getUtilizationColor = () => {
    if (sharedLimit.utilization > 80) return 'bg-red-500';
    if (sharedLimit.utilization > 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getUtilizationTextColor = () => {
    if (sharedLimit.utilization > 80) return 'text-red-400';
    if (sharedLimit.utilization > 50) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <Card className="group relative overflow-hidden border-none p-4">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20" />

      <div className="relative z-10">
        {/* Top Row: Name, Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Link2 size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{sharedLimit.name}</h3>
              <p className="text-xs text-white/50">
                {sharedLimit.linkedAccounts.length} card
                {sharedLimit.linkedAccounts.length !== 1 ? 's' : ''} linked
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onManageCards(sharedLimit)}
              className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              title="Manage cards"
            >
              <CreditCard size={16} />
            </button>
            <button
              onClick={() => onEdit(sharedLimit)}
              className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              title="Edit"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => onDelete(sharedLimit.id)}
              className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-red-500/20 hover:text-red-400"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-3 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-white/50">Available</span>
              <span className="font-mono text-lg font-bold text-emerald-400">
                {formatCurrency(sharedLimit.availableCredit, currency)}
              </span>
            </div>
            {/* Utilization Bar */}
            <div className="mt-1.5">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full transition-all ${getUtilizationColor()}`}
                  style={{ width: `${Math.min(sharedLimit.utilization, 100)}%` }}
                />
              </div>
            </div>
            <div className="mt-1 flex justify-between text-xs">
              <span className={getUtilizationTextColor()}>{sharedLimit.utilization}% used</span>
              <span className="text-white/40">
                of {formatCurrency(sharedLimit.totalLimit, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Cards Preview - Compact */}
        {sharedLimit.linkedAccounts.length > 0 && (
          <button
            onClick={() => onManageCards(sharedLimit)}
            className="mt-3 flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-left transition-colors hover:bg-white/10"
          >
            <div className="flex items-center gap-2">
              {sharedLimit.linkedAccounts.slice(0, 3).map((account, idx) => (
                <span
                  key={account.id}
                  className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/70"
                  style={{ marginLeft: idx > 0 ? '-4px' : 0 }}
                >
                  {account.name}
                </span>
              ))}
              {sharedLimit.linkedAccounts.length > 3 && (
                <span className="text-xs text-white/40">
                  +{sharedLimit.linkedAccounts.length - 3} more
                </span>
              )}
            </div>
            <ChevronRight size={16} className="text-white/30" />
          </button>
        )}

        {sharedLimit.linkedAccounts.length === 0 && (
          <button
            onClick={() => onManageCards(sharedLimit)}
            className="mt-3 w-full rounded-lg border border-dashed border-white/20 py-2 text-xs text-white/50 transition-colors hover:border-white/40 hover:text-white/70"
          >
            + Link Credit Cards
          </button>
        )}
      </div>
    </Card>
  );
}
