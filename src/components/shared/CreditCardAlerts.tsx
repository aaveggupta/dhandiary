'use client';

import { CreditCard, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';
import { Card, Badge, Spinner } from '@/components/ui';
import { useCreditCardInsights } from '@/hooks';
import { formatCurrency } from '@/lib/utils';

interface CreditCardAlertsProps {
  currency?: string;
}

export function CreditCardAlerts({ currency = 'INR' }: CreditCardAlertsProps) {
  const { data, isLoading, error } = useCreditCardInsights();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Spinner className="h-6 w-6" />
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return null; // Silently fail if no credit cards or error
  }

  const { cards, summary, alerts } = data;

  // Don't show if no credit cards
  if (cards.length === 0) {
    return null;
  }

  const hasAlerts = alerts.highUtilization.length > 0 || alerts.upcomingDues.length > 0;

  return (
    <Card className="overflow-hidden border-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-violet-500/20 to-purple-500/20 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
            <CreditCard className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Credit Cards</h3>
            <p className="text-xs text-white/60">
              {summary.totalCards} card{summary.totalCards !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-white/60">Overall Utilization</p>
          <p className={`text-xl font-bold ${getUtilizationColor(summary.overallUtilization)}`}>
            {summary.overallUtilization}%
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-xs text-white/50">Total Limit</p>
          <p className="font-mono text-lg font-semibold text-white">
            {formatCurrency(summary.totalCreditLimit, currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-white/50">Outstanding</p>
          <p className="font-mono text-lg font-semibold text-red-400">
            {formatCurrency(summary.totalBalance, currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-white/50">Available</p>
          <p className="font-mono text-lg font-semibold text-emerald-400">
            {formatCurrency(summary.totalAvailable, currency)}
          </p>
        </div>
      </div>

      {/* Alerts Section */}
      {hasAlerts && (
        <div className="space-y-3 px-6 py-4">
          {/* High Utilization Alerts */}
          {alerts.highUtilization.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-400">
                <TrendingUp size={14} />
                High Utilization
              </div>
              {alerts.highUtilization.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-400" />
                    <span className="text-sm text-white">
                      {card.name}
                      {card.lastFourDigits && (
                        <span className="text-white/50"> •••• {card.lastFourDigits}</span>
                      )}
                    </span>
                  </div>
                  <Badge className={`${getUtilizationBadgeClass(card.utilizationStatus)}`}>
                    {card.utilizationPercent}% used
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Due Dates */}
          {alerts.upcomingDues.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
                <Calendar size={14} />
                Upcoming Due Dates
              </div>
              {alerts.upcomingDues.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between rounded-lg bg-blue-500/10 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-blue-400" />
                    <span className="text-sm text-white">
                      {card.name}
                      {card.lastFourDigits && (
                        <span className="text-white/50"> •••• {card.lastFourDigits}</span>
                      )}
                    </span>
                  </div>
                  <Badge className={getDueDateBadgeClass(card.daysUntilDue)}>
                    {card.daysUntilDue === 0
                      ? 'Due Today!'
                      : card.daysUntilDue === 1
                        ? 'Due Tomorrow'
                        : `Due in ${card.daysUntilDue} days`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Individual Cards */}
      <div className="px-6 py-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/50">All Cards</p>
        <div className="space-y-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 transition-colors hover:bg-white/10"
            >
              <div>
                <p className="font-medium text-white">
                  {card.name}
                  {card.lastFourDigits && (
                    <span className="ml-2 text-white/50">•••• {card.lastFourDigits}</span>
                  )}
                </p>
                <div className="mt-1 flex items-center gap-4 text-xs text-white/50">
                  {card.bankName && <span>{card.bankName}</span>}
                  {card.paymentDueDay && (
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      Due: {getOrdinal(card.paymentDueDay)} of month
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm text-white">
                  {formatCurrency(card.currentBalance, currency)}{' '}
                  <span className="text-white/40">
                    / {formatCurrency(card.creditLimit, currency)}
                  </span>
                </p>
                {/* Utilization bar */}
                <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full transition-all ${getUtilizationBarClass(card.utilizationStatus)}`}
                    style={{ width: `${Math.min(card.utilizationPercent, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// Helper functions
function getUtilizationColor(utilization: number): string {
  if (utilization >= 75) return 'text-red-400';
  if (utilization >= 30) return 'text-amber-400';
  return 'text-emerald-400';
}

function getUtilizationBadgeClass(status: 'good' | 'warning' | 'danger'): string {
  switch (status) {
    case 'danger':
      return 'bg-red-500/20 text-red-300';
    case 'warning':
      return 'bg-amber-500/20 text-amber-300';
    default:
      return 'bg-emerald-500/20 text-emerald-300';
  }
}

function getUtilizationBarClass(status: 'good' | 'warning' | 'danger'): string {
  switch (status) {
    case 'danger':
      return 'bg-red-500';
    case 'warning':
      return 'bg-amber-500';
    default:
      return 'bg-emerald-500';
  }
}

function getDueDateBadgeClass(daysUntilDue: number | null): string {
  if (daysUntilDue === null) return 'bg-zinc-500/20 text-zinc-300';
  if (daysUntilDue <= 1) return 'bg-red-500/20 text-red-300';
  if (daysUntilDue <= 3) return 'bg-amber-500/20 text-amber-300';
  return 'bg-blue-500/20 text-blue-300';
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
