/**
 * Credit Card Insights Tests
 * 
 * Tests for the credit card insights calculations including:
 * - Utilization calculations
 * - Due date calculations
 * - Alert thresholds
 * - Stress testing with bulk data
 */

import { describe, it, expect } from 'vitest';
import {
  calculateSharedLimitStats,
  calculateNetWorth,
  calculateDaysUntilDue,
  getUtilizationStatus,
} from './finance';
import { ACCOUNT_TYPES } from './constants';

// =============================================================================
// CREDIT CARD INSIGHTS HELPERS (mirroring API logic)
// =============================================================================

interface CreditCardInsight {
  id: string;
  name: string;
  bankName: string | null;
  lastFourDigits: string | null;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  utilizationPercent: number;
  utilizationStatus: 'good' | 'warning' | 'danger';
  billingCycleDay: number | null;
  paymentDueDay: number | null;
  daysUntilDue: number | null;
  utilizationAlertEnabled: boolean;
  utilizationAlertPercent: number;
}

// Using getUtilizationStatus and calculateDaysUntilDue from finance.ts (single source of truth)

function calculateCreditCardInsight(
  card: {
    id: string;
    name: string;
    bankName: string | null;
    lastFourDigits: string | null;
    balance: number;
    creditLimit: number;
    billingCycleDay: number | null;
    paymentDueDay: number | null;
    utilizationAlertEnabled: boolean;
    utilizationAlertPercent: number;
  },
  _currentDay: number = 15,
  today: Date = new Date(2024, 0, _currentDay) // Default to January for predictable 31-day month
): CreditCardInsight {
  const currentBalance = Math.abs(card.balance);
  const creditLimit = card.creditLimit || 0;
  const availableCredit = Math.max(0, creditLimit - currentBalance);
  const utilizationPercent = creditLimit > 0
    ? Math.round((currentBalance / creditLimit) * 100)
    : 0;

  return {
    id: card.id,
    name: card.name,
    bankName: card.bankName,
    lastFourDigits: card.lastFourDigits,
    creditLimit,
    currentBalance,
    availableCredit,
    utilizationPercent,
    utilizationStatus: getUtilizationStatus(utilizationPercent, card.utilizationAlertPercent),
    billingCycleDay: card.billingCycleDay,
    paymentDueDay: card.paymentDueDay,
    // Use finance.ts function - handle null paymentDueDay separately
    daysUntilDue: card.paymentDueDay !== null ? calculateDaysUntilDue(card.paymentDueDay, today) : null,
    utilizationAlertEnabled: card.utilizationAlertEnabled,
    utilizationAlertPercent: card.utilizationAlertPercent,
  };
}

// =============================================================================
// UTILIZATION STATUS TESTS
// =============================================================================

describe('getUtilizationStatus', () => {
  it('should return danger for 75%+ utilization', () => {
    expect(getUtilizationStatus(75, 30)).toBe('danger');
    expect(getUtilizationStatus(90, 30)).toBe('danger');
    expect(getUtilizationStatus(100, 30)).toBe('danger');
  });

  it('should return warning when above threshold but below 75%', () => {
    expect(getUtilizationStatus(30, 30)).toBe('warning');
    expect(getUtilizationStatus(50, 30)).toBe('warning');
    expect(getUtilizationStatus(74, 30)).toBe('warning');
  });

  it('should return good when below threshold', () => {
    expect(getUtilizationStatus(0, 30)).toBe('good');
    expect(getUtilizationStatus(15, 30)).toBe('good');
    expect(getUtilizationStatus(29, 30)).toBe('good');
  });

  it('should respect custom threshold', () => {
    expect(getUtilizationStatus(40, 50)).toBe('good');
    expect(getUtilizationStatus(50, 50)).toBe('warning');
    expect(getUtilizationStatus(60, 50)).toBe('warning');
  });
});

// =============================================================================
// DAYS UNTIL DUE TESTS
// =============================================================================

