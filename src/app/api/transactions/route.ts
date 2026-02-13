import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createTransactionSchema, transactionQuerySchema } from '@/lib/validations';
import { ZodError } from 'zod';
import { TRANSACTION_TYPES, ACCOUNT_TYPES } from '@/lib/constants';
import { toNumber, getAvailableCredit } from '@/lib/finance';

// GET /api/transactions - List transactions with filters
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = transactionQuerySchema.parse({
      type: searchParams.get('type') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      accountId: searchParams.get('accountId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    });

    const where: Record<string, unknown> = { userId };

    if (query.type) where.type = query.type;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.accountId) where.accountId = query.accountId;
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) (where.date as Record<string, Date>).gte = new Date(query.startDate);
      if (query.endDate) (where.date as Record<string, Date>).lte = new Date(query.endDate);
    }
    if (query.search) {
      where.note = { contains: query.search, mode: 'insensitive' };
    }

    const accountSelect = {
      id: true,
      name: true,
      type: true,
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
          account: { select: accountSelect },
          destinationAccount: { select: accountSelect },
        },
        orderBy: { date: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      data: transactions,
      meta: {
        total,
        limit: query.limit,
        offset: query.offset,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createTransactionSchema.parse(body);

    // If categoryId provided, verify it exists (this can be done outside transaction)
    if (validatedData.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: validatedData.categoryId,
          OR: [{ userId }, { isSystem: true }],
        },
      });

      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
    }

    // Use serializable isolation to prevent race conditions
    // All balance checks and updates happen atomically
    const result = await prisma.$transaction(
      async (tx) => {
        // Fetch account with latest balance inside the transaction
        const account = await tx.account.findFirst({
          where: { id: validatedData.accountId, userId },
          include: {
            sharedCreditLimit: {
              include: {
                accounts: {
                  where: { isArchived: false },
                  select: { id: true, balance: true },
                },
              },
            },
          },
        });

        if (!account) {
          throw new Error('ACCOUNT_NOT_FOUND');
        }

        // For TRANSFER, validate destination account
        let destinationAccount = null;
        if (validatedData.type === TRANSACTION_TYPES.TRANSFER) {
          if (!validatedData.destinationAccountId) {
            throw new Error('DESTINATION_REQUIRED');
          }

          destinationAccount = await tx.account.findFirst({
            where: { id: validatedData.destinationAccountId, userId },
          });

          if (!destinationAccount) {
            throw new Error('DESTINATION_NOT_FOUND');
          }
        }

        // Validate sufficient funds for expenses and transfers (deducting from source)
        if (
          validatedData.type === TRANSACTION_TYPES.EXPENSE ||
          validatedData.type === TRANSACTION_TYPES.TRANSFER
        ) {
          const accountBalance = toNumber(account.balance);

          if (account.type === ACCOUNT_TYPES.CREDIT) {
            // For credit cards: check available credit (considering shared limits)
            const availableCredit = getAvailableCredit(account);

            if (validatedData.amount > availableCredit) {
              const isShared = !!account.sharedCreditLimitId;
              throw new Error(
                JSON.stringify({
                  code: 'INSUFFICIENT_CREDIT',
                  message: `Insufficient credit limit${isShared ? ' (shared)' : ''}. Available: ${availableCredit.toFixed(2)}, Required: ${validatedData.amount.toFixed(2)}`,
                  available: availableCredit,
                  required: validatedData.amount,
                  isSharedLimit: isShared,
                })
              );
            }
          } else {
            // For bank/cash accounts: check available balance
            if (validatedData.amount > accountBalance) {
              throw new Error(
                JSON.stringify({
                  code: 'INSUFFICIENT_BALANCE',
                  message: `Insufficient balance. Available: ${accountBalance.toFixed(2)}, Required: ${validatedData.amount.toFixed(2)}`,
                  available: accountBalance,
                  required: validatedData.amount,
                })
              );
            }
          }
        }

        const accountSelect = {
          id: true,
          name: true,
          type: true,
        };

        // Create the transaction
        const transaction = await tx.transaction.create({
          data: {
            userId,
            amount: validatedData.amount,
            type: validatedData.type,
            categoryId: validatedData.categoryId,
            accountId: validatedData.accountId,
            destinationAccountId: validatedData.destinationAccountId || null,
            note: validatedData.note,
            date: validatedData.date ? new Date(validatedData.date) : new Date(),
          },
          include: {
            category: true,
            account: { select: accountSelect },
            destinationAccount: { select: accountSelect },
          },
        });

        // Update account balances
        if (validatedData.type === TRANSACTION_TYPES.TRANSFER) {
          // Deduct from source
          await tx.account.update({
            where: { id: validatedData.accountId },
            data: { balance: { decrement: validatedData.amount } },
          });
          // Add to destination
          await tx.account.update({
            where: { id: validatedData.destinationAccountId! },
            data: { balance: { increment: validatedData.amount } },
          });
        } else {
          const balanceChange =
            validatedData.type === TRANSACTION_TYPES.INCOME
              ? validatedData.amount
              : -validatedData.amount;

          if (balanceChange !== 0) {
            await tx.account.update({
              where: { id: validatedData.accountId },
              data: { balance: { increment: balanceChange } },
            });
          }
        }

        return transaction;
      },
      {
        // Use serializable isolation level to prevent race conditions
        isolationLevel: 'Serializable',
      }
    );

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    // Handle custom errors thrown from transaction
    if (error instanceof Error) {
      if (error.message === 'ACCOUNT_NOT_FOUND') {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }
      if (error.message === 'DESTINATION_REQUIRED') {
        return NextResponse.json(
          { error: 'Destination account is required for transfers' },
          { status: 400 }
        );
      }
      if (error.message === 'DESTINATION_NOT_FOUND') {
        return NextResponse.json({ error: 'Destination account not found' }, { status: 404 });
      }

      // Try to parse JSON error from insufficient funds
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.code === 'INSUFFICIENT_CREDIT' || parsed.code === 'INSUFFICIENT_BALANCE') {
          return NextResponse.json(
            {
              error: parsed.message,
              code: parsed.code,
              available: parsed.available,
              required: parsed.required,
              ...(parsed.isSharedLimit !== undefined && { isSharedLimit: parsed.isSharedLimit }),
            },
            { status: 400 }
          );
        }
      } catch {
        // Not a JSON error, continue to generic handler
      }
    }

    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
