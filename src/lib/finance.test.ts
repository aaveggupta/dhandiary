import { describe, it, expect } from 'vitest';
import {
  // Rounding & Conversion
  roundMoney,
  toNumber,
  parseAmount,
  moneyEquals,
  // Credit Card
  getCreditCardStatus,
  outstandingToBalance,
  balanceToOutstanding,
  getUtilizationColor,
  getUtilizationBarClass,
  getUtilizationTextClass,
  getUtilizationBgClass,
  // Shared Limits
  calculateSharedLimitStats,
  getAvailableCredit,
  // Transactions
  calculateTransactionImpact,
  getBalanceChange,
  // Net Worth
  calculateNetWorth,
  isLiabilityAccount,
  isAssetAccount,
  // Formatting
  formatCurrency,
  formatPercentage,
  formatSignedCurrency,
  // Percentages
  calculatePercentageChange,
  calculatePercentage,
} from './finance';
import { ACCOUNT_TYPES, TRANSACTION_TYPES } from './constants';

// =============================================================================
// ROUNDING & CONVERSION UTILITIES
// =============================================================================

describe('roundMoney', () => {
  it('should round to 2 decimal places by default', () => {
    expect(roundMoney(10.456)).toBe(10.46);
    expect(roundMoney(10.454)).toBe(10.45);
    expect(roundMoney(10.455)).toBe(10.46); // Round half up
  });

  it('should handle different decimal places', () => {
    expect(roundMoney(10.4567, 3)).toBe(10.457);
    expect(roundMoney(10.4567, 1)).toBe(10.5);
    expect(roundMoney(10.4567, 0)).toBe(10);
  });

  it('should handle edge cases', () => {
    expect(roundMoney(0)).toBe(0);
    expect(roundMoney(-10.456)).toBe(-10.46);
    expect(roundMoney(Infinity)).toBe(0);
    expect(roundMoney(NaN)).toBe(0);
  });

  it('should handle very small numbers', () => {
    expect(roundMoney(0.001)).toBe(0);
    expect(roundMoney(0.005)).toBe(0.01);
    expect(roundMoney(0.004)).toBe(0);
  });
});

describe('toNumber', () => {
  it('should handle regular numbers', () => {
    expect(toNumber(100)).toBe(100);
    expect(toNumber(-50)).toBe(-50);
    expect(toNumber(0)).toBe(0);
  });

  it('should handle null and undefined', () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
  });

  it('should handle Decimal-like objects', () => {
    const decimal = { toNumber: () => 123.45 };
    expect(toNumber(decimal)).toBe(123.45);
  });

  it('should handle objects without toNumber', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(toNumber({} as unknown as any)).toBe(0);
  });
});

describe('parseAmount', () => {
  it('should parse valid numbers', () => {
    expect(parseAmount('100')).toBe(100);
    expect(parseAmount('100.50')).toBe(100.5);
    expect(parseAmount('-50')).toBe(-50);
  });

  it('should handle numeric inputs', () => {
    expect(parseAmount(100)).toBe(100);
    expect(parseAmount(-50)).toBe(-50);
  });

  it('should handle invalid inputs', () => {
    expect(parseAmount('')).toBe(0);
    expect(parseAmount(null)).toBe(0);
    expect(parseAmount(undefined)).toBe(0);
    expect(parseAmount('abc')).toBe(0);
    expect(parseAmount(NaN)).toBe(0);
    expect(parseAmount(Infinity)).toBe(0);
  });
});

describe('moneyEquals', () => {
  it('should return true for equal amounts', () => {
    expect(moneyEquals(100, 100)).toBe(true);
    expect(moneyEquals(100.0, 100)).toBe(true);
    expect(moneyEquals(100.001, 100.002)).toBe(true); // Within tolerance
  });

  it('should return false for different amounts', () => {
    expect(moneyEquals(100, 101)).toBe(false);
    expect(moneyEquals(100.01, 100.02)).toBe(false);
  });
});

// =============================================================================
// CREDIT CARD CALCULATIONS
// =============================================================================