describe('calculateDaysUntilDue', () => {
  // Use January 2024 (31 days) for predictable results
  const jan2024 = (day: number) => new Date(2024, 0, day);

  // Note: The finance.ts function doesn't accept null - null handling is done at call site
  // This test validates that behavior is correct when called with valid due days

  it('should calculate days when due day is later this month', () => {
    expect(calculateDaysUntilDue(20, jan2024(15))).toBe(5);
    expect(calculateDaysUntilDue(25, jan2024(10))).toBe(15);
    expect(calculateDaysUntilDue(5, jan2024(5))).toBe(0); // Due today
  });

  it('should calculate days when due day is next month', () => {
    // Jan has 31 days, Feb 2024 has 29 days (leap year)
    expect(calculateDaysUntilDue(5, jan2024(25))).toBe(11); // 6 days left in Jan + 5 into Feb
    expect(calculateDaysUntilDue(1, jan2024(28))).toBe(4); // 3 days left in Jan + 1 into Feb
  });

  it('should handle month boundaries for due days > days in next month', () => {
    // From Jan 30 with dueDay 31: due is Jan 31 (tomorrow), so 1 day away
    expect(calculateDaysUntilDue(31, jan2024(30))).toBe(1);

    // From Jan 31 with dueDay 31: due is today, so 0 days away
    expect(calculateDaysUntilDue(31, jan2024(31))).toBe(0);

    // From Feb 1 2024 (leap year, 29 days) with dueDay 31:
    // Due date would be Feb 29 (last day), which is 28 days away
    const feb2024 = (day: number) => new Date(2024, 1, day);
    expect(calculateDaysUntilDue(31, feb2024(1))).toBe(28);
  });
});

// =============================================================================
// CREDIT CARD INSIGHT TESTS
// =============================================================================

describe('calculateCreditCardInsight', () => {
  // Use January 2024 (31 days) for predictable results
  const jan2024 = (day: number) => new Date(2024, 0, day);

  it('should calculate insight for card with outstanding balance', () => {
    const card = {
      id: '1',
      name: 'HDFC Regalia',
      bankName: 'HDFC',
      lastFourDigits: '1234',
      balance: -15000,
      creditLimit: 100000,
      billingCycleDay: 15,
      paymentDueDay: 5,
      utilizationAlertEnabled: true,
      utilizationAlertPercent: 30,
    };

    const insight = calculateCreditCardInsight(card, 20, jan2024(20));

    expect(insight.currentBalance).toBe(15000);
    expect(insight.availableCredit).toBe(85000);
    expect(insight.utilizationPercent).toBe(15);
    expect(insight.utilizationStatus).toBe('good');
    // From Jan 20: 11 days left in Jan (21-31) + 5 into Feb = 16 days
    expect(insight.daysUntilDue).toBe(16);
  });

  it('should flag high utilization correctly', () => {
    const card = {
      id: '1',
      name: 'Test Card',
      bankName: null,
      lastFourDigits: null,
      balance: -80000,
      creditLimit: 100000,
      billingCycleDay: null,
      paymentDueDay: null,
      utilizationAlertEnabled: true,
      utilizationAlertPercent: 30,
    };

    const insight = calculateCreditCardInsight(card);

    expect(insight.utilizationPercent).toBe(80);
    expect(insight.utilizationStatus).toBe('danger');
  });

  it('should flag warning utilization correctly', () => {
    const card = {
      id: '1',
      name: 'Test Card',
      bankName: null,
      lastFourDigits: null,
      balance: -35000,
      creditLimit: 100000,
      billingCycleDay: null,
      paymentDueDay: null,
      utilizationAlertEnabled: true,
      utilizationAlertPercent: 30,
    };

    const insight = calculateCreditCardInsight(card);

    expect(insight.utilizationPercent).toBe(35);
    expect(insight.utilizationStatus).toBe('warning');
  });

  it('should handle zero balance card', () => {
    const card = {
      id: '1',
      name: 'Clean Card',
      bankName: 'ICICI',
      lastFourDigits: '5678',
      balance: 0,
      creditLimit: 50000,
      billingCycleDay: 1,
      paymentDueDay: 20,
      utilizationAlertEnabled: true,
      utilizationAlertPercent: 30,
    };

    const insight = calculateCreditCardInsight(card, 10, jan2024(10));

    expect(insight.currentBalance).toBe(0);
    expect(insight.availableCredit).toBe(50000);
    expect(insight.utilizationPercent).toBe(0);
    expect(insight.utilizationStatus).toBe('good');
    expect(insight.daysUntilDue).toBe(10);
  });

  it('should handle card with zero limit', () => {
    const card = {
      id: '1',
      name: 'No Limit Card',
      bankName: null,
      lastFourDigits: null,
      balance: -5000,
      creditLimit: 0,
      billingCycleDay: null,
      paymentDueDay: null,
      utilizationAlertEnabled: true,
      utilizationAlertPercent: 30,
    };

    const insight = calculateCreditCardInsight(card);

    expect(insight.currentBalance).toBe(5000);
    expect(insight.availableCredit).toBe(0);
    expect(insight.utilizationPercent).toBe(0); // Can't calculate
    expect(insight.utilizationStatus).toBe('good');
  });
});

