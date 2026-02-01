/**
 * Finance Utilities - Single Source of Truth for all financial calculations
 *
 * This module handles all financial math for the application including:
 * - Currency formatting and rounding
 * - Credit card calculations (outstanding, credit balance, available credit, utilization)
 * - Shared credit limit calculations
 * - Transaction impact calculations
 * - Net worth calculations
 *
 * All monetary values are handled as numbers (not Decimals) for simplicity.
 * Rounding is applied consistently to avoid floating point issues.
 */

import { ACCOUNT_TYPES, TRANSACTION_TYPES } from './constants';
import type { AccountType, TransactionType } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface CreditCardBalance {
  /** Raw balance (negative = owes money, positive = has credit) */
  balance: NumberLike;
  /** Credit limit for the card */
  creditLimit: NumberLike;
}

export interface CreditCardStatus {
  /** Amount the user owes (always >= 0) */
  outstanding: number;
  /** Amount of credit/refund the user has (always >= 0) */
  creditBalance: number;
  /** Whether the user has a credit balance (overpaid/refund) */
  hasCredit: boolean;
  /** Available credit (limit + balance, since balance is typically negative) */
  availableCredit: number;
  /** Utilization percentage (0-100+, can exceed 100 if over limit) */
  utilization: number;
}

/** Type that accepts number, Prisma Decimal-like objects, null, or undefined */
type NumberLike = number | { toNumber: () => number } | null | undefined;

export interface SharedLimitAccount {
  id: string;
  name: string;
  balance: NumberLike;
  bankName?: string | null;
  lastFourDigits?: string | null;
}

export interface SharedLimitStats {
  /** Net outstanding across all cards (debts - credits) */
  totalOutstanding: number;
  /** Available credit for the shared pool */
  availableCredit: number;
  /** Utilization percentage based on net outstanding */
  utilization: number;
  /** Individual card stats */
  linkedAccounts: Array<{
    id: string;
    name: string;
    outstanding: number;
    creditBalance: number;
    hasCredit: boolean;
    bankName: string | null;
    lastFourDigits: string | null;
  }>;
}

export interface TransactionImpact {
  /** New balance after transaction */
  newBalance: number;
  /** Change in balance */
  balanceChange: number;
  /** Whether the transaction is allowed */
  isAllowed: boolean;
  /** Error message if not allowed */
  errorMessage?: string;
}

