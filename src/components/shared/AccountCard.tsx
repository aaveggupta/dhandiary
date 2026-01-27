'use client';

import Link from 'next/link';
import { Pencil, Trash2, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { ACCOUNT_TYPES, ACCOUNT_TYPE_CONFIG } from '@/lib/constants';
import type { Account } from '@/types';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (accountId: string) => void;
  onAdjust: (account: Account) => void;
}

export function AccountCard({ account, onEdit, onDelete, onAdjust }: AccountCardProps) {
  const config = ACCOUNT_TYPE_CONFIG[account.type];
  const Icon = config?.icon;

  const isCreditCard = account.type === ACCOUNT_TYPES.CREDIT;

  // Credit card calculations (convert Decimal to number)
  const balance = Number(account.balance);
  const creditLimit = Number(account.creditLimit) || 0;

  const getUtilization = () => {
    if (!isCreditCard || !creditLimit) return 0;
    const outstanding = Math.abs(balance);
    return Math.round((outstanding / creditLimit) * 100);
  };

  const getAvailableCredit = () => {
    if (!isCreditCard || !creditLimit) return 0;
    return creditLimit - Math.abs(balance);
  };

  const utilization = getUtilization();

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
        <p className="mb-1 text-sm font-medium uppercase tracking-wider text-white/70">
          {account.type.toLowerCase().replace('_', ' ')}
          {account.bankName && <span className="ml-1 normal-case">• {account.bankName}</span>}
          {account.lastFourDigits && <span className="ml-1">•••• {account.lastFourDigits}</span>}
        </p>
        <h3 className="mb-1 text-xl font-bold text-white">{account.name}</h3>
        {account.description && <p className="mb-2 text-xs text-white/50">{account.description}</p>}

        {isCreditCard ? (
          <CreditCardDisplay
            outstanding={Math.abs(balance)}
            availableCredit={getAvailableCredit()}
            creditLimit={creditLimit}
            utilization={utilization}
            currency={account.currency}
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
  availableCredit: number;
  creditLimit: number;
  utilization: number;
  currency: string;
}

function CreditCardDisplay({
  outstanding,
  availableCredit,
  creditLimit,
  utilization,
  currency,
}: CreditCardDisplayProps) {
  const getUtilizationColor = () => {
    if (utilization > 80) return 'bg-red-500';
    if (utilization > 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/60">Outstanding</span>
        <span className="font-mono text-2xl font-bold text-red-300">
          {formatCurrency(outstanding, currency)}
        </span>
      </div>
      {creditLimit > 0 && (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Available</span>
            <span className="font-mono text-emerald-300">
              {formatCurrency(availableCredit, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Limit</span>
            <span className="font-mono text-white/80">{formatCurrency(creditLimit, currency)}</span>
          </div>
          {/* Utilization Bar */}
          <div className="mt-2">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full transition-all ${getUtilizationColor()}`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-white/50">{utilization}% used</p>
          </div>
        </>
      )}
    </div>
  );
}
