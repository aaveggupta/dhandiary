import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateTransactionSchema } from '@/lib/validations';
import { ZodError } from 'zod';
import { TRANSACTION_TYPES, ACCOUNT_TYPES } from '@/lib/constants';

// GET /api/transactions/[id] - Get a single transaction
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        category: true,
        account: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ data: transaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
  }
}

// PUT /api/transactions/[id] - Update a transaction
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateTransactionSchema.parse(body);

    // Get existing transaction
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Get the target account (new or existing)
    const targetAccountId = validatedData.accountId || existingTransaction.accountId;
    const targetAccount = await prisma.account.findFirst({
      where: { id: targetAccountId, userId },
    });

    if (!targetAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Determine the new type and amount
    const newType = validatedData.type || existingTransaction.type;
    const newAmount = validatedData.amount ?? Number(existingTransaction.amount);

    // Validate sufficient funds for expenses
    if (newType === TRANSACTION_TYPES.EXPENSE) {
      // Calculate the available balance after reversing the original transaction
      let availableBalance = Number(targetAccount.balance);

      // If we're updating the same account, add back the original transaction's effect
      if (targetAccountId === existingTransaction.accountId) {
        if (existingTransaction.type === TRANSACTION_TYPES.EXPENSE) {
          availableBalance += Number(existingTransaction.amount);
        } else if (existingTransaction.type === TRANSACTION_TYPES.INCOME) {
          availableBalance -= Number(existingTransaction.amount);
        }
      }

      if (targetAccount.type === ACCOUNT_TYPES.CREDIT) {
        // For credit cards: check available credit limit
        const currentDebt = Math.abs(availableBalance);
        const availableCredit = (Number(targetAccount.creditLimit) || 0) - currentDebt;

        if (newAmount > availableCredit) {
          return NextResponse.json(
            {
              error: `Insufficient credit limit. Available: ${availableCredit.toFixed(2)}, Required: ${newAmount.toFixed(2)}`,
              code: 'INSUFFICIENT_CREDIT',
              available: availableCredit,
              required: newAmount,
            },
            { status: 400 }
          );
        }
      } else {
        // For bank/cash accounts: check available balance
        if (newAmount > availableBalance) {
          return NextResponse.json(
            {
              error: `Insufficient balance. Available: ${availableBalance.toFixed(2)}, Required: ${newAmount.toFixed(2)}`,
              code: 'INSUFFICIENT_BALANCE',
              available: availableBalance,
              required: newAmount,
            },
            { status: 400 }
          );
        }
      }
    }

    // Update transaction and adjust account balances in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Calculate balance changes for old transaction (convert Decimal to number)
      const oldAmount = Number(existingTransaction.amount);
      const oldBalanceChange =
        existingTransaction.type === TRANSACTION_TYPES.INCOME
          ? -oldAmount
          : existingTransaction.type === TRANSACTION_TYPES.EXPENSE
            ? oldAmount
            : 0;

      // Revert old balance change
      if (oldBalanceChange !== 0) {
        await tx.account.update({
          where: { id: existingTransaction.accountId },
          data: { balance: { increment: oldBalanceChange } },
        });
      }

      // Update transaction
      const transaction = await tx.transaction.update({
        where: { id },
        data: {
          amount: validatedData.amount,
          type: validatedData.type,
          categoryId: validatedData.categoryId,
          accountId: validatedData.accountId,
          note: validatedData.note,
          date: validatedData.date ? new Date(validatedData.date) : undefined,
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

      // Calculate new balance change
      // Calculate new balance change (convert Decimal to number)
      const newAmount = Number(transaction.amount);
      const newBalanceChange =
        transaction.type === TRANSACTION_TYPES.INCOME
          ? newAmount
          : transaction.type === TRANSACTION_TYPES.EXPENSE
            ? -newAmount
            : 0;

      // Apply new balance change
      if (newBalanceChange !== 0) {
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: newBalanceChange } },
        });
      }

      return transaction;
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

// DELETE /api/transactions/[id] - Delete a transaction
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get existing transaction
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Delete transaction and update account balance
    await prisma.$transaction(async (tx) => {
      // Calculate balance change to revert (convert Decimal to number)
      const amount = Number(existingTransaction.amount);
      const balanceChange =
        existingTransaction.type === TRANSACTION_TYPES.INCOME
          ? -amount
          : existingTransaction.type === TRANSACTION_TYPES.EXPENSE
            ? amount
            : 0;

      // Revert balance change
      if (balanceChange !== 0) {
        await tx.account.update({
          where: { id: existingTransaction.accountId },
          data: { balance: { increment: balanceChange } },
        });
      }

      // Delete the transaction
      await tx.transaction.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