// =============================================================================
// BULK DATA / STRESS TESTS
// =============================================================================

describe('stress tests - bulk calculations', () => {
  it('should handle 67 credit cards correctly', () => {
    const cards = Array.from({ length: 67 }, (_, i) => ({
      id: `card-${i + 1}`,
      name: `Credit Card ${i + 1}`,
      bankName: ['HDFC', 'ICICI', 'Axis', 'SBI', 'Kotak'][i % 5],
      lastFourDigits: String(1000 + i).slice(-4),
      balance: -(Math.random() * 50000 + 1000), // Random balance 1000-51000
      creditLimit: 100000,
      billingCycleDay: ((i % 28) + 1), // Days 1-28
      paymentDueDay: (((i + 15) % 28) + 1), // Days 1-28
      utilizationAlertEnabled: true,
      utilizationAlertPercent: 30,
    }));

    const insights = cards.map(card => calculateCreditCardInsight(card));

    // Verify all 67 cards processed
    expect(insights).toHaveLength(67);

    // Verify calculations are valid
    insights.forEach((insight, i) => {
      expect(insight.id).toBe(`card-${i + 1}`);
      expect(insight.currentBalance).toBeGreaterThanOrEqual(0);
      expect(insight.availableCredit).toBeGreaterThanOrEqual(0);
      expect(insight.utilizationPercent).toBeGreaterThanOrEqual(0);
      expect(insight.utilizationPercent).toBeLessThanOrEqual(100);
      expect(['good', 'warning', 'danger']).toContain(insight.utilizationStatus);
    });

    // Calculate summary
    const totalLimit = insights.reduce((sum, c) => sum + c.creditLimit, 0);
    const totalBalance = insights.reduce((sum, c) => sum + c.currentBalance, 0);
    const totalAvailable = insights.reduce((sum, c) => sum + c.availableCredit, 0);

    expect(totalLimit).toBe(67 * 100000);
    expect(totalAvailable).toBeCloseTo(totalLimit - totalBalance, 2);
  });

  it('should handle 45 mixed accounts for net worth calculation', () => {
    const accounts = [];
    
    // 20 bank accounts
    for (let i = 0; i < 20; i++) {
      accounts.push({
        type: ACCOUNT_TYPES.BANK,
        balance: Math.random() * 500000 + 10000, // 10k - 510k
      });
    }
    
    // 15 credit cards
    for (let i = 0; i < 15; i++) {
      accounts.push({
        type: ACCOUNT_TYPES.CREDIT,
        balance: -(Math.random() * 50000 + 1000), // -1k to -51k (debt)
      });
    }
    
    // 10 cash accounts
    for (let i = 0; i < 10; i++) {
      accounts.push({
        type: ACCOUNT_TYPES.CASH,
        balance: Math.random() * 20000 + 500, // 500 - 20500
      });
    }

    const result = calculateNetWorth(accounts);

    // Verify calculations
    expect(result.totalAssets).toBeGreaterThan(0);
    expect(result.totalLiabilities).toBeGreaterThan(0);
    expect(result.netWorth).toBeCloseTo(result.totalAssets - result.totalLiabilities, 2);

    // Verify asset accounts contribute correctly
    const expectedAssets = accounts
      .filter(a => a.type === ACCOUNT_TYPES.BANK || a.type === ACCOUNT_TYPES.CASH)
      .reduce((sum, a) => sum + a.balance, 0);
    
    expect(result.totalAssets).toBeCloseTo(expectedAssets, 0); // Allow $1 variance due to rounding

    // Verify liability accounts contribute correctly
    const expectedLiabilities = accounts
      .filter(a => a.type === ACCOUNT_TYPES.CREDIT)
      .reduce((sum, a) => sum + Math.abs(a.balance), 0);
    
    expect(result.totalLiabilities).toBeCloseTo(expectedLiabilities, 0); // Allow $1 variance due to rounding
  });

  it('should handle 500 transactions worth of balance changes', () => {
    let bankBalance = 100000;
    let creditBalance = 0;
    
    const transactions = Array.from({ length: 500 }, (_, i) => {
      const isIncome = Math.random() > 0.6; // 40% income, 60% expense
      const amount = Math.random() * 5000 + 100; // 100-5100
      
      if (isIncome) {
        bankBalance += amount;
      } else {
        // 70% from bank, 30% on credit
        if (Math.random() > 0.3) {
          bankBalance -= amount;
        } else {
          creditBalance -= amount; // Add to credit debt
        }
      }
      
      return {
        type: isIncome ? 'INCOME' : 'EXPENSE',
        amount,
        runningBankBalance: bankBalance,
        runningCreditBalance: creditBalance,
      };
    });

    // Verify final balances
    const finalBankBalance = transactions[499].runningBankBalance;
    const finalCreditBalance = transactions[499].runningCreditBalance;

    // Calculate net worth
    const netWorth = calculateNetWorth([
      { type: ACCOUNT_TYPES.BANK, balance: finalBankBalance },
      { type: ACCOUNT_TYPES.CREDIT, balance: finalCreditBalance },
    ]);

    // Calculate expected values matching calculateNetWorth logic:
    // - Bank: positive = asset, negative = liability (overdraft)
    // - Credit: positive = asset (refund/credit), negative = liability (debt)
    let expectedAssets = 0;
    let expectedLiabilities = 0;
    
    if (finalBankBalance >= 0) {
      expectedAssets += finalBankBalance;
    } else {
      expectedLiabilities += Math.abs(finalBankBalance);
    }
    
    if (finalCreditBalance >= 0) {
      expectedAssets += finalCreditBalance;
    } else {
      expectedLiabilities += Math.abs(finalCreditBalance);
    }

    // Use toBeCloseTo to handle floating point precision issues with random values
    expect(netWorth.totalAssets).toBeCloseTo(expectedAssets, 1);
    expect(netWorth.totalLiabilities).toBeCloseTo(expectedLiabilities, 1);
  });

  it('should handle shared limit with 10 cards', () => {
    const sharedLimit = 1000000; // 10 lakh shared limit
    
    const cards = Array.from({ length: 10 }, (_, i) => ({
      id: `shared-card-${i + 1}`,
      name: `Shared Card ${i + 1}`,
      balance: -(Math.random() * 80000 + 5000), // 5k-85k each
      bankName: 'HDFC',
      lastFourDigits: String(1000 + i),
    }));

    const stats = calculateSharedLimitStats(sharedLimit, cards);

    // Verify calculations
    expect(stats.linkedAccounts).toHaveLength(10);
    
    const expectedOutstanding = cards.reduce((sum, c) => sum + Math.abs(c.balance), 0);
    expect(stats.totalOutstanding).toBeCloseTo(expectedOutstanding, 1); // Allow minor rounding variance
    
    const expectedAvailable = sharedLimit - expectedOutstanding;
    expect(stats.availableCredit).toBeCloseTo(expectedAvailable, 1); // Allow minor rounding variance
    
    const expectedUtilization = Math.round((expectedOutstanding / sharedLimit) * 100);
    expect(stats.utilization).toBe(expectedUtilization);
  });

  it('should maintain precision with extreme values', () => {
    // Very large values
    const largeCard = calculateCreditCardInsight({
      id: 'large',
      name: 'Large Card',
      bankName: null,
      lastFourDigits: null,
      balance: -9999999.99,
      creditLimit: 10000000,
      billingCycleDay: null,
      paymentDueDay: null,
      utilizationAlertEnabled: true,
      utilizationAlertPercent: 30,
    });

    expect(largeCard.currentBalance).toBeCloseTo(9999999.99, 2);
    expect(largeCard.availableCredit).toBeCloseTo(0.01, 2);
    expect(largeCard.utilizationPercent).toBe(100); // Rounded

    // Very small values
    const smallCard = calculateCreditCardInsight({
      id: 'small',
      name: 'Small Card',
      bankName: null,
      lastFourDigits: null,
      balance: -0.01,
      creditLimit: 1000,
      billingCycleDay: null,
      paymentDueDay: null,
      utilizationAlertEnabled: true,
      utilizationAlertPercent: 30,
    });

    expect(smallCard.currentBalance).toBe(0.01);
    expect(smallCard.availableCredit).toBe(999.99);
    expect(smallCard.utilizationPercent).toBe(0); // Rounds to 0
  });
});

