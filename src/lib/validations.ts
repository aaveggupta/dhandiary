import { z } from 'zod';

// Account schemas
export const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(50),
  type: z.enum(['BANK', 'CREDIT', 'CASH']),
  balance: z.number().optional().default(0), // Initial balance (one-time during creation)
  creditLimit: z.number().min(0).optional(), // Only for credit cards
  currency: z.string().optional().default('USD'),
  icon: z.string().optional(),
  bankName: z.string().max(50).optional(), // Bank or card issuer name
  lastFourDigits: z
    .string()
    .length(4)
    .regex(/^\d{4}$/, 'Must be exactly 4 digits')
    .optional(),
  description: z.string().max(100).optional(), // Custom nickname or description
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  type: z.enum(['BANK', 'CREDIT', 'CASH']).optional(),
  creditLimit: z.number().min(0).optional(), // Can update credit limit
  // NOTE: balance is NOT editable - use adjustment transactions instead
  currency: z.string().optional(),
  icon: z.string().optional(),
  bankName: z.string().max(50).optional().nullable(),
  lastFourDigits: z
    .string()
    .length(4)
    .regex(/^\d{4}$/, 'Must be exactly 4 digits')
    .optional()
    .nullable(),
  description: z.string().max(100).optional().nullable(),
  isArchived: z.boolean().optional(),
});

// Transaction schemas
export const createTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  categoryId: z.string().optional(),
  accountId: z.string().min(1, 'Account is required'),
  note: z.string().max(500).optional(),
  date: z.string().datetime().optional(),
});

export const updateTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  categoryId: z.string().optional().nullable(),
  accountId: z.string().optional(),
  note: z.string().max(500).optional().nullable(),
  date: z.string().datetime().optional(),
});

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(30),
  icon: z.string().optional(),
  color: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
});

// Settings schemas
export const updateSettingsSchema = z.object({
  currency: z.string().optional(),
  monthlyIncome: z.number().min(0).optional().nullable(),
  onboardingComplete: z.boolean().optional(),
});

// Query parameter schemas
export const transactionQuerySchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
});

// Type exports
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>;
