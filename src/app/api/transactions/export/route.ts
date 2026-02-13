import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const MAX_EXPORT_ROWS = 10000;

const exportQuerySchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
});

// GET /api/transactions/export - Fetch ALL filtered transactions (no pagination)
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = exportQuerySchema.parse({
      type: searchParams.get('type') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      accountId: searchParams.get('accountId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
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

    // Safety check: count first
    const total = await prisma.transaction.count({ where });
    if (total > MAX_EXPORT_ROWS) {
      return NextResponse.json(
        {
          error: `Too many transactions to export (${total}). Maximum is ${MAX_EXPORT_ROWS}. Please narrow your filters.`,
        },
        { status: 400 }
      );
    }

    const accountSelect = {
      id: true,
      name: true,
      type: true,
    };

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
        account: { select: accountSelect },
        destinationAccount: { select: accountSelect },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ data: transactions });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error exporting transactions:', error);
    return NextResponse.json({ error: 'Failed to export transactions' }, { status: 500 });
  }
}