// =============================================================================
// ALERT LOGIC TESTS
// =============================================================================

describe('alert filtering logic', () => {
  it('should identify high utilization cards correctly', () => {
    const cards = [
      { utilizationPercent: 90, utilizationAlertEnabled: true, utilizationAlertPercent: 30 },
      { utilizationPercent: 50, utilizationAlertEnabled: true, utilizationAlertPercent: 30 },
      { utilizationPercent: 25, utilizationAlertEnabled: true, utilizationAlertPercent: 30 },
      { utilizationPercent: 80, utilizationAlertEnabled: false, utilizationAlertPercent: 30 }, // Disabled
    ];

    const highUtilization = cards.filter(
      card => card.utilizationAlertEnabled && card.utilizationPercent >= card.utilizationAlertPercent
    );

    expect(highUtilization).toHaveLength(2);
    expect(highUtilization[0].utilizationPercent).toBe(90);
    expect(highUtilization[1].utilizationPercent).toBe(50);
  });

  it('should identify upcoming due dates correctly', () => {
    const cards = [
      { daysUntilDue: 0, name: 'Due Today' },
      { daysUntilDue: 3, name: 'Due in 3 days' },
      { daysUntilDue: 7, name: 'Due in 7 days' },
      { daysUntilDue: 10, name: 'Due in 10 days' },
      { daysUntilDue: null, name: 'No due date' },
    ];

    const upcomingDues = cards
      .filter(card => card.daysUntilDue !== null && card.daysUntilDue <= 7)
      .sort((a, b) => (a.daysUntilDue || 0) - (b.daysUntilDue || 0));

    expect(upcomingDues).toHaveLength(3);
    expect(upcomingDues[0].name).toBe('Due Today');
    expect(upcomingDues[1].name).toBe('Due in 3 days');
    expect(upcomingDues[2].name).toBe('Due in 7 days');
  });
});

