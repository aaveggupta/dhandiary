import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSharedCreditLimitSchema } from '@/lib/validations';
import { calculateSharedLimitStats } from '@/lib/finance';
import { ZodError } from 'zod';

// GET /api/shared-credit-limits - List all shared credit limits with stats
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sharedLimits = await prisma.sharedCreditLimit.findMany({
      where: { userId },
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
      orderBy: { createdAt: 'desc' },
    });

    // Add computed stats to each shared limit
    const limitsWithStats = sharedLimits.map((limit) => {
      const totalLimit = Number(limit.totalLimit);
      const stats = calculateSharedLimitStats(totalLimit, limit.accounts);

      return {
        ...limit,
        totalLimit,
        ...stats,
      };
    });

    return NextResponse.json({ data: limitsWithStats });
  } catch (error) {
    console.error('Error fetching shared credit limits:', error);
    return NextResponse.json({ error: 'Failed to fetch shared credit limits' }, { status: 500 });
  }
}

// POST /api/shared-credit-limits - Create a new shared credit limit
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createSharedCreditLimitSchema.parse(body);

    const sharedLimit = await prisma.sharedCreditLimit.create({
      data: {
        userId,
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

    return NextResponse.json(
      {
        data: {
          ...sharedLimit,
          totalLimit,
          ...stats,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating shared credit limit:', error);
    return NextResponse.json({ error: 'Failed to create shared credit limit' }, { status: 500 });
  }
}
