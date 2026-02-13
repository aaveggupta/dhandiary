import type {
  User as PrismaUser,
  UserSettings as PrismaUserSettings,
  Account as PrismaAccount,
  Transaction as PrismaTransaction,
  Category as PrismaCategory,
  SharedCreditLimit as PrismaSharedCreditLimit,
  AccountType,
  TransactionType,
} from '@prisma/client';

// Re-export Prisma enums
export { AccountType, TransactionType };

// Extended types with relations
export type User = PrismaUser & {
  settings?: PrismaUserSettings | null;
  accounts?: PrismaAccount[];
  transactions?: PrismaTransaction[];
  categories?: PrismaCategory[];
};

export type UserSettings = PrismaUserSettings;

export type Account = PrismaAccount & {
  transactions?: PrismaTransaction[];
  sharedCreditLimit?: {
    id: string;
    name: string;
    totalLimit: number | { toNumber: () => number };
  } | null;
};

export type Transaction = PrismaTransaction & {
  category?: PrismaCategory | null;
  account?: PrismaAccount;
};

export type Category = PrismaCategory & {
  transactions?: PrismaTransaction[];
};

// Shared Credit Limit types
export type SharedCreditLimit = PrismaSharedCreditLimit & {
  accounts?: Account[];
};

export interface SharedCreditLimitWithStats extends Omit<SharedCreditLimit, 'totalLimit'> {
  totalLimit: number; // Converted from Decimal
  totalOutstanding: number;
  availableCredit: number;
  utilization: number;
  linkedAccounts: Array<{
    id: string;
    name: string;
    outstanding: number;
    bankName: string | null;
    lastFourDigits: string | null;
  }>;
}

export interface CreateSharedCreditLimitInput {
  name: string;
  totalLimit: number;
  description?: string;
}

export interface UpdateSharedCreditLimitInput {
  name?: string;
  totalLimit?: number;
  description?: string | null;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard analytics types
export interface DashboardAnalytics {
  netWorth: number;
  totalIncome: number;
  totalExpenses: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  incomeChange: number;
  expenseChange: number;
  recentTransactions: Transaction[];
  accountBalances: {
    id: string;
    name: string;
    type: AccountType;
    balance: number;
    currency: string;
  }[];
  weeklyActivity: {
    day: string;
    income: number;
    expense: number;
  }[];
}

// Credit Card Insight types
export interface CreditCardInsight {
  id: string;
  name: string;
  bankName: string | null;
  lastFourDigits: string | null;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  utilizationPercent: number;
  utilizationStatus: 'good' | 'warning' | 'danger';
  billingCycleDay: number | null;
  paymentDueDay: number | null;
  daysUntilDue: number | null;
  utilizationAlertEnabled: boolean;
  utilizationAlertPercent: number;
}

export interface CreditCardInsightsResponse {
  cards: CreditCardInsight[];
  summary: {
    totalCards: number;
    totalCreditLimit: number;
    totalBalance: number;
    totalAvailable: number;
    overallUtilization: number;
  };
  alerts: {
    highUtilization: CreditCardInsight[];
    upcomingDues: CreditCardInsight[];
  };
}

// Form input types
export interface CreateAccountInput {
  name: string;
  type: AccountType;
  balance?: number;
  creditLimit?: number; // For credit cards
  currency?: string;
  icon?: string;
  bankName?: string; // Bank or card issuer name
  lastFourDigits?: string; // Last 4 digits of account/card number
  description?: string; // Custom nickname or description
  // Credit card specific fields
  billingCycleDay?: number;
  paymentDueDay?: number;
  utilizationAlertEnabled?: boolean;
  utilizationAlertPercent?: number;
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  creditLimit?: number; // Can update credit limit, but NOT balance directly
  currency?: string;
  icon?: string;
  bankName?: string | null;
  lastFourDigits?: string | null;
  description?: string | null;
  isArchived?: boolean;
  // Credit card specific fields
  billingCycleDay?: number | null;
  paymentDueDay?: number | null;
  utilizationAlertEnabled?: boolean;
  utilizationAlertPercent?: number;
}

export interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  categoryId?: string;
  accountId: string;
  note?: string;
  date?: string;
}

export interface UpdateTransactionInput {
  amount?: number;
  type?: TransactionType;
  categoryId?: string;
  accountId?: string;
  note?: string;
  date?: Date;
}

export interface CreateCategoryInput {
  name: string;
  icon?: string;
  color?: string;
  type: TransactionType;
}

export interface UpdateSettingsInput {
  currency?: string;
  monthlyIncome?: number;
  onboardingComplete?: boolean;
}

// Query filter types
export interface TransactionFilters {
  type?: TransactionType;
  categoryId?: string;
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}
