'use client';

import Link from 'next/link';
import { Pencil, Trash2, RefreshCw, Link2 } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { ACCOUNT_TYPES, ACCOUNT_TYPE_CONFIG } from '@/lib/constants';
import {
  formatCurrency,
  getCreditCardStatus,
  getUtilizationBarClass,
  toNumber,
} from '@/lib/finance';
import type { Account, SharedCreditLimitWithStats } from '@/types';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (accountId: string) => void;
  onAdjust: (account: Account) => void;
  sharedLimitStats?: SharedCreditLimitWithStats | null;
}

export function AccountCard({
  account,
  onEdit,
  onDelete,
  onAdjust,
  sharedLimitStats,
}: AccountCardProps) {
  const config = ACCOUNT_TYPE_CONFIG[account.type];
  const Icon = config?.icon;

  const isCreditCard = account.type === ACCOUNT_TYPES.CREDIT;
  const hasSharedLimit = isCreditCard && account.sharedCreditLimitId && sharedLimitStats;

  // Credit card calculations using centralized finance utilities
  const balance = toNumber(account.balance);
  const creditLimit = toNumber(account.creditLimit);

  // Get credit card status from centralized utility
  const cardStatus = isCreditCard
    ? getCreditCardStatus({ balance, creditLimit })
    : { outstanding: 0, creditBalance: 0, hasCredit: false, availableCredit: 0, utilization: 0 };

  // Use shared limit stats if available, otherwise use individual card stats
  const displayStats = hasSharedLimit
    ? {
        outstanding: cardStatus.outstanding, // Individual card outstanding
        creditBalance: cardStatus.creditBalance,
        hasCredit: cardStatus.hasCredit,
        availableCredit: sharedLimitStats.availableCredit, // Shared available
        utilization: sharedLimitStats.utilization, // Shared utilization
        creditLimit: sharedLimitStats.totalLimit, // Shared limit
      }
    : {
        ...cardStatus,
        creditLimit,
      };

  return (
    <Card className="group relative flex min-h-[220px] flex-col justify-between overflow-hidden border-none p-6">
      {/* Gradient Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${config?.gradientClass || 'from-zinc-700 to-zinc-600'} opacity-20 transition-opacity duration-500 group-hover:opacity-30`}
      />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white backdrop-blur-md">
          {Icon && <Icon size={24} />}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onAdjust(account)}
            className="rounded-lg bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
            title="Adjust balance"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => onEdit(account)}
            className="rounded-lg bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
            title="Edit account"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(account.id)}
            className="rounded-lg bg-white/10 p-2 text-white/70 transition-colors hover:bg-red-500/30 hover:text-red-400"
            title="Delete account"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <Link href={`/transactions?accountId=${account.id}`} className="relative z-10 mt-4 block">
        <div className="mb-1 flex items-center gap-2">
          <p className="text-sm font-medium uppercase tracking-wider text-white/70">
            {account.type.toLowerCase().replace('_', ' ')}
            {account.bankName && <span className="ml-1 normal-case">• {account.bankName}</span>}
            {account.lastFourDigits && <span className="ml-1">•••• {account.lastFourDigits}</span>}
          </p>
          {hasSharedLimit && (
            <Badge className="flex items-center gap-1 bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">
              <Link2 size={10} />
              Shared
            </Badge>
          )}
        </div>
        <h3 className="mb-1 text-xl font-bold text-white">{account.name}</h3>
        {account.description && <p className="mb-2 text-xs text-white/50">{account.description}</p>}
        {hasSharedLimit && (
          <p className="mb-2 text-xs text-indigo-300/70">{sharedLimitStats.name}</p>
        )}

        {isCreditCard ? (
          <CreditCardDisplay
            outstanding={displayStats.outstanding}
            creditBalance={displayStats.creditBalance}
            hasCredit={displayStats.hasCredit}
            availableCredit={displayStats.availableCredit}
            creditLimit={displayStats.creditLimit}
            utilization={displayStats.utilization}
            currency={account.currency}
            isShared={!!hasSharedLimit}
          />
        ) : (
          <p
            className={`font-mono text-3xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-300'}`}
          >
            {formatCurrency(balance, account.currency)}
          </p>
        )}

        <p className="mt-3 text-xs text-white/40">Click to view transactions</p>
      </Link>
    </Card>
  );
}

interface CreditCardDisplayProps {
  outstanding: number;
  creditBalance: number;
  hasCredit: boolean;
  availableCredit: number;
  creditLimit: number;
  utilization: number;
  currency: string;
  isShared?: boolean;
}

function CreditCardDisplay({
  outstanding,
  creditBalance,
  hasCredit,
  availableCredit,
  creditLimit,
  utilization,
  currency,
  isShared,
}: CreditCardDisplayProps) {
  const utilizationColorClass = getUtilizationBarClass(utilization);

  return (
    <div className="space-y-2">
      {hasCredit ? (
        // User has a credit balance (overpaid or refund)
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Credit Balance</span>
          <span className="font-mono text-2xl font-bold text-emerald-300">
            +{formatCurrency(creditBalance, currency)}
          </span>
        </div>
      ) : (
        // User has outstanding balance (owes money)
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Outstanding</span>
          <span className="font-mono text-2xl font-bold text-red-300">
            {formatCurrency(outstanding, currency)}
          </span>
        </div>
      )}
      {creditLimit > 0 && (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">
              Available{isShared && <span className="text-indigo-300"> (shared)</span>}
            </span>
            <span className="font-mono text-emerald-300">
              {formatCurrency(availableCredit, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">{isShared ? 'Shared Limit' : 'Limit'}</span>
            <span className="font-mono text-white/80">{formatCurrency(creditLimit, currency)}</span>
          </div>
          {/* Utilization Bar - only show when there's outstanding */}
          {!hasCredit && (
            <div className="mt-2">
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full transition-all ${utilizationColorClass}`}
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-white/50">
                {utilization}% used{isShared && ' (combined)'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
