import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createCategorySchema } from '@/lib/validations';
import { ZodError } from 'zod';

// GET /api/categories - List all categories (user's + system)
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {
      OR: [
        { userId },
        { isSystem: true, userId: userId }, // System categories created for this user
      ],
    };

    if (type) {
      where.type = type;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/categories - Create a custom category
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createCategorySchema.parse(body);

    // Check if category with same name already exists for user
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId,
        name: validatedData.name,
        type: validatedData.type,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        userId,
        name: validatedData.name,
        icon: validatedData.icon,
        color: validatedData.color,
        type: validatedData.type,
        isSystem: false,
      },
    });

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
