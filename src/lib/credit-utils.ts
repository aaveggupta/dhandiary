import { PrismaClient, Account } from '@prisma/client';

interface AccountWithSharedLimit extends Account {
  sharedCreditLimit?: {
    id: string;
    totalLimit: number | { toNumber: () => number };
    accounts: Array<{ id: string; balance: number | { toNumber: () => number } }>;
  } | null;
}

/**
 * Calculate available credit for an account, considering shared credit limits.
 *
 * @param account - The account to check (must include sharedCreditLimit with accounts if in a shared group)
 * @returns Available credit amount
 */
export function getAvailableCreditForAccount(account: AccountWithSharedLimit): number {
  const accountCreditLimit = toNumber(account.creditLimit) || 0;
  const accountBalance = toNumber(account.balance);

  if (account.sharedCreditLimitId && account.sharedCreditLimit) {
    // Account is part of a shared credit limit group
    const sharedLimit = account.sharedCreditLimit;
    const totalLimit = toNumber(sharedLimit.totalLimit);

    // Sum net outstanding across all cards (negative balance = debt, positive = credit)
    // Combined outstanding = sum of all negative balances (debts)
    // Credits offset debts, so we sum all balances and negate
    const combinedNetBalance = sharedLimit.accounts.reduce((sum, acc) => {
      return sum + toNumber(acc.balance);
    }, 0);

    // Available = limit + net balance (if net balance is negative, it reduces available)
    return totalLimit + combinedNetBalance;
  } else {
    // Individual credit limit
    // Available = limit + balance (negative balance reduces available, positive increases it)
    return accountCreditLimit + accountBalance;
  }
}

/**
 * Fetch account with shared credit limit details for credit validation
 */
export async function getAccountWithCreditDetails(
  prisma: PrismaClient,
  accountId: string,
  userId: string
) {
  return prisma.account.findFirst({
    where: { id: accountId, userId },
    include: {
      sharedCreditLimit: {
        include: {
          accounts: {
            select: { id: true, balance: true },
          },
        },
      },
    },
  });
}

/**
 * Calculate shared credit limit statistics
 */
export function calculateSharedLimitStats(
  totalLimit: number,
  accounts: Array<{
    id: string;
    name: string;
    balance: number | { toNumber: () => number };
    bankName: string | null;
    lastFourDigits: string | null;
  }>
) {
  const linkedAccounts = accounts.map((acc) => {
    const balance = toNumber(acc.balance);
    return {
      id: acc.id,
      name: acc.name,
      // Outstanding is only for negative balances (debt)
      outstanding: Math.abs(Math.min(balance, 0)),
      // Credit balance for positive balances
      creditBalance: Math.max(balance, 0),
      bankName: acc.bankName,
      lastFourDigits: acc.lastFourDigits,
    };
  });

  // Total outstanding = sum of all debts (negative balances)
  const totalOutstanding = linkedAccounts.reduce((sum, acc) => sum + acc.outstanding, 0);
  // Total credits = sum of all credit balances (positive balances)
  const totalCredits = linkedAccounts.reduce((sum, acc) => sum + acc.creditBalance, 0);
  // Net outstanding for utilization (credits offset debts)
  const netOutstanding = Math.max(0, totalOutstanding - totalCredits);
  // Available credit = limit - net outstanding (or limit + net balance)
  const availableCredit = totalLimit - netOutstanding;
  // Utilization based on net outstanding
  const utilization = totalLimit > 0 ? Math.round((netOutstanding / totalLimit) * 100) : 0;

  return {
    totalOutstanding: netOutstanding,
    availableCredit,
    utilization,
    linkedAccounts,
  };
}

/**
 * Helper to convert Prisma Decimal to number
 */
function toNumber(value: number | { toNumber: () => number } | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value.toNumber === 'function') return value.toNumber();
  return Number(value);
}
