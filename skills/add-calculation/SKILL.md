# Skill: Add Financial Calculation

Use this skill when adding new financial calculations to DhanDiary.

## ⚠️ Critical Rule

**ALL financial calculations MUST go in `src/lib/finance.ts`**

Never duplicate calculations in components or API routes.

## Steps

### 1. Add Function to finance.ts

```typescript
// src/lib/finance.ts

/**
 * Description of what this function does.
 * @param param1 - Description
 * @returns Description of return value
 */
export function calculateSomething(param1: number): number {
  // Use toNumber() for Decimal inputs
  const value = toNumber(param1);
  
  // Use roundMoney() for money outputs
  return roundMoney(result);
}
```

### 2. Write Tests FIRST

```typescript
// src/lib/finance.test.ts

describe('calculateSomething', () => {
  it('should handle normal case', () => {
    expect(calculateSomething(100)).toBe(expected);
  });

  it('should handle zero', () => {
    expect(calculateSomething(0)).toBe(0);
  });

  it('should handle negative numbers', () => {
    expect(calculateSomething(-100)).toBe(expected);
  });

  it('should handle Decimal objects', () => {
    const decimal = { toNumber: () => 100 };
    expect(calculateSomething(decimal)).toBe(expected);
  });
});
```

### 3. Run Tests

```bash
npm run test:run
```

### 4. Use in Components/API

```typescript
// In component or API route
import { calculateSomething } from '@/lib/finance';

const result = calculateSomething(value);
```

## Helper Functions Available

| Function | Purpose |
|----------|---------|
| `toNumber(value)` | Convert Decimal/number/null to number |
| `roundMoney(value, decimals?)` | Round to 2 decimal places |
| `formatMoney(value)` | Format as currency string |
| `calculatePercentageChange(current, previous)` | Calculate % change |

## Common Patterns

### Handling Prisma Decimals
```typescript
export function myCalculation(
  account: { balance: NumberLike; creditLimit: NumberLike }
): number {
  const balance = toNumber(account.balance);
  const limit = toNumber(account.creditLimit);
  return roundMoney(balance + limit);
}
```

### Returning Multiple Values
```typescript
export interface MyResult {
  total: number;
  average: number;
  count: number;
}

export function calculateMyThing(items: Item[]): MyResult {
  // ... calculation
  return {
    total: roundMoney(total),
    average: roundMoney(average),
    count,
  };
}
```

## Don't Do

```typescript
// ❌ WRONG - Calculation in component
const netWorth = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

// ❌ WRONG - Using Number() instead of toNumber()
const balance = Number(account.balance);

// ❌ WRONG - Not rounding money
return balance + credit; // Could be 100.00000001
```

## Do

```typescript
// ✅ CORRECT - Use finance.ts function
import { calculateNetWorth } from '@/lib/finance';
const { netWorth } = calculateNetWorth(accounts);

// ✅ CORRECT - Use toNumber()
const balance = toNumber(account.balance);

// ✅ CORRECT - Round money values
return roundMoney(balance + credit);
```
