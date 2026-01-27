import { type ClassValue, clsx } from 'clsx';

// Simple cn function without tailwind-merge for minimal dependencies
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format date
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

// Format relative date
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffTime = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(d);
}

// Get account type icon
export function getAccountTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    CHECKING: 'Building2',
    SAVINGS: 'PiggyBank',
    CREDIT: 'CreditCard',
    CASH: 'Wallet',
    INVESTMENT: 'TrendingUp',
    LOAN: 'FileText',
    OTHER: 'Circle',
  };
  return icons[type] || 'Circle';
}

// Get transaction type color
export function getTransactionTypeColor(type: string): string {
  const colors: Record<string, string> = {
    INCOME: 'text-emerald-400',
    EXPENSE: 'text-red-400',
    TRANSFER: 'text-blue-400',
  };
  return colors[type] || 'text-muted';
}

// Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// Get day name
export function getDayName(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
}
