import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { ACCOUNT_TYPES } from '@/lib/constants';
import type { AccountType } from '@/types';

// Custom validator for last 4 digits - must be exactly 4 digits or empty/undefined
const lastFourDigitsSchema = z
  .string()
  .optional()
  .transform((val) => (val === '' ? undefined : val))
  .refine((val) => val === undefined || /^\d{4}$/.test(val), {
    message: 'Must be exactly 4 digits',
  });

// Validation schema for a single account
const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z
    .enum([ACCOUNT_TYPES.BANK, ACCOUNT_TYPES.CREDIT, ACCOUNT_TYPES.CASH] as [string, ...string[]])
    .transform((v) => v as AccountType),
  balance: z.number().default(0),
  currency: z.string().default('INR'),
  bankName: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  lastFourDigits: lastFourDigitsSchema,
  description: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  creditLimit: z.number().optional(),
});

// Validation schema for the complete onboarding request
const onboardingCompleteSchema = z.object({
  accounts: z.array(accountSchema).min(1, 'At least one account is required'),
  currency: z.string().min(1, 'Currency is required'),
  monthlyIncome: z.number().optional(),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate the request body
    const validationResult = onboardingCompleteSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return NextResponse.json(
        {
          error: firstError.message,
          field: firstError.path.join('.'),
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { accounts, currency, monthlyIncome } = validationResult.data;

    // Check if onboarding is already complete
    const existingSettings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (existingSettings?.onboardingComplete) {
      return NextResponse.json(
        {
          error: 'Onboarding already completed',
        },
        { status: 400 }
      );
    }

    // Use a transaction to ensure atomicity - all accounts are created or none
    const result = await prisma.$transaction(async (tx) => {
      // Create all accounts
      const createdAccounts = await Promise.all(
        accounts.map((account) =>
          tx.account.create({
            data: {
              userId,
              name: account.name,
              type: account.type,
              // For credit cards: positive outstanding (owed) → negative balance
              // negative outstanding (credit/refund) → positive balance
              balance: account.type === ACCOUNT_TYPES.CREDIT ? -account.balance : account.balance,
              currency: account.currency,
              bankName: account.bankName || null,
              lastFourDigits: account.lastFourDigits || null,
              description: account.description || null,
              creditLimit: account.type === ACCOUNT_TYPES.CREDIT ? account.creditLimit : null,
            },
          })
        )
      );

      // Update or create user settings
      const settings = await tx.userSettings.upsert({
        where: { userId },
        update: {
          currency,
          monthlyIncome: monthlyIncome || null,
          onboardingComplete: true,
        },
        create: {
          userId,
          currency,
          monthlyIncome: monthlyIncome || null,
          onboardingComplete: true,
        },
      });

      return { accounts: createdAccounts, settings };
    });

    return NextResponse.json(
      {
        data: result,
        message: 'Onboarding completed successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error completing onboarding:', error);

    // Check for specific Prisma errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.errors[0].message,
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to complete onboarding. Please try again.',
      },
      { status: 500 }
    );
  }
}