describe('getCreditCardStatus', () => {
  it('should calculate status for card with outstanding balance', () => {
    const result = getCreditCardStatus({ balance: -5000, creditLimit: 100000 });

    expect(result.outstanding).toBe(5000);
    expect(result.creditBalance).toBe(0);
    expect(result.hasCredit).toBe(false);
    expect(result.availableCredit).toBe(95000);
    expect(result.utilization).toBe(5);
  });

  it('should calculate status for card with credit balance', () => {
    const result = getCreditCardStatus({ balance: 1000, creditLimit: 100000 });

    expect(result.outstanding).toBe(0);
    expect(result.creditBalance).toBe(1000);
    expect(result.hasCredit).toBe(true);
    expect(result.availableCredit).toBe(101000);
    expect(result.utilization).toBe(0);
  });

  it('should calculate status for card with zero balance', () => {
    const result = getCreditCardStatus({ balance: 0, creditLimit: 100000 });

    expect(result.outstanding).toBe(0);
    expect(result.creditBalance).toBe(0);
    expect(result.hasCredit).toBe(false);
    expect(result.availableCredit).toBe(100000);
    expect(result.utilization).toBe(0);
  });

  it('should handle high utilization (>100%)', () => {
    const result = getCreditCardStatus({ balance: -120000, creditLimit: 100000 });

    expect(result.outstanding).toBe(120000);
    expect(result.availableCredit).toBe(-20000);
    expect(result.utilization).toBe(120);
  });

  it('should handle zero credit limit', () => {
    const result = getCreditCardStatus({ balance: -5000, creditLimit: 0 });

    expect(result.outstanding).toBe(5000);
    expect(result.availableCredit).toBe(-5000);
    expect(result.utilization).toBe(0); // Can't calculate utilization with 0 limit
  });

  it('should handle Decimal-like values', () => {
    const result = getCreditCardStatus({
      balance: { toNumber: () => -5000 } as unknown as number,
      creditLimit: { toNumber: () => 100000 } as unknown as number,
    });

    expect(result.outstanding).toBe(5000);
    expect(result.availableCredit).toBe(95000);
  });
});

describe('outstandingToBalance', () => {
  it('should convert positive outstanding to negative balance', () => {
    expect(outstandingToBalance(5000)).toBe(-5000);
  });

  it('should convert negative outstanding (credit) to positive balance', () => {
    expect(outstandingToBalance(-1000)).toBe(1000);
  });

  it('should handle zero', () => {
    expect(outstandingToBalance(0)).toBe(0);
  });
});

describe('balanceToOutstanding', () => {
  it('should convert negative balance to positive outstanding', () => {
    expect(balanceToOutstanding(-5000)).toBe(5000);
  });

  it('should convert positive balance (credit) to negative outstanding', () => {
    expect(balanceToOutstanding(1000)).toBe(-1000);
  });

  it('should handle zero', () => {
    expect(balanceToOutstanding(0)).toBe(0);
  });
});

describe('getUtilizationColor', () => {
  it('should return red for high utilization', () => {
    expect(getUtilizationColor(81)).toBe('red');
    expect(getUtilizationColor(100)).toBe('red');
  });

  it('should return amber for medium utilization', () => {
    expect(getUtilizationColor(51)).toBe('amber');
    expect(getUtilizationColor(80)).toBe('amber');
  });

  it('should return green for low utilization', () => {
    expect(getUtilizationColor(0)).toBe('green');
    expect(getUtilizationColor(50)).toBe('green');
  });
});

describe('utilization class helpers', () => {
  it('should return correct bar classes', () => {
    expect(getUtilizationBarClass(90)).toBe('bg-red-500');
    expect(getUtilizationBarClass(60)).toBe('bg-amber-500');
    expect(getUtilizationBarClass(30)).toBe('bg-emerald-500');
  });

  it('should return correct text classes', () => {
    expect(getUtilizationTextClass(90)).toBe('text-red-400');
    expect(getUtilizationTextClass(60)).toBe('text-amber-400');
    expect(getUtilizationTextClass(30)).toBe('text-emerald-400');
  });

  it('should return correct background classes', () => {
    expect(getUtilizationBgClass(90)).toContain('bg-red-500/10');
    expect(getUtilizationBgClass(60)).toContain('bg-amber-500/10');
    expect(getUtilizationBgClass(30)).toContain('bg-emerald-500/10');
  });
});

// =============================================================================
// SHARED CREDIT LIMIT CALCULATIONS
// =============================================================================

