'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, Skeleton } from '@/components/ui';
import { CreditCardAlerts } from '@/components/shared';
import { useDashboardAnalytics, useSettings } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import { TRANSACTION_TYPES } from '@/lib/constants';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Calendar,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics();
  const { data: settings, isLoading: settingsLoading } = useSettings();

  const currency = settings?.currency || 'USD';

  // Redirect to onboarding if not complete
  useEffect(() => {
    if (!settingsLoading && settings && !settings.onboardingComplete) {
      router.replace('/onboarding');
    }
  }, [settings, settingsLoading, router]);

  if (analyticsLoading || settingsLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between pt-2">
          <div>
            <Skeleton className="mb-2 h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-60 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-60 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Overview</h1>
          <p className="text-sm text-muted md:text-base">
            Welcome back, {user?.firstName || 'User'}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="hidden items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted md:flex">
            <Calendar size={16} />
            <span>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <Link
            href="/transactions/add"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Transaction</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* MAIN BALANCE CARD */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="group relative flex min-h-[240px] flex-col justify-between overflow-hidden border-none p-8">
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-800 to-slate-900 transition-all duration-500 group-hover:from-slate-800 group-hover:to-slate-800" />
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] opacity-20 [background-size:20px_20px]" />

            <div className="relative z-10 flex items-start justify-between text-white/90">
              <div>
                <p className="mb-1 font-medium text-slate-400">Total Net Worth</p>
                <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                  {formatCurrency(analytics?.netWorth || 0, currency)}
                </h2>
              </div>
            </div>

            <div className="relative z-10 mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/5 bg-slate-950/40 p-4 backdrop-blur-sm transition-colors hover:bg-slate-950/60">
                <div className="mb-1 flex items-center gap-2 text-emerald-400">
                  <div className="rounded-full bg-emerald-500/20 p-1">
                    <TrendingUp size={14} />
                  </div>
                  <span className="text-xs font-bold uppercase">This Month Income</span>
                </div>
                <p className="text-xl font-bold text-white">
                  +{formatCurrency(analytics?.monthlyIncome || 0, currency)}
                </p>
                {analytics?.incomeChange !== 0 && (
                  <p
                    className={`mt-1 text-xs ${analytics?.incomeChange && analytics.incomeChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}
                  >
                    {analytics?.incomeChange && analytics.incomeChange > 0 ? '+' : ''}
                    {analytics?.incomeChange?.toFixed(1)}% vs last month
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-950/40 p-4 backdrop-blur-sm transition-colors hover:bg-slate-950/60">
                <div className="mb-1 flex items-center gap-2 text-red-400">
                  <div className="rounded-full bg-red-500/20 p-1">
                    <TrendingDown size={14} />
                  </div>
                  <span className="text-xs font-bold uppercase">This Month Expense</span>
                </div>
                <p className="text-xl font-bold text-white">
                  -{formatCurrency(analytics?.monthlyExpenses || 0, currency)}
                </p>
                {analytics?.expenseChange !== 0 && (
                  <p
                    className={`mt-1 text-xs ${analytics?.expenseChange && analytics.expenseChange < 0 ? 'text-emerald-400' : 'text-red-400'}`}
                  >
                    {analytics?.expenseChange && analytics.expenseChange > 0 ? '+' : ''}
                    {analytics?.expenseChange?.toFixed(1)}% vs last month
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* MONTHLY SAVINGS SUMMARY */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">Monthly Summary</h3>
              <span className="rounded bg-surfaceHighlight px-2 py-1 text-xs text-muted">
                {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted">Income</span>
                <span className="font-mono font-medium text-emerald-400">
                  +{formatCurrency(analytics?.monthlyIncome || 0, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Expenses</span>
                <span className="font-mono font-medium text-red-400">
                  -{formatCurrency(analytics?.monthlyExpenses || 0, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="font-medium">Net Savings</span>
                <span
                  className={`font-mono font-bold ${(analytics?.monthlyIncome || 0) - (analytics?.monthlyExpenses || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {(analytics?.monthlyIncome || 0) - (analytics?.monthlyExpenses || 0) >= 0
                    ? '+'
                    : ''}
                  {formatCurrency(
                    (analytics?.monthlyIncome || 0) - (analytics?.monthlyExpenses || 0),
                    currency
                  )}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* SIDE COLUMN: Accounts & Activity */}
        <div className="space-y-6">
          {/* WEEKLY ACTIVITY CHART */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">Weekly Activity</h3>
              <span className="rounded bg-surfaceHighlight px-2 py-1 text-xs text-muted">
                Last 7 Days
              </span>
            </div>
            {/* Legend */}
            <div className="mb-4 flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                <span className="text-muted">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-red-500" />
                <span className="text-muted">Expense</span>
              </div>
            </div>
            {(() => {
              const weeklyData = analytics?.weeklyActivity || [];
              const hasData = weeklyData.some((d) => d.income > 0 || d.expense > 0);
              const maxValue = Math.max(
                ...weeklyData.map((d) => d.income + d.expense),
                1
              );

              if (weeklyData.length === 0) {
                return (
                  <div className="flex h-32 items-center justify-center text-sm text-muted">
                    No activity data available
                  </div>
                );
              }

              return (
                <div className="flex h-32 items-end justify-between gap-1.5">
                  {weeklyData.map((day, i) => {
                    const incomeHeight = hasData ? (day.income / maxValue) * 100 : 0;
                    const expenseHeight = hasData ? (day.expense / maxValue) * 100 : 0;
                    const totalHeight = incomeHeight + expenseHeight;
                    const minBarHeight = !hasData ? 8 : 0; // Show minimal bars when no data

                    return (
                      <div
                        key={i}
                        className="group relative flex flex-1 flex-col items-center justify-end gap-1.5"
                      >
                        {/* Stacked bar container */}
                        <div
                          className="relative flex w-full flex-col justify-end overflow-hidden rounded-t-sm"
                          style={{ height: `${Math.max(totalHeight, minBarHeight)}%` }}
                        >
                          {/* Expense bar (top) */}
                          {(day.expense > 0 || !hasData) && (
                            <div
                              className="w-full bg-red-500/80 transition-all duration-300 group-hover:bg-red-500"
                              style={{
                                height: hasData
                                  ? `${(expenseHeight / Math.max(totalHeight, 1)) * 100}%`
                                  : '50%',
                                minHeight: day.expense > 0 ? '2px' : undefined,
                              }}
                            />
                          )}
                          {/* Income bar (bottom) */}
                          {(day.income > 0 || !hasData) && (
                            <div
                              className="w-full bg-emerald-500/80 transition-all duration-300 group-hover:bg-emerald-500"
                              style={{
                                height: hasData
                                  ? `${(incomeHeight / Math.max(totalHeight, 1)) * 100}%`
                                  : '50%',
                                minHeight: day.income > 0 ? '2px' : undefined,
                              }}
                            />
                          )}
                        </div>
                        {/* Tooltip */}
                        <div className="pointer-events-none absolute -top-16 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-emerald-400">
                              +{formatCurrency(day.income, currency)}
                            </span>
                            <span className="text-red-400">
                              -{formatCurrency(day.expense, currency)}
                            </span>
                          </div>
                        </div>
                        {/* Day label */}
                        <span className="text-[10px] font-medium text-muted">{day.day}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </Card>

          {/* ACCOUNTS LIST */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border p-5 pb-2">
              <h3 className="font-bold">Your Accounts</h3>
              <Link href="/accounts" className="text-xs font-semibold text-primary hover:underline">
                Manage
              </Link>
            </div>
            <div className="divide-y divide-border">
              {(analytics?.accountBalances || []).slice(0, 4).map((acc) => (
                <Link
                  key={acc.id}
                  href={`/transactions?accountId=${acc.id}`}
                  className="block flex items-center justify-between p-4 transition-colors hover:bg-surfaceHighlight/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surfaceHighlight text-muted">
                      <Wallet size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{acc.name}</p>
                      <p className="text-xs capitalize text-muted">{acc.type.toLowerCase()}</p>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-sm font-medium ${Number(acc.balance) >= 0 ? 'text-slate-200' : 'text-red-400'}`}
                  >
                    {formatCurrency(Number(acc.balance), acc.currency)}
                  </span>
                </Link>
              ))}
              {(!analytics?.accountBalances || analytics.accountBalances.length === 0) && (
                <div className="p-4 text-center text-sm text-muted">
                  <Link href="/accounts" className="text-primary hover:underline">
                    Add your first account
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* CREDIT CARD INSIGHTS */}
      <CreditCardAlerts currency={currency} />

      {/* RECENT TRANSACTIONS TABLE */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Recent Transactions</h3>
          <Link href="/transactions" className="text-sm font-medium text-primary hover:underline">
            View All
          </Link>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface/50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Account</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Note</th>
                  <th className="px-6 py-4 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!analytics?.recentTransactions || analytics.recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted">
                      No transactions yet.{' '}
                      <Link href="/transactions/add" className="text-primary hover:underline">
                        Add your first transaction
                      </Link>
                    </td>
                  </tr>
                ) : (
                  analytics.recentTransactions.map((t) => (
                    <tr key={t.id} className="transition-colors hover:bg-surfaceHighlight/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${t.type === TRANSACTION_TYPES.INCOME ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}
                          >
                            {t.type === TRANSACTION_TYPES.INCOME ? (
                              <ArrowDownRight size={14} />
                            ) : (
                              <ArrowUpRight size={14} />
                            )}
                          </div>
                          <span className="font-medium text-slate-200">
                            {t.category?.name || 'Uncategorized'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted">{t.account?.name || '-'}</td>
                      <td className="px-6 py-4 text-muted">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="max-w-xs truncate px-6 py-4 text-muted">{t.note || '-'}</td>
                      <td
                        className={`px-6 py-4 text-right font-mono font-medium ${t.type === TRANSACTION_TYPES.INCOME ? 'text-emerald-400' : 'text-slate-200'}`}
                      >
                        {t.type === TRANSACTION_TYPES.INCOME ? '+' : '-'}
                        {formatCurrency(Number(t.amount), currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