// =============================================================================
// SUMMARY CALCULATION TESTS
// =============================================================================

describe('summary calculations', () => {
  it('should calculate correct summary for multiple cards', () => {
    const insights: CreditCardInsight[] = [
      {
        id: '1',
        name: 'Card 1',
        bankName: 'HDFC',
        lastFourDigits: '1234',
        creditLimit: 100000,
        currentBalance: 30000,
        availableCredit: 70000,
        utilizationPercent: 30,
        utilizationStatus: 'warning',
        billingCycleDay: 15,
        paymentDueDay: 5,
        daysUntilDue: 5,
        utilizationAlertEnabled: true,
        utilizationAlertPercent: 30,
      },
      {
        id: '2',
        name: 'Card 2',
        bankName: 'ICICI',
        lastFourDigits: '5678',
        creditLimit: 200000,
        currentBalance: 50000,
        availableCredit: 150000,
        utilizationPercent: 25,
        utilizationStatus: 'good',
        billingCycleDay: 1,
        paymentDueDay: 20,
        daysUntilDue: 10,
        utilizationAlertEnabled: true,
        utilizationAlertPercent: 30,
      },
    ];

    const totalLimit = insights.reduce((sum, c) => sum + c.creditLimit, 0);
    const totalBalance = insights.reduce((sum, c) => sum + c.currentBalance, 0);
    const totalAvailable = insights.reduce((sum, c) => sum + c.availableCredit, 0);
    const overallUtilization = Math.round((totalBalance / totalLimit) * 100);

    expect(totalLimit).toBe(300000);
    expect(totalBalance).toBe(80000);
    expect(totalAvailable).toBe(220000);
    expect(overallUtilization).toBe(27);
  });
});
