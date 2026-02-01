import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ACCOUNT_TYPES } from '@/lib/constants';

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
}

// GET /api/analytics/credit-cards - Get credit card insights
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all credit card accounts
    const creditCards = await prisma.account.findMany({
      where: {
        userId,
        type: ACCOUNT_TYPES.CREDIT,
        isArchived: false,
      },
      include: {
        sharedCreditLimit: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const today = new Date();
    const currentDay = today.getDate();

    const insights: CreditCardInsight[] = creditCards.map((card) => {
      // For credit cards, balance is typically negative (representing debt)
      // We'll treat the absolute value as the amount owed
      const currentBalance = Math.abs(Number(card.balance));
      
      // Use shared limit if available, otherwise individual limit
      const creditLimit = card.sharedCreditLimit 
        ? Number(card.sharedCreditLimit.totalLimit)
        : Number(card.creditLimit) || 0;
      
      const availableCredit = Math.max(0, creditLimit - currentBalance);
      const utilizationPercent = creditLimit > 0 
        ? Math.round((currentBalance / creditLimit) * 100) 
        : 0;

      // Determine utilization status
      let utilizationStatus: 'good' | 'warning' | 'danger' = 'good';
      if (utilizationPercent >= 75) {
        utilizationStatus = 'danger';
      } else if (utilizationPercent >= (card.utilizationAlertPercent || 30)) {
        utilizationStatus = 'warning';
      }

      // Calculate days until due
      let daysUntilDue: number | null = null;
      if (card.paymentDueDay) {
        const dueDay = card.paymentDueDay;
        if (currentDay <= dueDay) {
          // Due date is this month
          daysUntilDue = dueDay - currentDay;
        } else {
          // Due date is next month
          const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          daysUntilDue = (daysInCurrentMonth - currentDay) + dueDay;
        }
      }

      return {
        id: card.id,
        name: card.name,
        bankName: card.bankName,
        lastFourDigits: card.lastFourDigits,
        creditLimit,
        currentBalance,
        availableCredit,
        utilizationPercent,
        utilizationStatus,
        billingCycleDay: card.billingCycleDay,
        paymentDueDay: card.paymentDueDay,
        daysUntilDue,
        utilizationAlertEnabled: card.utilizationAlertEnabled,
        utilizationAlertPercent: card.utilizationAlertPercent,
      };
    });

    // Summary stats
    const totalCreditLimit = insights.reduce((sum, card) => sum + card.creditLimit, 0);
    const totalBalance = insights.reduce((sum, card) => sum + card.currentBalance, 0);
    const totalAvailable = insights.reduce((sum, card) => sum + card.availableCredit, 0);
    const overallUtilization = totalCreditLimit > 0 
      ? Math.round((totalBalance / totalCreditLimit) * 100) 
      : 0;

    // Cards with high utilization (above their alert threshold)
    const highUtilizationCards = insights.filter(
      (card) => card.utilizationAlertEnabled && card.utilizationPercent >= card.utilizationAlertPercent
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