export interface NetWorthSummary {
  /** Total value of asset accounts (bank, cash) */
  totalAssets: number;
  /** Total value of liabilities (credit card outstanding) */
  totalLiabilities: number;
  /** Net worth (assets - liabilities) */
  netWorth: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Number of decimal places for monetary calculations */
export const DECIMAL_PLACES = 2;

/** Maximum utilization percentage before warning */
export const HIGH_UTILIZATION_THRESHOLD = 80;

/** Medium utilization percentage threshold */
export const MEDIUM_UTILIZATION_THRESHOLD = 50;

// =============================================================================
// ROUNDING & CONVERSION UTILITIES
// =============================================================================

/**
 * Round a number to the specified decimal places.
 * Uses standard rounding (half-up) for consistency with display formatting.
 *
 * Note: For high-precision financial calculations requiring banker's rounding
 * (round half to even), consider using a dedicated library like decimal.js.
 */
export function roundMoney(value: number, decimals: number = DECIMAL_PLACES): number {
  if (!Number.isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Convert a Prisma Decimal or any numeric value to a number.
 * Handles null, undefined, Decimal objects, and regular numbers.
 */
export function toNumber(value: number | { toNumber: () => number } | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value.toNumber === 'function') return value.toNumber();
  return Number(value) || 0;
}

/**
 * Safely parse a string to a number, returning 0 for invalid inputs.
 */
export function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Check if two monetary values are effectively equal (within rounding tolerance).
 */
export function moneyEquals(a: number, b: number): boolean {
  return Math.abs(roundMoney(a) - roundMoney(b)) < 0.001;
}

// =============================================================================
// CREDIT CARD CALCULATIONS
// =============================================================================

/**
 * Calculate credit card status from balance and limit.
 *
 * Balance conventions:
 * - Negative balance = user owes money (outstanding)
 * - Positive balance = user has credit (overpaid/refund)
 *
 * @example
 * // User owes 5000
 * getCreditCardStatus({ balance: -5000, creditLimit: 100000 })
 * // => { outstanding: 5000, creditBalance: 0, hasCredit: false, availableCredit: 95000, utilization: 5 }
 *
 * @example
 * // User has 1000 credit (overpaid)
 * getCreditCardStatus({ balance: 1000, creditLimit: 100000 })
 * // => { outstanding: 0, creditBalance: 1000, hasCredit: true, availableCredit: 101000, utilization: 0 }
 */
export function getCreditCardStatus(card: CreditCardBalance): CreditCardStatus {
  const balance = roundMoney(toNumber(card.balance));
  const creditLimit = roundMoney(toNumber(card.creditLimit));

  // Negative balance = owes money, Positive balance = has credit
  const hasCredit = balance > 0;
  const outstanding = hasCredit ? 0 : Math.abs(balance);
  const creditBalance = hasCredit ? balance : 0;

  // Available = limit + balance (balance is typically negative, so this subtracts outstanding)
  // If balance is positive (credit), available increases beyond the limit
  const availableCredit = roundMoney(creditLimit + balance);

  // Utilization only makes sense when there's outstanding debt
  // If user has credit, utilization is 0
  const utilization =
    hasCredit || creditLimit <= 0 ? 0 : Math.round((outstanding / creditLimit) * 100);

  return {
    outstanding: roundMoney(outstanding),
    creditBalance: roundMoney(creditBalance),
    hasCredit,
    availableCredit,
    utilization,
  };
}

/**
 * Convert user-entered outstanding amount to internal balance.
 *
 * User convention:
 * - Positive = they owe money
 * - Negative = they have credit/refund
 *
 * Internal convention:
 * - Positive = credit balance
 * - Negative = owes money
 *
 * @example
 * outstandingToBalance(5000) // User owes 5000 => -5000 internal
 * outstandingToBalance(-1000) // User has 1000 credit => 1000 internal
 */
export function outstandingToBalance(userOutstanding: number): number {
  const value = toNumber(userOutstanding);
  if (value === 0) return 0; // Avoid -0
  return roundMoney(-value);
}

/**
 * Convert internal balance to user-facing outstanding amount.
 *
 * @example
 * balanceToOutstanding(-5000) // Internal -5000 => 5000 outstanding
 * balanceToOutstanding(1000) // Internal +1000 => -1000 (credit)
 */
export function balanceToOutstanding(internalBalance: number): number {
  const value = toNumber(internalBalance);
  if (value === 0) return 0; // Avoid -0
  return roundMoney(-value);
}

/**
 * Get the utilization color class based on percentage.
 */
export function getUtilizationColor(utilization: number): 'red' | 'amber' | 'green' {
  if (utilization > HIGH_UTILIZATION_THRESHOLD) return 'red';
  if (utilization > MEDIUM_UTILIZATION_THRESHOLD) return 'amber';
  return 'green';
}

/**
 * Get Tailwind classes for utilization bar color.
 */
export function getUtilizationBarClass(utilization: number): string {
  const color = getUtilizationColor(utilization);
  return {
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    green: 'bg-emerald-500',
  }[color];
}

/**
 * Get Tailwind classes for utilization text color.
 */
export function getUtilizationTextClass(utilization: number): string {
  const color = getUtilizationColor(utilization);
  return {
    red: 'text-red-400',
    amber: 'text-amber-400',
    green: 'text-emerald-400',
  }[color];
}

/**
 * Get Tailwind classes for utilization background.
 */
export function getUtilizationBgClass(utilization: number): string {
  const color = getUtilizationColor(utilization);
  return {
    red: 'bg-red-500/10 border-red-500/20',
    amber: 'bg-amber-500/10 border-amber-500/20',
    green: 'bg-emerald-500/10 border-emerald-500/20',
  }[color];
}

// =============================================================================
// SHARED CREDIT LIMIT CALCULATIONS
// =============================================================================

/**
 * Calculate statistics for a shared credit limit group.
 *
 * Handles mixed balances where some cards may have credit while others have outstanding.
 * Credits offset outstanding amounts in utilization calculations.
 */
export function calculateSharedLimitStats(
  totalLimit: number,
  accounts: SharedLimitAccount[]
): SharedLimitStats {
  const limit = roundMoney(toNumber(totalLimit));

  // Process each account
  const linkedAccounts = accounts.map((acc) => {
    const balance = roundMoney(toNumber(acc.balance));
    const hasCredit = balance > 0;
    const outstanding = hasCredit ? 0 : Math.abs(balance);
    const creditBalance = hasCredit ? balance : 0;

    return {
      id: acc.id,
      name: acc.name,
      outstanding: roundMoney(outstanding),
      creditBalance: roundMoney(creditBalance),
      hasCredit,
      bankName: acc.bankName || null,
      lastFourDigits: acc.lastFourDigits || null,
    };
  });

  // Calculate totals
  const totalOutstandingRaw = linkedAccounts.reduce((sum, acc) => sum + acc.outstanding, 0);
  const totalCredits = linkedAccounts.reduce((sum, acc) => sum + acc.creditBalance, 0);

  // Net outstanding (credits offset debts)
  const netOutstanding = roundMoney(Math.max(0, totalOutstandingRaw - totalCredits));

  // Available credit = limit - net outstanding
  const availableCredit = roundMoney(limit - netOutstanding);

  // Utilization based on net outstanding
  const utilization = limit > 0 ? Math.round((netOutstanding / limit) * 100) : 0;

  return {
    totalOutstanding: netOutstanding,
    availableCredit,
    utilization,
    linkedAccounts,
  };
}

/**
 * Get available credit for an account, considering shared limits.
 */
export function getAvailableCredit(
  account: CreditCardBalance & {
    sharedCreditLimitId?: string | null;
    sharedCreditLimit?: {
      totalLimit: number | { toNumber: () => number };
      accounts: Array<{ id: string; balance: number | { toNumber: () => number } }>;
    } | null;
  }
): number {
  const balance = roundMoney(toNumber(account.balance));
  const creditLimit = roundMoney(toNumber(account.creditLimit));

  if (account.sharedCreditLimitId && account.sharedCreditLimit) {
    // Account is part of a shared credit limit group
    const totalLimit = roundMoney(toNumber(account.sharedCreditLimit.totalLimit));

    // Sum net balance across all cards (negative = debt, positive = credit)
    const combinedBalance = account.sharedCreditLimit.accounts.reduce((sum, acc) => {
      return sum + toNumber(acc.balance);
    }, 0);

    // Available = limit + combined balance
    return roundMoney(totalLimit + combinedBalance);
  }

  // Individual credit limit: available = limit + balance
  return roundMoney(creditLimit + balance);
}

// =============================================================================
// TRANSACTION CALCULATIONS
// =============================================================================

/**
 * Calculate the impact of a transaction on an account balance.
 *
 * @param currentBalance - Current account balance
 * @param amount - Transaction amount (always positive)
 * @param type - Transaction type (INCOME, EXPENSE, TRANSFER)
 * @param accountType - Account type (BANK, CREDIT, CASH)
 * @param availableCredit - For credit cards, the available credit
 */
export function calculateTransactionImpact(
  currentBalance: number,
  amount: number,
  type: TransactionType,
  accountType: AccountType,
  availableCredit?: number
): TransactionImpact {
  const balance = roundMoney(toNumber(currentBalance));
  const txAmount = roundMoney(Math.abs(toNumber(amount)));

  let balanceChange = 0;
  if (type === TRANSACTION_TYPES.INCOME) {
    balanceChange = txAmount;
  } else if (type === TRANSACTION_TYPES.EXPENSE) {
    balanceChange = -txAmount;
  }
  // TRANSFER has no balance change (handled separately)

  const newBalance = roundMoney(balance + balanceChange);

  // Validation
  let isAllowed = true;
  let errorMessage: string | undefined;

  if (type === TRANSACTION_TYPES.EXPENSE) {
    if (accountType === ACCOUNT_TYPES.CREDIT) {
      // For credit cards, check available credit
      const available = availableCredit ?? (toNumber(availableCredit) || 0);
      if (txAmount > available) {
        isAllowed = false;
        errorMessage = `Insufficient credit. Available: ${available.toFixed(2)}, Required: ${txAmount.toFixed(2)}`;
      }
    } else {
      // For bank/cash, check balance
      if (txAmount > balance) {
        isAllowed = false;
        errorMessage = `Insufficient balance. Available: ${balance.toFixed(2)}, Required: ${txAmount.toFixed(2)}`;
      }
    }
  }

  return {
    newBalance,
    balanceChange,
    isAllowed,
    errorMessage,
  };
}

/**
 * Calculate the balance change for a transaction.
 */
export function getBalanceChange(amount: number, type: TransactionType): number {
  const txAmount = roundMoney(Math.abs(toNumber(amount)));
  if (type === TRANSACTION_TYPES.INCOME) return txAmount;
  if (type === TRANSACTION_TYPES.EXPENSE) return -txAmount;
  return 0;
}

// =============================================================================
// NET WORTH CALCULATIONS
// =============================================================================

/**
 * Calculate net worth from a list of accounts.
 *
 * @param accounts - Array of accounts with type and balance
 */
export function calculateNetWorth(
  accounts: Array<{
    type: AccountType;
    balance: number | { toNumber: () => number };
  }>
): NetWorthSummary {
  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const account of accounts) {
    const balance = roundMoney(toNumber(account.balance));

    if (account.type === ACCOUNT_TYPES.CREDIT) {
      // Credit card: negative balance = liability, positive balance = asset (credit)
      if (balance < 0) {
        totalLiabilities += Math.abs(balance);
      } else {
        totalAssets += balance;
      }
    } else {
      // Bank/Cash: positive = asset, negative = liability (overdraft)
      if (balance >= 0) {
        totalAssets += balance;
      } else {
        totalLiabilities += Math.abs(balance);
      }
    }
  }

  return {
    totalAssets: roundMoney(totalAssets),
    totalLiabilities: roundMoney(totalLiabilities),
    netWorth: roundMoney(totalAssets - totalLiabilities),
  };
}

/**
 * Check if an account type is a liability account.
 */
export function isLiabilityAccount(type: AccountType): boolean {
  return type === ACCOUNT_TYPES.CREDIT;
}

/**
 * Check if an account type is an asset account.
 */
export function isAssetAccount(type: AccountType): boolean {
  return type === ACCOUNT_TYPES.BANK || type === ACCOUNT_TYPES.CASH;
}

// =============================================================================
// FORMATTING UTILITIES
// =============================================================================

/**
 * Format a number as currency.
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const value = roundMoney(toNumber(amount));
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number as a percentage.
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${roundMoney(value, decimals)}%`;
}

/**
 * Format a monetary amount for display with sign.
 * Positive values get a + prefix, negative values keep their - sign.
 */
export function formatSignedCurrency(amount: number, currency: string = 'INR'): string {
  const value = roundMoney(toNumber(amount));
  const formatted = formatCurrency(Math.abs(value), currency);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

// =============================================================================
// DATE CALCULATIONS
// =============================================================================

/**
 * Calculate days until a specific day of month, handling month boundaries correctly.
 * Treats days > days in target month as "last day of month".
 *
 * @param dueDay - Day of month when payment is due (1-31)
 * @param today - Current date (defaults to now)
 * @returns Number of days until the due date
 *
 * @example
 * // If today is Jan 15 and due day is 20, returns 5
 * calculateDaysUntilDue(20, new Date(2024, 0, 15)) // => 5
 *
 * @example
 * // If today is Jan 25 and due day is 5, returns days to Feb 5
 * calculateDaysUntilDue(5, new Date(2024, 0, 25)) // => 11
 *
 * @example
 * // If due day is 31 but next month has 28 days, treats as last day
 * calculateDaysUntilDue(31, new Date(2024, 1, 1)) // => 28 (Feb 29 in leap year)
 */
export function calculateDaysUntilDue(dueDay: number, today: Date = new Date()): number {
  const currentDay = today.getDate();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Get days in current month
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Effective due day for this month (handle 31 in months with fewer days)
  const effectiveDueDayThisMonth = Math.min(dueDay, daysInCurrentMonth);

  if (currentDay <= effectiveDueDayThisMonth) {
    // Due date is this month
    return effectiveDueDayThisMonth - currentDay;
  }

  // Due date is next month
  const nextMonth = currentMonth + 1;
  const nextMonthYear = nextMonth > 11 ? currentYear + 1 : currentYear;
  const nextMonthIndex = nextMonth > 11 ? 0 : nextMonth;
  const daysInNextMonth = new Date(nextMonthYear, nextMonthIndex + 1, 0).getDate();

  // Effective due day for next month
  const effectiveDueDayNextMonth = Math.min(dueDay, daysInNextMonth);

  // Days remaining in current month + days into next month
  return daysInCurrentMonth - currentDay + effectiveDueDayNextMonth;
}

/**
 * Get utilization status based on percentage and threshold.
 *
 * @param utilization - Current utilization percentage
 * @param alertThreshold - User's alert threshold (default 30)
 * @returns Status: 'good', 'warning', or 'danger'
 */
export function getUtilizationStatus(
  utilization: number,
  alertThreshold: number = 30
): 'good' | 'warning' | 'danger' {
  if (utilization >= 75) return 'danger';
  if (utilization >= alertThreshold) return 'warning';
  return 'good';
}

// =============================================================================
// PERCENTAGE CALCULATIONS
// =============================================================================

/**
 * Calculate percentage change between two values.
 */
export function calculatePercentageChange(current: number, previous: number): number {
  const curr = toNumber(current);
  const prev = toNumber(previous);

  if (prev === 0) {
    if (curr > 0) return 100;
    if (curr < 0) return -100;
    return 0;
  }

  return roundMoney(((curr - prev) / Math.abs(prev)) * 100, 1);
}

/**
 * Calculate what percentage `part` is of `whole`.
 */
export function calculatePercentage(part: number, whole: number): number {
  const p = toNumber(part);
  const w = toNumber(whole);

  if (w === 0) return 0;
  return roundMoney((p / w) * 100, 1);
}
