# Skill: Add API Route

Use this skill when adding new API routes to DhanDiary.

## Overview

- **Location:** `src/app/api/[feature]/route.ts`
- **Validation:** Zod schemas in `src/lib/validations.ts`
- **Auth:** Clerk (`@clerk/nextjs/server`)

## Basic Route Structure

```typescript
// src/app/api/feature/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { toNumber } from '@/lib/finance';

// Validation schema
const createSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
});

// GET /api/feature - List items
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await prisma.feature.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Convert Decimals for JSON serialization
    const serialized = items.map(item => ({
      ...item,
      amount: toNumber(item.amount),
    }));

    return NextResponse.json({ data: serialized });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST /api/feature - Create item
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = createSchema.parse(body);

    const item = await prisma.feature.create({
      data: {
        userId,
        ...validated,
      },
    });

    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error creating item:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
```

## Dynamic Routes

```typescript
// src/app/api/feature/[id]/route.ts

// GET /api/feature/[id] - Get single item
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}

// PATCH /api/feature/[id] - Update item
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}

// DELETE /api/feature/[id] - Delete item
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

## Response Format

```typescript
// Success responses
return NextResponse.json({ data: result });
return NextResponse.json({ data: result }, { status: 201 });

// Error responses
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
return NextResponse.json({ error: 'Not found' }, { status: 404 });
return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
return NextResponse.json({ error: 'Server error' }, { status: 500 });
```

## Query Parameters

```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search');
  // ...
}
```

## Validation Schemas

Add to `src/lib/validations.ts`:

```typescript
export const createFeatureSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().optional(),
  date: z.string().datetime().optional(),
});

export const updateFeatureSchema = createFeatureSchema.partial();
```

## Checklist

- [ ] Add auth check (`await auth()`)
- [ ] Add Zod validation schema
- [ ] Handle all error cases
- [ ] Convert Prisma Decimals with `toNumber()`
- [ ] Use consistent response format
- [ ] Add appropriate status codes
- [ ] Create corresponding React Query hook
