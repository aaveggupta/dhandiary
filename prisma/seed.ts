import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default categories that will be created for each new user via webhook
// This file is for reference and can be used to seed a development database

const defaultCategories = [
  // Expense categories - Essential
  { name: 'Groceries', icon: 'ShoppingCart', color: '#22c55e', type: 'EXPENSE' as const, isSystem: true },
  { name: 'Food & Dining', icon: 'UtensilsCrossed', color: '#f97316', type: 'EXPENSE' as const, isSystem: true },
  { name: 'Transportation', icon: 'Car', color: '#3b82f6', type: 'EXPENSE' as const, isSystem: true },
  { name: 'Rent & Housing', icon: 'Home', color: '#8b5cf6', type: 'EXPENSE' as const, isSystem: true },
  { name: 'Bills & Utilities', icon: 'Receipt', color: '#ef4444', type: 'EXPENSE' as const, isSystem: true },
  
  // Expense categories - Lifestyle
  { name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899', type: 'EXPENSE' as const, isSystem: true },
  { name: 'Entertainment', icon: 'Gamepad2', color: '#a855f7', type: 'EXPENSE' as const, isSystem: true },
  { name: 'Subscriptions', icon: 'CreditCard', color: '#6366f1', type: 'EXPENSE' as const, isSystem: true },
  { name: 'Personal Care', icon: 'Sparkles', color: '#f472b6', type: 'EXPENSE' as const, isSystem: true },
  { name: 'Clothing', icon: 'Shirt', color: '#e879f9', type: 'EXPENSE' as const, isSystem: true },
  
  // Expense categories - Health & Education
  { name: 'Healthcare', icon: 'Heart', color: '#14b8a6', type: 'EXPENSE' as const, isSystem: true },
  { name: 'Education', icon: 'GraduationCap', color: '#06b6d4', type: 'EXPENSE' as const, isSystem: true },
  { name: 'Insurance', icon: 'Shield', color: '#0ea5e9', type: 'EXPENSE' as const, isSystem: true },
  
  // Expense categories - Other
  { name: 'Travel', icon: 'Plane', color: '#f59e0b', type: 'EXPENSE' as const, isSystem: true },
  { name: 'Gifts & Donations', icon: 'Gift', color: '#f43f5e', type: 'EXPENSE' as const, isSystem: true },
  { name: 'Pets', icon: 'PawPrint', color: '#84cc16', type: 'EXPENSE' as const, isSystem: true },
  { name: 'Home Maintenance', icon: 'Wrench', color: '#78716c', type: 'EXPENSE' as const, isSystem: true },
  { name: 'Miscellaneous', icon: 'MoreHorizontal', color: '#6b7280', type: 'EXPENSE' as const, isSystem: true },
  
  // Income categories
  { name: 'Salary', icon: 'Briefcase', color: '#10b981', type: 'INCOME' as const, isSystem: true },
  { name: 'Freelance', icon: 'Laptop', color: '#22c55e', type: 'INCOME' as const, isSystem: true },
  { name: 'Business', icon: 'Building2', color: '#059669', type: 'INCOME' as const, isSystem: true },
  { name: 'Investment', icon: 'TrendingUp', color: '#84cc16', type: 'INCOME' as const, isSystem: true },
  { name: 'Rental Income', icon: 'Home', color: '#65a30d', type: 'INCOME' as const, isSystem: true },
  { name: 'Bonus', icon: 'Award', color: '#eab308', type: 'INCOME' as const, isSystem: true },
  { name: 'Refund', icon: 'RotateCcw', color: '#0891b2', type: 'INCOME' as const, isSystem: true },
  { name: 'Gift Received', icon: 'Gift', color: '#f59e0b', type: 'INCOME' as const, isSystem: true },
  { name: 'Other Income', icon: 'Plus', color: '#6b7280', type: 'INCOME' as const, isSystem: true },
  
  // Transfer category
  { name: 'Transfer', icon: 'ArrowLeftRight', color: '#64748b', type: 'TRANSFER' as const, isSystem: true },
];

async function main() {
  console.log('Seeding database...');

  // Note: Categories are created per-user via the Clerk webhook when a user signs up
  // This seed file demonstrates the structure but doesn't create global categories
  // since our schema ties categories to users

  console.log('Default categories structure:', defaultCategories.length, 'categories defined');
  console.log('Categories will be created automatically when users sign up via Clerk webhook.');

  // If you need to seed a test user for development, you can do:
  // const testUser = await prisma.user.upsert({
  //   where: { id: 'test_user_id' },
  //   update: {},
  //   create: {
  //     id: 'test_user_id',
  //     email: 'test@example.com',
  //     firstName: 'Test',
  //     lastName: 'User',
  //     settings: {
  //       create: {
  //         currency: 'USD',
  //         onboardingComplete: true,
  //       },
  //     },
  //     categories: {
  //       createMany: {
  //         data: defaultCategories,
  //       },
  //     },
  //   },
  // });

  console.log('Seed completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
