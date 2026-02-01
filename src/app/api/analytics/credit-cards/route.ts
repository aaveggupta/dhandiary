import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ACCOUNT_TYPES } from '@/lib/constants';
import {
  getCreditCardStatus,
  toNumber,
  roundMoney,
  calculateDaysUntilDue,
  getUtilizationStatus,
} from '@/lib/finance';

export interface CreditCardInsight {
  id: string;
  name: string;
  bankName: string | null;
  lastFourDigits: string | null;
  creditLimit: number;
  currentBalance: number; // Amount owed (positive = debt)
  availableCredit: number;
  utilizationPercent: number;
  utilizationStatus: 'good' | 'warning' | 'danger';
  billingCycleDay: number | null;
  paymentDueDay: number | null;
  daysUntilDue: number | null;
  utilizationAlertEnabled: boolean;
  utilizationAlertPercent: number;
  // Additional fields for shared limit context
  sharedCreditLimitId: string | null;
  isPartOfSharedLimit: boolean;
}

// GET /api/analytics/credit-cards - Get credit card insights
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all credit card accounts with shared limit details including all linked accounts
    const creditCards = await prisma.account.findMany({
      where: {
        userId,
        type: ACCOUNT_TYPES.CREDIT,
        isArchived: false,
      },
      include: {
        sharedCreditLimit: {
          include: {
            accounts: {
              where: { isArchived: false },
              select: { id: true, balance: true },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const today = new Date();

    // Pre-calculate shared limit totals for accurate utilization
    const sharedLimitTotals = new Map<string, { totalBalance: number; totalLimit: number }>();
    for (const card of creditCards) {
      if (card.sharedCreditLimitId && card.sharedCreditLimit) {
        if (!sharedLimitTotals.has(card.sharedCreditLimitId)) {
          const totalLimit = toNumber(card.sharedCreditLimit.totalLimit);
          const totalBalance = card.sharedCreditLimit.accounts.reduce(
            (sum, acc) => sum + toNumber(acc.balance),
            0
          );
          sharedLimitTotals.set(card.sharedCreditLimitId, { totalBalance, totalLimit });
        }
      }
    }

    const insights: CreditCardInsight[] = creditCards.map((card) => {
      const isPartOfSharedLimit = !!(card.sharedCreditLimitId && card.sharedCreditLimit);

      // For shared limits, use individual card's balance but shared limit for context
      const individualBalance = toNumber(card.balance);
      const creditLimit = isPartOfSharedLimit
        ? toNumber(card.sharedCreditLimit!.totalLimit)
        : toNumber(card.creditLimit) || 0;

      // Calculate individual card status
      const cardStatus = getCreditCardStatus({
        balance: individualBalance,
        creditLimit: isPartOfSharedLimit ? toNumber(card.creditLimit) || creditLimit : creditLimit,
      });

      const currentBalance = cardStatus.outstanding;

      // For utilization, use shared limit context if applicable
      let utilizationPercent: number;
      let availableCredit: number;

      if (isPartOfSharedLimit) {
        const sharedTotals = sharedLimitTotals.get(card.sharedCreditLimitId!)!;
        // Utilization based on total shared balance vs shared limit
        const totalOutstanding = Math.abs(Math.min(sharedTotals.totalBalance, 0));
        utilizationPercent =
          sharedTotals.totalLimit > 0
            ? Math.round((totalOutstanding / sharedTotals.totalLimit) * 100)
            : 0;
        // Available credit is shared pool available
        availableCredit = roundMoney(sharedTotals.totalLimit + sharedTotals.totalBalance);
      } else {
        utilizationPercent = cardStatus.utilization;
        availableCredit = cardStatus.availableCredit;
      }

      // Determine utilization status using finance utility
      // Use ?? instead of || to handle explicit 0 values
      const alertThreshold = card.utilizationAlertPercent ?? 30;
      const utilizationStatus = getUtilizationStatus(utilizationPercent, alertThreshold);

      // Calculate days until due with proper month boundary handling
      const daysUntilDue = card.paymentDueDay
        ? calculateDaysUntilDue(card.paymentDueDay, today)
        : null;

      return {
        id: card.id,
        name: card.name,
        bankName: card.bankName,
        lastFourDigits: card.lastFourDigits,
        creditLimit: isPartOfSharedLimit ? toNumber(card.creditLimit) || 0 : creditLimit,
        currentBalance,
        availableCredit,
        utilizationPercent,
        utilizationStatus,
        billingCycleDay: card.billingCycleDay,
        paymentDueDay: card.paymentDueDay,
        daysUntilDue,
        utilizationAlertEnabled: card.utilizationAlertEnabled,
        utilizationAlertPercent: card.utilizationAlertPercent,
        sharedCreditLimitId: card.sharedCreditLimitId,
        isPartOfSharedLimit,
      };
    });

    // Calculate summary stats correctly - don't double-count shared limits
    const seenSharedLimits = new Set<string>();
    let totalCreditLimit = 0;
    let totalBalance = 0;
    let totalAvailable = 0;

    for (const card of creditCards) {
      const balance = Math.abs(Math.min(toNumber(card.balance), 0)); // Outstanding only
      totalBalance += balance;

      if (card.sharedCreditLimitId) {
        // Only count shared limit once
        if (!seenSharedLimits.has(card.sharedCreditLimitId)) {
          const sharedTotals = sharedLimitTotals.get(card.sharedCreditLimitId);
          if (sharedTotals) {
            totalCreditLimit += sharedTotals.totalLimit;
            totalAvailable += Math.max(0, sharedTotals.totalLimit + sharedTotals.totalBalance);
          }
          seenSharedLimits.add(card.sharedCreditLimitId);
        }
      } else {
        // Individual card
        const limit = toNumber(card.creditLimit) || 0;
        totalCreditLimit += limit;
        totalAvailable += Math.max(0, limit + toNumber(card.balance));
      }
    }

    totalCreditLimit = roundMoney(totalCreditLimit);
    totalBalance = roundMoney(totalBalance);
    totalAvailable = roundMoney(totalAvailable);

    const overallUtilization =
      totalCreditLimit > 0 ? Math.round((totalBalance / totalCreditLimit) * 100) : 0;

    // Cards with high utilization (above their alert threshold)
    const highUtilizationCards = insights.filter(
      (card) =>
        card.utilizationAlertEnabled && card.utilizationPercent >= card.utilizationAlertPercent
    );

    // Cards with upcoming due dates (within 7 days)
    const upcomingDues = insights
      .filter((card) => card.daysUntilDue !== null && card.daysUntilDue <= 7)
      .sort((a, b) => (a.daysUntilDue || 0) - (b.daysUntilDue || 0));

    return NextResponse.json({
      data: {
        cards: insights,
        summary: {
          totalCards: insights.length,
          totalCreditLimit,
          totalBalance,
          totalAvailable,
          overallUtilization,
        },
        alerts: {
          highUtilization: highUtilizationCards,
          upcomingDues,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching credit card insights:', error);
    return NextResponse.json({ error: 'Failed to fetch credit card insights' }, { status: 500 });
  }
}
