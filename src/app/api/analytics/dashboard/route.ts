import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ACCOUNT_TYPES, TRANSACTION_TYPES } from '@/lib/constants';

// GET /api/analytics/dashboard - Get dashboard statistics
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get previous month date range for comparison
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get last 7 days for weekly activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Run all queries in parallel
    const [
      accounts,
      currentMonthTransactions,
      prevMonthTransactions,
      recentTransactions,
      last7DaysTransactions,
    ] = await Promise.all([
      // Get all accounts with their balances
      prisma.account.findMany({
        where: { userId, isArchived: false },
        select: {
          id: true,
          name: true,
          type: true,
          balance: true,
          currency: true,
        },
      }),
      // Current month transactions
      prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      // Previous month transactions
      prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: startOfPrevMonth,
            lte: endOfPrevMonth,
          },
        },
      }),
      // Recent transactions
      prisma.transaction.findMany({
        where: { userId },
        include: {
          category: true,
          account: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      // Last 7 days transactions for weekly activity
      prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: sevenDaysAgo,
          },
        },
      }),
    ]);

    // Calculate totals (convert Decimal to number)
    const netWorth = accounts.reduce((sum, acc) => {
      const balance = Number(acc.balance);
      // For credit accounts, the balance represents debt
      if (acc.type === ACCOUNT_TYPES.CREDIT) {
        return sum - Math.abs(balance);
      }
      return sum + balance;
    }, 0);

    // Current month stats
    const monthlyIncome = currentMonthTransactions
      .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyExpenses = currentMonthTransactions
      .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Previous month stats for comparison
    const prevMonthIncome = prevMonthTransactions
      .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const prevMonthExpenses = prevMonthTransactions
      .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate percentage changes
    const incomeChange =
      prevMonthIncome === 0
        ? monthlyIncome > 0
          ? 100
          : 0
        : ((monthlyIncome - prevMonthIncome) / prevMonthIncome) * 100;

    const expenseChange =
      prevMonthExpenses === 0
        ? monthlyExpenses > 0
          ? 100
          : 0
        : ((monthlyExpenses - prevMonthExpenses) / prevMonthExpenses) * 100;

    // Calculate all-time totals
    const allTransactions = await prisma.transaction.findMany({
      where: { userId },
    });

    const totalIncome = allTransactions
      .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = allTransactions
      .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Build weekly activity data
    const weeklyActivity = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTransactions = last7DaysTransactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate >= dayStart && tDate <= dayEnd;
      });

      const income = dayTransactions
        .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = dayTransactions
        .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      weeklyActivity.push({
        day: dayNames[date.getDay()],
        income,
        expense,
      });
    }

    // Convert Decimal to number for JSON serialization
    const serializedAccounts = accounts.map((acc) => ({
      ...acc,
      balance: Number(acc.balance),
    }));

    const serializedRecentTransactions = recentTransactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
    }));

    return NextResponse.json({
      data: {
        netWorth,
        totalIncome,
        totalExpenses,
        monthlyIncome,
        monthlyExpenses,
        incomeChange: Math.round(incomeChange * 10) / 10,
        expenseChange: Math.round(expenseChange * 10) / 10,
        recentTransactions: serializedRecentTransactions,
        accountBalances: serializedAccounts,
        weeklyActivity,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
