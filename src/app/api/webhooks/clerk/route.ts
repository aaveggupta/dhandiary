import { Webhook } from 'svix';
import { headers } from 'next/headers';
import type { WebhookEvent } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env.local');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  const eventType = evt.type;

  // Handle the different event types
  switch (eventType) {
    case 'user.created': {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const primaryEmail = email_addresses?.[0]?.email_address;

      if (!primaryEmail) {
        return new Response('No email address found', { status: 400 });
      }

      await prisma.user.create({
        data: {
          id,
          email: primaryEmail,
          firstName: first_name || null,
          lastName: last_name || null,
          imageUrl: image_url || null,
          settings: {
            create: {
              currency: 'USD',
              onboardingComplete: false,
            },
          },
        },
      });

      // Create default categories for the new user
      const defaultCategories = [
        // Expense categories - Essential
        {
          name: 'Groceries',
          icon: 'ShoppingCart',
          color: '#22c55e',
          type: 'EXPENSE' as const,
          isSystem: true,
        },
        {
          name: 'Food & Dining',
          icon: 'UtensilsCrossed',
          color: '#f97316',
          type: 'EXPENSE' as const,
          isSystem: true,
        },
        {
          name: 'Transportation',
          icon: 'Car',
          color: '#3b82f6',
          type: 'EXPENSE' as const,
          isSystem: true,
        },
        {
          name: 'Rent & Housing',
          icon: 'Home',
          color: '#8b5cf6',
          type: 'EXPENSE' as const,
          isSystem: true,
        },
        {
          name: 'Bills & Utilities',
          icon: 'Receipt',
          color: '#ef4444',
          type: 'EXPENSE' as const,
          isSystem: true,
        },

        // Expense categories - Lifestyle
        {
          name: 'Shopping',
          icon: 'ShoppingBag',
          color: '#ec4899',
          type: 'EXPENSE' as const,
          isSystem: true,
        },
        {
          name: 'Entertainment',
          icon: 'Gamepad2',
          color: '#a855f7',
          type: 'EXPENSE' as const,
          isSystem: true,
        },
        {
          name: 'Subscriptions',
          icon: 'CreditCard',
          color: '#6366f1',
          type: 'EXPENSE' as const,
          isSystem: true,
        },
        {
          name: 'Personal Care',
          icon: 'Sparkles',
          color: '#f472b6',
          type: 'EXPENSE' as const,
          isSystem: true,
        },
        {
          name: 'Clothing',
          icon: 'Shirt',
          color: '#e879f9',
          type: 'EXPENSE' as const,
          isSystem: true,
        },

        // Expense categories - Health & Education
        {
          name: 'Healthcare',
          icon: 'Heart',
          color: '#14b8a6',
          type: 'EXPENSE' as const,
          isSystem: true,
        },
        {
          name: 'Education',
          icon: 'GraduationCap',
          color: '#06b6d4',
          type: 'EXPENSE' as const,
          isSystem: true,
        },
        {
          name: 'Insurance',
          icon: 'Shield',
          color: '#0ea5e9',
          type: 'EXPENSE' as const,
          isSystem: true,
        },

        // Expense categories - Other
        {
          name: 'Travel',
          icon: 'Plane',
          color: '#f59e0b',
          type: 'EXPENSE' as const,
          isSystem: true,
        },
        {
          name: 'Gifts & Donations',
          icon: 'Gift',
          color: '#f43f5e',
          type: 'EXPENSE' as const,
          isSystem: true,
        },
        {
          name: 'Pets',
          icon: 'PawPrint',
          color: '#84cc16',
          type: 'EXPENSE' as const,
          isSystem: true,
        },
        {
          name: 'Home Maintenance',
          icon: 'Wrench',
          color: '#78716c',
          type: 'EXPENSE' as const,
          isSystem: true,
        },
        {
          name: 'Miscellaneous',
          icon: 'MoreHorizontal',
          color: '#6b7280',
          type: 'EXPENSE' as const,
          isSystem: true,
        },

        // Income categories
        {
          name: 'Salary',
          icon: 'Briefcase',
          color: '#10b981',
          type: 'INCOME' as const,
          isSystem: true,
        },
        {
          name: 'Freelance',
          icon: 'Laptop',
          color: '#22c55e',
          type: 'INCOME' as const,
          isSystem: true,
        },
        {
          name: 'Business',
          icon: 'Building2',
          color: '#059669',
          type: 'INCOME' as const,
          isSystem: true,
        },
        {
          name: 'Investment',
          icon: 'TrendingUp',
          color: '#84cc16',
          type: 'INCOME' as const,
          isSystem: true,
        },
        {
          name: 'Rental Income',
          icon: 'Home',
          color: '#65a30d',
          type: 'INCOME' as const,
          isSystem: true,
        },
        { name: 'Bonus', icon: 'Award', color: '#eab308', type: 'INCOME' as const, isSystem: true },
        {
          name: 'Refund',
          icon: 'RotateCcw',
          color: '#0891b2',
          type: 'INCOME' as const,
          isSystem: true,
        },
        {
          name: 'Gift Received',
          icon: 'Gift',
          color: '#f59e0b',
          type: 'INCOME' as const,
          isSystem: true,
        },
        {
          name: 'Other Income',
          icon: 'Plus',
          color: '#6b7280',
          type: 'INCOME' as const,
          isSystem: true,
        },

        // Transfer category
        {
          name: 'Transfer',
          icon: 'ArrowLeftRight',
          color: '#64748b',
          type: 'TRANSFER' as const,
          isSystem: true,
        },
      ];

      await prisma.category.createMany({
        data: defaultCategories.map((cat) => ({
          ...cat,
          userId: id,
        })),
      });

      break;
    }

    case 'user.updated': {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const primaryEmail = email_addresses?.[0]?.email_address;

      await prisma.user.update({
        where: { id },
        data: {
          email: primaryEmail || undefined,
          firstName: first_name || null,
          lastName: last_name || null,
          imageUrl: image_url || null,
        },
      });
      break;
    }

    case 'user.deleted': {
      const { id } = evt.data;
      if (id) {
        // Delete user - cascade will handle related data
        await prisma.user.delete({
          where: { id },
        });
      }
      break;
    }

    default:
      console.log(`Unhandled webhook event type: ${eventType}`);
  }

  return new Response('', { status: 200 });
}
