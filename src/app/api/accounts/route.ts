import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createAccountSchema } from '@/lib/validations';
import { ZodError } from 'zod';

// GET /api/accounts - List all accounts
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await prisma.account.findMany({
      where: {
        userId,
        isArchived: false,
      },
      include: {
        sharedCreditLimit: {
          select: {
            id: true,
            name: true,
            totalLimit: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ data: accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

// POST /api/accounts - Create a new account
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createAccountSchema.parse(body);

    const account = await prisma.account.create({
      data: {
        userId,
        name: validatedData.name,
        type: validatedData.type,
        balance: validatedData.balance ?? 0,
        creditLimit: validatedData.creditLimit,
        currency: validatedData.currency ?? 'USD',
        icon: validatedData.icon,
        bankName: validatedData.bankName,
        lastFourDigits: validatedData.lastFourDigits,
        description: validatedData.description,
      },
    });

    return NextResponse.json({ data: account }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating account:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
