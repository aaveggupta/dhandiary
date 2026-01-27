import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createTransactionSchema, transactionQuerySchema } from '@/lib/validations';
import { ZodError } from 'zod';
import { TRANSACTION_TYPES, ACCOUNT_TYPES } from '@/lib/constants';

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

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
          account: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
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

    // Verify account belongs to user and get full account details
    const account = await prisma.account.findFirst({
      where: { id: validatedData.accountId, userId },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Validate sufficient funds for expenses (convert Decimal to number)
    if (validatedData.type === TRANSACTION_TYPES.EXPENSE) {
      const accountBalance = Number(account.balance);
      const accountCreditLimit = Number(account.creditLimit) || 0;

      if (account.type === ACCOUNT_TYPES.CREDIT) {
        // For credit cards: check available credit limit
        // Available credit = creditLimit - |balance| (balance is negative, representing debt)
        const currentDebt = Math.abs(accountBalance);
        const availableCredit = accountCreditLimit - currentDebt;

        if (validatedData.amount > availableCredit) {
          return NextResponse.json(
            {
              error: `Insufficient credit limit. Available: ${availableCredit.toFixed(2)}, Required: ${validatedData.amount.toFixed(2)}`,
              code: 'INSUFFICIENT_CREDIT',
              available: availableCredit,
              required: validatedData.amount,
            },
            { status: 400 }
          );
        }
      } else {
        // For bank/cash accounts: check available balance
        if (validatedData.amount > accountBalance) {
          return NextResponse.json(
            {
              error: `Insufficient balance. Available: ${accountBalance.toFixed(2)}, Required: ${validatedData.amount.toFixed(2)}`,
              code: 'INSUFFICIENT_BALANCE',
              available: accountBalance,
              required: validatedData.amount,
            },
            { status: 400 }
          );
        }
      }
    }

    // If categoryId provided, verify it exists
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

    // Create transaction and update account balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          amount: validatedData.amount,
          type: validatedData.type,
          categoryId: validatedData.categoryId,
          accountId: validatedData.accountId,
          note: validatedData.note,
          date: validatedData.date ? new Date(validatedData.date) : new Date(),
        },
        include: {
          category: true,
          account: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      // Update account balance
      const balanceChange =
        validatedData.type === TRANSACTION_TYPES.INCOME
          ? validatedData.amount
          : validatedData.type === TRANSACTION_TYPES.EXPENSE
            ? -validatedData.amount
            : 0;

      if (balanceChange !== 0) {
        await tx.account.update({
          where: { id: validatedData.accountId },
          data: { balance: { increment: balanceChange } },
        });
      }

      return transaction;
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
