import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration script to update categories for existing users
 * 
 * This script:
 * 1. Renames "Other" to "Miscellaneous" for all users
 * 2. Renames "Gift" (income) to "Gift Received" 
 * 3. Adds new categories that don't exist for each user
 * 
 * Run with: npx tsx prisma/migrate-categories.ts
 */

const newExpenseCategories = [
  { name: 'Groceries', icon: 'ShoppingCart', color: '#22c55e' },
  { name: 'Rent & Housing', icon: 'Home', color: '#8b5cf6' },
  { name: 'Subscriptions', icon: 'CreditCard', color: '#6366f1' },
  { name: 'Personal Care', icon: 'Sparkles', color: '#f472b6' },
  { name: 'Clothing', icon: 'Shirt', color: '#e879f9' },
  { name: 'Insurance', icon: 'Shield', color: '#0ea5e9' },
  { name: 'Travel', icon: 'Plane', color: '#f59e0b' },
  { name: 'Gifts & Donations', icon: 'Gift', color: '#f43f5e' },
  { name: 'Pets', icon: 'PawPrint', color: '#84cc16' },
  { name: 'Home Maintenance', icon: 'Wrench', color: '#78716c' },
];

const newIncomeCategories = [
  { name: 'Business', icon: 'Building2', color: '#059669' },
  { name: 'Rental Income', icon: 'Home', color: '#65a30d' },
  { name: 'Bonus', icon: 'Award', color: '#eab308' },
  { name: 'Refund', icon: 'RotateCcw', color: '#0891b2' },
];

async function main() {
  console.log('Starting category migration...\n');

  // Get all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });

  console.log(`Found ${users.length} users to update.\n`);

  for (const user of users) {
    console.log(`Processing user: ${user.email}`);

    // 1. Rename "Other" to "Miscellaneous"
    const otherCategory = await prisma.category.findFirst({
      where: {
        userId: user.id,
        name: 'Other',
        type: 'EXPENSE',
      },
    });

    if (otherCategory) {
      await prisma.category.update({
        where: { id: otherCategory.id },
        data: { name: 'Miscellaneous' },
      });
      console.log('  ✓ Renamed "Other" → "Miscellaneous"');
    }

    // 2. Rename "Gift" (income) to "Gift Received"
    const giftCategory = await prisma.category.findFirst({
      where: {
        userId: user.id,
        name: 'Gift',
        type: 'INCOME',
      },
    });

    if (giftCategory) {
      await prisma.category.update({
        where: { id: giftCategory.id },
        data: { name: 'Gift Received' },
      });
      console.log('  ✓ Renamed "Gift" → "Gift Received"');
    }

    // 3. Add new expense categories
    for (const cat of newExpenseCategories) {
      const exists = await prisma.category.findFirst({
        where: {
          userId: user.id,
          name: cat.name,
          type: 'EXPENSE',
        },
      });

      if (!exists) {
        await prisma.category.create({
          data: {
            userId: user.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            type: 'EXPENSE',
            isSystem: true,
          },
        });
        console.log(`  ✓ Added expense category: ${cat.name}`);
      }
    }

    // 4. Add new income categories
    for (const cat of newIncomeCategories) {
      const exists = await prisma.category.findFirst({
        where: {
          userId: user.id,
          name: cat.name,
          type: 'INCOME',
        },
      });

      if (!exists) {
        await prisma.category.create({
          data: {
            userId: user.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            type: 'INCOME',
            isSystem: true,
          },
        });
        console.log(`  ✓ Added income category: ${cat.name}`);
      }
    }

    console.log('');
  }

  console.log('Category migration completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Migration failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