describe('calculateSharedLimitStats', () => {
  it('should calculate stats for multiple cards with outstanding', () => {
    const accounts = [
      { id: '1', name: 'Card 1', balance: -3000, bankName: 'HDFC', lastFourDigits: '1234' },
      { id: '2', name: 'Card 2', balance: -2000, bankName: 'HDFC', lastFourDigits: '5678' },
    ];

    const result = calculateSharedLimitStats(100000, accounts);

    expect(result.totalOutstanding).toBe(5000);
    expect(result.availableCredit).toBe(95000);
    expect(result.utilization).toBe(5);
    expect(result.linkedAccounts).toHaveLength(2);
    expect(result.linkedAccounts[0].outstanding).toBe(3000);
    expect(result.linkedAccounts[1].outstanding).toBe(2000);
  });

  it('should handle mixed balances (outstanding and credit)', () => {
    const accounts = [
      { id: '1', name: 'Card 1', balance: -5000 }, // Owes 5000
      { id: '2', name: 'Card 2', balance: 1000 }, // Has 1000 credit
    ];

    const result = calculateSharedLimitStats(100000, accounts);

    // Net outstanding = 5000 - 1000 = 4000
    expect(result.totalOutstanding).toBe(4000);
    expect(result.availableCredit).toBe(96000);
    expect(result.utilization).toBe(4);
    expect(result.linkedAccounts[0].hasCredit).toBe(false);
    expect(result.linkedAccounts[1].hasCredit).toBe(true);
  });

  it('should handle all cards having credit', () => {
    const accounts = [
      { id: '1', name: 'Card 1', balance: 1000 },
      { id: '2', name: 'Card 2', balance: 500 },
    ];

    const result = calculateSharedLimitStats(100000, accounts);

    expect(result.totalOutstanding).toBe(0);
    expect(result.availableCredit).toBe(100000);
    expect(result.utilization).toBe(0);
  });

  it('should handle empty accounts array', () => {
    const result = calculateSharedLimitStats(100000, []);

    expect(result.totalOutstanding).toBe(0);
    expect(result.availableCredit).toBe(100000);
    expect(result.utilization).toBe(0);
    expect(result.linkedAccounts).toHaveLength(0);
  });

  it('should handle zero limit', () => {
    const accounts = [{ id: '1', name: 'Card 1', balance: -5000 }];

    const result = calculateSharedLimitStats(0, accounts);

    expect(result.totalOutstanding).toBe(5000);
    expect(result.availableCredit).toBe(-5000);
    expect(result.utilization).toBe(0); // Can't calculate with 0 limit
  });
});

describe('getAvailableCredit', () => {
  it('should calculate available for individual card', () => {
    const result = getAvailableCredit({
      balance: -5000,
      creditLimit: 100000,
    });

    expect(result).toBe(95000);
  });

  it('should calculate available for card with credit balance', () => {
    const result = getAvailableCredit({
      balance: 1000,
      creditLimit: 100000,
    });

    expect(result).toBe(101000);
  });

  it('should calculate available for card in shared limit', () => {
    const result = getAvailableCredit({
      balance: -3000,
      creditLimit: 50000, // Individual limit ignored
      sharedCreditLimitId: 'shared-1',
      sharedCreditLimit: {
        totalLimit: 100000,
        accounts: [
          { id: '1', balance: -3000 },
          { id: '2', balance: -2000 },
        ],
      },
    });

    // Available = 100000 + (-3000 + -2000) = 95000
    expect(result).toBe(95000);
  });

  it('should handle shared limit with mixed balances', () => {
    const result = getAvailableCredit({
      balance: -3000,
      creditLimit: 50000,
      sharedCreditLimitId: 'shared-1',
      sharedCreditLimit: {
        totalLimit: 100000,
        accounts: [
          { id: '1', balance: -3000 },
          { id: '2', balance: 1000 }, // Credit
        ],
      },
    });

    // Available = 100000 + (-3000 + 1000) = 98000
    expect(result).toBe(98000);
  });
});

// =============================================================================
// TRANSACTION CALCULATIONS
// =============================================================================

