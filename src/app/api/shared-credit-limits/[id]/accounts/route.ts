import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { linkAccountSchema } from '@/lib/validations';
import { ACCOUNT_TYPES } from '@/lib/constants';
import { ZodError } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/shared-credit-limits/[id]/accounts - Link a credit card to the shared limit
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the shared limit belongs to the user
    const sharedLimit = await prisma.sharedCreditLimit.findFirst({
      where: { id, userId },
    });

    if (!sharedLimit) {
      return NextResponse.json({ error: 'Shared credit limit not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = linkAccountSchema.parse(body);

    // Verify the account exists and belongs to the user
    const account = await prisma.account.findFirst({
      where: { id: validatedData.accountId, userId },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Only credit cards can be linked to shared credit limits
    if (account.type !== ACCOUNT_TYPES.CREDIT) {
      return NextResponse.json(
        { error: 'Only credit cards can be linked to shared credit limits' },
        { status: 400 }
      );
    }

    // Check if the account is already in a shared limit group
    if (account.sharedCreditLimitId) {
      if (account.sharedCreditLimitId === id) {
        return NextResponse.json(
          { error: 'This card is already linked to this shared limit' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'This card is already linked to another shared limit. Unlink it first.' },
        { status: 400 }
      );
    }

    // Link the account to the shared limit
    const updatedAccount = await prisma.account.update({
      where: { id: validatedData.accountId },
      data: { sharedCreditLimitId: id },
    });

    return NextResponse.json({ data: updatedAccount }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error linking account to shared credit limit:', error);
    return NextResponse.json(
      { error: 'Failed to link account to shared credit limit' },
      { status: 500 }
    );
  }
}

// DELETE /api/shared-credit-limits/[id]/accounts - Unlink a credit card from the shared limit
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the shared limit belongs to the user
    const sharedLimit = await prisma.sharedCreditLimit.findFirst({
      where: { id, userId },
    });

    if (!sharedLimit) {
      return NextResponse.json({ error: 'Shared credit limit not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = linkAccountSchema.parse(body);

    // Verify the account exists and belongs to the user
    const account = await prisma.account.findFirst({
      where: { id: validatedData.accountId, userId },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check if the account is linked to this shared limit
    if (account.sharedCreditLimitId !== id) {
      return NextResponse.json(
        { error: 'This card is not linked to this shared limit' },
        { status: 400 }
      );
    }

    // Unlink the account from the shared limit
    const updatedAccount = await prisma.account.update({
      where: { id: validatedData.accountId },
      data: { sharedCreditLimitId: null },
    });

    return NextResponse.json({ data: updatedAccount }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error unlinking account from shared credit limit:', error);
    return NextResponse.json(
      { error: 'Failed to unlink account from shared credit limit' },
      { status: 500 }
    );
  }
}
