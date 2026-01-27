import { Landmark, CreditCard, Wallet } from 'lucide-react';
import type { AccountType, TransactionType } from '@/types';

// Account Type Configuration
export const ACCOUNT_TYPES = {
  BANK: 'BANK',
  CREDIT: 'CREDIT',
  CASH: 'CASH',
} as const;

export const ACCOUNT_TYPE_CONFIG: Record<
  AccountType,
  {
    label: string;
    description: string;
    examples: string;
    icon: typeof Landmark;
    color: string;
    gradientClass: string;
  }
> = {
  BANK: {
    label: 'Bank Account',
    description: 'Salary, Savings, or Current accounts',
    examples: 'HDFC Savings, SBI Salary Account',
    icon: Landmark,
    color: 'blue',
    gradientClass: 'from-blue-600 to-cyan-500',
  },
  CREDIT: {
    label: 'Credit Card',
    description: 'Track spending and outstanding balance',
    examples: 'HDFC Regalia, Amazon Pay ICICI',
    icon: CreditCard,
    color: 'purple',
    gradientClass: 'from-purple-600 to-pink-600',
  },
  CASH: {
    label: 'Cash / Wallet',
    description: 'Physical cash or digital wallets',
    examples: 'Wallet, Paytm, PhonePe balance',
    icon: Wallet,
    color: 'green',
    gradientClass: 'from-green-600 to-emerald-500',
  },
};

// Transaction Type Configuration
export const TRANSACTION_TYPES = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
  TRANSFER: 'TRANSFER',
} as const;

export const TRANSACTION_TYPE_CONFIG: Record<
  TransactionType,
  {
    label: string;
    color: string;
  }
> = {
  INCOME: {
    label: 'Income',
    color: 'emerald',
  },
  EXPENSE: {
    label: 'Expense',
    color: 'red',
  },
  TRANSFER: {
    label: 'Transfer',
    color: 'blue',
  },
};

// Currency Configuration
export const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
] as const;

export const DEFAULT_CURRENCY = 'INR';

export const getCurrencySymbol = (code: string): string => {
  const currency = CURRENCIES.find((c) => c.code === code);
  return currency?.symbol || code;
};

// Helper functions
export const isLiabilityAccount = (type: AccountType): boolean => {
  return type === ACCOUNT_TYPES.CREDIT;
};

export const isAssetAccount = (type: AccountType): boolean => {
  return type === ACCOUNT_TYPES.BANK || type === ACCOUNT_TYPES.CASH;
};

export const getAccountTypeLabel = (type: AccountType): string => {
  return ACCOUNT_TYPE_CONFIG[type]?.label || type;
};

export const getAccountTypeOptions = () => {
  return Object.entries(ACCOUNT_TYPE_CONFIG).map(([value, config]) => ({
    value: value as AccountType,
    label: config.label,
  }));
};