describe('calculateTransactionImpact', () => {
  describe('for bank accounts', () => {
    it('should handle income', () => {
      const result = calculateTransactionImpact(
        10000,
        5000,
        TRANSACTION_TYPES.INCOME,
        ACCOUNT_TYPES.BANK
      );

      expect(result.newBalance).toBe(15000);
      expect(result.balanceChange).toBe(5000);
      expect(result.isAllowed).toBe(true);
    });

    it('should handle valid expense', () => {
      const result = calculateTransactionImpact(
        10000,
        5000,
        TRANSACTION_TYPES.EXPENSE,
        ACCOUNT_TYPES.BANK
      );

      expect(result.newBalance).toBe(5000);
      expect(result.balanceChange).toBe(-5000);
      expect(result.isAllowed).toBe(true);
    });

    it('should reject expense exceeding balance', () => {
      const result = calculateTransactionImpact(
        10000,
        15000,
        TRANSACTION_TYPES.EXPENSE,
        ACCOUNT_TYPES.BANK
      );

      expect(result.newBalance).toBe(-5000);
      expect(result.isAllowed).toBe(false);
      expect(result.errorMessage).toContain('Insufficient balance');
    });
  });

  describe('for credit cards', () => {
    it('should handle valid expense within credit', () => {
      const result = calculateTransactionImpact(
        -5000,
        10000,
        TRANSACTION_TYPES.EXPENSE,
        ACCOUNT_TYPES.CREDIT,
        95000
      );

      expect(result.newBalance).toBe(-15000);
      expect(result.balanceChange).toBe(-10000);
      expect(result.isAllowed).toBe(true);
    });

    it('should reject expense exceeding available credit', () => {
      const result = calculateTransactionImpact(
        -5000,
        100000,
        TRANSACTION_TYPES.EXPENSE,
        ACCOUNT_TYPES.CREDIT,
        95000
      );

      expect(result.isAllowed).toBe(false);
      expect(result.errorMessage).toContain('Insufficient credit');
    });

    it('should handle payment (income) to credit card', () => {
      const result = calculateTransactionImpact(
        -5000,
        3000,
        TRANSACTION_TYPES.INCOME,
        ACCOUNT_TYPES.CREDIT,
        95000
      );

      expect(result.newBalance).toBe(-2000);
      expect(result.balanceChange).toBe(3000);
      expect(result.isAllowed).toBe(true);
    });

    it('should handle overpayment creating credit balance', () => {
      const result = calculateTransactionImpact(
        -5000,
        7000,
        TRANSACTION_TYPES.INCOME,
        ACCOUNT_TYPES.CREDIT,
        95000
      );

      expect(result.newBalance).toBe(2000);
      expect(result.isAllowed).toBe(true);
    });
  });

  describe('for transfers', () => {
    it('should have no balance change', () => {
      const result = calculateTransactionImpact(
        10000,
        5000,
        TRANSACTION_TYPES.TRANSFER,
        ACCOUNT_TYPES.BANK
      );

      expect(result.newBalance).toBe(10000);
      expect(result.balanceChange).toBe(0);
      expect(result.isAllowed).toBe(true);
    });
  });
});

describe('getBalanceChange', () => {
  it('should return positive for income', () => {
    expect(getBalanceChange(1000, TRANSACTION_TYPES.INCOME)).toBe(1000);
  });

  it('should return negative for expense', () => {
    expect(getBalanceChange(1000, TRANSACTION_TYPES.EXPENSE)).toBe(-1000);
  });

  it('should return zero for transfer', () => {
    expect(getBalanceChange(1000, TRANSACTION_TYPES.TRANSFER)).toBe(0);
  });

  it('should handle negative amount (make absolute)', () => {
    expect(getBalanceChange(-1000, TRANSACTION_TYPES.INCOME)).toBe(1000);
    expect(getBalanceChange(-1000, TRANSACTION_TYPES.EXPENSE)).toBe(-1000);
  });
});

// =============================================================================
// NET WORTH CALCULATIONS
// =============================================================================

