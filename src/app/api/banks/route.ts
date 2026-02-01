import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating a new bank
const createBankSchema = z.object({
  name: z.string().min(2, 'Bank name must be at least 2 characters').max(100),
  country: z.string().length(2, 'Country must be a 2-letter code').default('IN'),
});

// GET /api/banks - List all banks
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country'); // Optional filter by country
    const search = searchParams.get('search'); // Optional search query

    const where: { country?: string; name?: { contains: string; mode: 'insensitive' } } = {};
    
    if (country && country !== 'ALL') {
      where.country = country;
    }
    
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const banks = await prisma.bank.findMany({
      where,
      orderBy: [
        { isSystem: 'desc' }, // System banks first
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        country: true,
        isSystem: true,
      },
    });

    return NextResponse.json({ data: banks });
  } catch (error) {
    console.error('Error fetching banks:', error);
    return NextResponse.json({ error: 'Failed to fetch banks' }, { status: 500 });
  }
}

// POST /api/banks - Add a new bank to the global dictionary
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createBankSchema.parse(body);

    // Check if bank already exists (case-insensitive)
    const existingBank = await prisma.bank.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingBank) {
      // Return the existing bank instead of creating duplicate
      return NextResponse.json({ data: existingBank });
    }

    // Create new bank (user-added, not system)
    const bank = await prisma.bank.create({
      data: {
        name: validatedData.name,
        country: validatedData.country,
        isSystem: false,
      },
    });

    return NextResponse.json({ data: bank }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating bank:', error);
    return NextResponse.json({ error: 'Failed to create bank' }, { status: 500 });
  }
}
