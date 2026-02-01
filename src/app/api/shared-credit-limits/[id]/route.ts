import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateSharedCreditLimitSchema } from '@/lib/validations';
import { calculateSharedLimitStats } from '@/lib/finance';
import { ZodError } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/shared-credit-limits/[id] - Get a single shared credit limit with details
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sharedLimit = await prisma.sharedCreditLimit.findFirst({
      where: { id, userId },
      include: {
        accounts: {
          select: {
            id: true,
            name: true,
            balance: true,
            bankName: true,
            lastFourDigits: true,
          },
        },
      },
    });

    if (!sharedLimit) {
      return NextResponse.json({ error: 'Shared credit limit not found' }, { status: 404 });
    }

    const totalLimit = Number(sharedLimit.totalLimit);
    const stats = calculateSharedLimitStats(totalLimit, sharedLimit.accounts);

    return NextResponse.json({
      data: {
        ...sharedLimit,
        totalLimit,
        ...stats,
      },
    });
  } catch (error) {
    console.error('Error fetching shared credit limit:', error);
    return NextResponse.json({ error: 'Failed to fetch shared credit limit' }, { status: 500 });
  }
}

// PUT /api/shared-credit-limits/[id] - Update a shared credit limit
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the shared limit belongs to the user
    const existing = await prisma.sharedCreditLimit.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Shared credit limit not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = updateSharedCreditLimitSchema.parse(body);

    const sharedLimit = await prisma.sharedCreditLimit.update({
      where: { id },
      data: {
        name: validatedData.name,
        totalLimit: validatedData.totalLimit,
        description: validatedData.description,
      },
      include: {
        accounts: {
          select: {
            id: true,
            name: true,
            balance: true,
            bankName: true,
            lastFourDigits: true,
          },
        },
      },
    });

    const totalLimit = Number(sharedLimit.totalLimit);
    const stats = calculateSharedLimitStats(totalLimit, sharedLimit.accounts);

    return NextResponse.json({
      data: {
        ...sharedLimit,
        totalLimit,
        ...stats,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error updating shared credit limit:', error);
    return NextResponse.json({ error: 'Failed to update shared credit limit' }, { status: 500 });
  }
}

// DELETE /api/shared-credit-limits/[id] - Delete a shared credit limit
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the shared limit belongs to the user
    const existing = await prisma.sharedCreditLimit.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Shared credit limit not found' }, { status: 404 });
    }

    // Delete the shared limit (accounts will have their sharedCreditLimitId set to null due to ON DELETE SET NULL)
    await prisma.sharedCreditLimit.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Shared credit limit deleted successfully' });
  } catch (error) {
    console.error('Error deleting shared credit limit:', error);
    return NextResponse.json({ error: 'Failed to delete shared credit limit' }, { status: 500 });
  }
}