describe('calculateNetWorth', () => {
  it('should calculate net worth from various accounts', () => {
    const accounts = [
      { type: ACCOUNT_TYPES.BANK, balance: 50000 },
      { type: ACCOUNT_TYPES.BANK, balance: 30000 },
      { type: ACCOUNT_TYPES.CASH, balance: 5000 },
      { type: ACCOUNT_TYPES.CREDIT, balance: -15000 }, // Owes 15000
    ];

    const result = calculateNetWorth(accounts);

    expect(result.totalAssets).toBe(85000);
    expect(result.totalLiabilities).toBe(15000);
    expect(result.netWorth).toBe(70000);
  });

  it('should handle credit card with credit balance', () => {
    const accounts = [
      { type: ACCOUNT_TYPES.BANK, balance: 50000 },
      { type: ACCOUNT_TYPES.CREDIT, balance: 1000 }, // Has credit
    ];

    const result = calculateNetWorth(accounts);

    expect(result.totalAssets).toBe(51000); // Bank + credit card credit
    expect(result.totalLiabilities).toBe(0);
    expect(result.netWorth).toBe(51000);
  });

  it('should handle negative bank balance (overdraft)', () => {
    const accounts = [
      { type: ACCOUNT_TYPES.BANK, balance: -5000 }, // Overdraft
      { type: ACCOUNT_TYPES.CASH, balance: 1000 },
    ];

    const result = calculateNetWorth(accounts);

    expect(result.totalAssets).toBe(1000);
    expect(result.totalLiabilities).toBe(5000);
    expect(result.netWorth).toBe(-4000);
  });

  it('should handle empty accounts', () => {
    const result = calculateNetWorth([]);

    expect(result.totalAssets).toBe(0);
    expect(result.totalLiabilities).toBe(0);
    expect(result.netWorth).toBe(0);
  });

  it('should handle Decimal-like balances', () => {
    const accounts = [
      { type: ACCOUNT_TYPES.BANK, balance: { toNumber: () => 50000 } as unknown as number },
      { type: ACCOUNT_TYPES.CREDIT, balance: { toNumber: () => -10000 } as unknown as number },
    ];

    const result = calculateNetWorth(accounts);

    expect(result.totalAssets).toBe(50000);
    expect(result.totalLiabilities).toBe(10000);
    expect(result.netWorth).toBe(40000);
  });
});

describe('isLiabilityAccount', () => {
  it('should return true for credit', () => {
    expect(isLiabilityAccount(ACCOUNT_TYPES.CREDIT)).toBe(true);
  });

  it('should return false for bank and cash', () => {
    expect(isLiabilityAccount(ACCOUNT_TYPES.BANK)).toBe(false);
    expect(isLiabilityAccount(ACCOUNT_TYPES.CASH)).toBe(false);
  });
});

describe('isAssetAccount', () => {
  it('should return true for bank and cash', () => {
    expect(isAssetAccount(ACCOUNT_TYPES.BANK)).toBe(true);
    expect(isAssetAccount(ACCOUNT_TYPES.CASH)).toBe(true);
  });

  it('should return false for credit', () => {
    expect(isAssetAccount(ACCOUNT_TYPES.CREDIT)).toBe(false);
  });
});

// =============================================================================
// FORMATTING UTILITIES
// =============================================================================

describe('formatCurrency', () => {
  it('should format INR by default', () => {
    const result = formatCurrency(10000);
    expect(result).toContain('10,000');
  });

  it('should handle different currencies', () => {
    expect(formatCurrency(1000, 'USD')).toContain('1,000');
    expect(formatCurrency(1000, 'EUR')).toContain('1,000');
  });

  it('should handle decimals', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1,234.56');
  });

  it('should handle zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('should handle negative values', () => {
    const result = formatCurrency(-1000);
    expect(result).toContain('1,000');
  });
});

describe('formatPercentage', () => {
  it('should format percentage with default decimals', () => {
    expect(formatPercentage(75)).toBe('75%');
    expect(formatPercentage(75.5)).toBe('76%');
  });

  it('should format percentage with specified decimals', () => {
    expect(formatPercentage(75.567, 1)).toBe('75.6%');
    expect(formatPercentage(75.567, 2)).toBe('75.57%');
  });
});

describe('formatSignedCurrency', () => {
  it('should add + prefix for positive', () => {
    const result = formatSignedCurrency(1000);
    expect(result).toMatch(/^\+/);
    expect(result).toContain('1,000');
  });

  it('should add - prefix for negative', () => {
    const result = formatSignedCurrency(-1000);
    expect(result).toMatch(/^-/);
    expect(result).toContain('1,000');
  });

  it('should not add prefix for zero', () => {
    const result = formatSignedCurrency(0);
    expect(result).not.toMatch(/^[+-]/);
  });
});

// =============================================================================
// PERCENTAGE CALCULATIONS
// =============================================================================

