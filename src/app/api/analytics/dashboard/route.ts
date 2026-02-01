import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TRANSACTION_TYPES } from '@/lib/constants';
import { calculateNetWorth, toNumber, roundMoney, calculatePercentageChange } from '@/lib/finance';

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
      currentMonthTotals,
      prevMonthTotals,
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
      // Current month totals using aggregation (more efficient)
      prisma.transaction.groupBy({
        by: ['type'],
        where: {
          userId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { amount: true },
      }),
      // Previous month totals using aggregation
      prisma.transaction.groupBy({
        by: ['type'],
        where: {
          userId,
          date: {
            gte: startOfPrevMonth,
            lte: endOfPrevMonth,
          },
        },
        _sum: { amount: true },
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
      // Last 7 days transactions for weekly activity (need individual records for daily grouping)
      prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: sevenDaysAgo,
          },
        },
      }),
    ]);

    // Calculate net worth using single source of truth
    const netWorthResult = calculateNetWorth(
      accounts.map(acc => ({ type: acc.type, balance: acc.balance }))
    );
    const netWorth = netWorthResult.netWorth;

    // Current month stats from aggregated data
    const monthlyIncome = roundMoney(
      toNumber(currentMonthTotals.find((t) => t.type === TRANSACTION_TYPES.INCOME)?._sum.amount) || 0
    );

    const monthlyExpenses = roundMoney(
      toNumber(currentMonthTotals.find((t) => t.type === TRANSACTION_TYPES.EXPENSE)?._sum.amount) || 0
    );

    // Previous month stats from aggregated data
    const prevMonthIncome = roundMoney(
      toNumber(prevMonthTotals.find((t) => t.type === TRANSACTION_TYPES.INCOME)?._sum.amount) || 0
    );

    const prevMonthExpenses = roundMoney(
      toNumber(prevMonthTotals.find((t) => t.type === TRANSACTION_TYPES.EXPENSE)?._sum.amount) || 0
    );

    // Calculate percentage changes using single source of truth
    const incomeChange = calculatePercentageChange(monthlyIncome, prevMonthIncome);
    const expenseChange = calculatePercentageChange(monthlyExpenses, prevMonthExpenses);

    // Calculate all-time totals using aggregation (avoids loading all transactions into memory)
    const allTimeTotals = await prisma.transaction.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { amount: true },
    });

    const totalIncome = roundMoney(
      toNumber(allTimeTotals.find((t) => t.type === TRANSACTION_TYPES.INCOME)?._sum.amount) || 0
    );

    const totalExpenses = roundMoney(
      toNumber(allTimeTotals.find((t) => t.type === TRANSACTION_TYPES.EXPENSE)?._sum.amount) || 0
    );

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

      const income = roundMoney(
        dayTransactions
          .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
          .reduce((sum, t) => sum + toNumber(t.amount), 0)
      );

      const expense = roundMoney(
        dayTransactions
          .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
          .reduce((sum, t) => sum + toNumber(t.amount), 0)
      );

      weeklyActivity.push({
        day: dayNames[date.getDay()],
        income,
        expense,
      });
    }

    // Convert Decimal to number for JSON serialization using toNumber
    const serializedAccounts = accounts.map((acc) => ({
      ...acc,
      balance: toNumber(acc.balance),
    }));

    const serializedRecentTransactions = recentTransactions.map((t) => ({
      ...t,
      amount: toNumber(t.amount),
    }));

    return NextResponse.json({
      data: {
        netWorth,
        totalIncome,
        totalExpenses,
        monthlyIncome,
        monthlyExpenses,
        incomeChange: roundMoney(incomeChange, 1),
        expenseChange: roundMoney(expenseChange, 1),
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
