import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateSettingsSchema } from '@/lib/validations';
import { ZodError } from 'zod';

// GET /api/settings - Get user settings
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings if they don't exist
      const newSettings = await prisma.userSettings.create({
        data: {
          userId,
          currency: 'USD',
          onboardingComplete: false,
        },
      });
      return NextResponse.json({ data: newSettings });
    }

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT /api/settings - Update user settings
export async function PUT(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateSettingsSchema.parse(body);

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: validatedData,
      create: {
        userId,
        currency: validatedData.currency ?? 'USD',
        monthlyIncome: validatedData.monthlyIncome,
        onboardingComplete: validatedData.onboardingComplete ?? false,
      },
    });

    // If onboarding is being marked complete, update Clerk metadata
    if (validatedData.onboardingComplete === true) {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          onboardingComplete: true,
        },
      });
    }

    return NextResponse.json({ data: settings });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