describe('calculatePercentageChange', () => {
  it('should calculate positive change', () => {
    expect(calculatePercentageChange(120, 100)).toBe(20);
  });

  it('should calculate negative change', () => {
    expect(calculatePercentageChange(80, 100)).toBe(-20);
  });

  it('should handle previous value of zero', () => {
    expect(calculatePercentageChange(100, 0)).toBe(100);
    expect(calculatePercentageChange(-100, 0)).toBe(-100);
    expect(calculatePercentageChange(0, 0)).toBe(0);
  });

  it('should handle negative previous value', () => {
    // From -100 to -50 is a 50% increase (debt reduced by half)
    expect(calculatePercentageChange(-50, -100)).toBe(50);
  });
});

describe('calculatePercentage', () => {
  it('should calculate percentage correctly', () => {
    expect(calculatePercentage(25, 100)).toBe(25);
    expect(calculatePercentage(50, 200)).toBe(25);
  });

  it('should handle zero whole', () => {
    expect(calculatePercentage(25, 0)).toBe(0);
  });

  it('should handle percentages over 100', () => {
    expect(calculatePercentage(150, 100)).toBe(150);
  });
});

// =============================================================================
// EDGE CASES & INTEGRATION
// =============================================================================

describe('edge cases', () => {
  it('should handle very large numbers', () => {
    const result = getCreditCardStatus({
      balance: -9999999999.99,
      creditLimit: 10000000000,
    });

    expect(result.outstanding).toBe(9999999999.99);
    expect(result.availableCredit).toBe(0.01);
  });

  it('should handle very small numbers', () => {
    const result = getCreditCardStatus({
      balance: -0.01,
      creditLimit: 100,
    });

    expect(result.outstanding).toBe(0.01);
    expect(result.availableCredit).toBe(99.99);
  });

  it('should maintain precision through multiple calculations', () => {
    // Start with outstanding
    const balance = outstandingToBalance(1234.56);
    expect(balance).toBe(-1234.56);

    // Convert back
    const outstanding = balanceToOutstanding(balance);
    expect(outstanding).toBe(1234.56);

    // Get status
    const status = getCreditCardStatus({ balance, creditLimit: 10000 });
    expect(status.outstanding).toBe(1234.56);

    // Calculate net worth
    const netWorth = calculateNetWorth([
      { type: ACCOUNT_TYPES.CREDIT, balance },
      { type: ACCOUNT_TYPES.BANK, balance: 5000 },
    ]);
    expect(netWorth.totalLiabilities).toBe(1234.56);
    expect(netWorth.netWorth).toBe(3765.44);
  });
});

describe('real-world scenarios', () => {
  it('should handle paying off credit card completely', () => {
    // User has 15000 outstanding, pays 15000
    const initialBalance = -15000;
    const impact = calculateTransactionImpact(
      initialBalance,
      15000,
      TRANSACTION_TYPES.INCOME,
      ACCOUNT_TYPES.CREDIT,
      85000
    );

    expect(impact.newBalance).toBe(0);
    expect(impact.isAllowed).toBe(true);

    const status = getCreditCardStatus({ balance: impact.newBalance, creditLimit: 100000 });
    expect(status.outstanding).toBe(0);
    expect(status.hasCredit).toBe(false);
    expect(status.availableCredit).toBe(100000);
  });

  it('should handle overpaying credit card', () => {
    // User has 15000 outstanding, pays 20000
    const initialBalance = -15000;
    const impact = calculateTransactionImpact(
      initialBalance,
      20000,
      TRANSACTION_TYPES.INCOME,
      ACCOUNT_TYPES.CREDIT,
      85000
    );

    expect(impact.newBalance).toBe(5000);
    expect(impact.isAllowed).toBe(true);

    const status = getCreditCardStatus({ balance: impact.newBalance, creditLimit: 100000 });
    expect(status.outstanding).toBe(0);
    expect(status.creditBalance).toBe(5000);
    expect(status.hasCredit).toBe(true);
    expect(status.availableCredit).toBe(105000);
  });

  it('should handle shared limit with multiple payments', () => {
    // Two cards sharing 100000 limit
    // Card 1: owes 30000
    // Card 2: owes 20000, then pays 25000 (creating 5000 credit)

    const accounts = [
      { id: '1', name: 'Card 1', balance: -30000 },
      { id: '2', name: 'Card 2', balance: 5000 }, // After overpayment
    ];

    const stats = calculateSharedLimitStats(100000, accounts);

    // Net outstanding = 30000 - 5000 = 25000
    expect(stats.totalOutstanding).toBe(25000);
    expect(stats.availableCredit).toBe(75000);
    expect(stats.utilization).toBe(25);
  });
});
