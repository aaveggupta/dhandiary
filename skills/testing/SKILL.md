# Skill: Writing Tests

Use this skill when writing tests for DhanDiary.

## Overview

- **Framework:** Vitest
- **Config:** `vitest.config.ts`
- **Test files:** `*.test.ts` in same directory as source

## Commands

```bash
# Watch mode (re-runs on file changes)
npm run test

# Single run
npm run test:run

# With coverage
npm run test:coverage
```

## File Structure

```
src/lib/
├── finance.ts           # Source file
├── finance.test.ts      # Test file
├── credit-card-insights.test.ts
└── ...
```

## Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { functionName } from './finance';

describe('functionName', () => {
  it('should handle normal case', () => {
    const result = functionName(input);
    expect(result).toBe(expected);
  });

  it('should handle edge case', () => {
    expect(functionName(0)).toBe(0);
  });

  it('should throw on invalid input', () => {
    expect(() => functionName(invalid)).toThrow();
  });
});
```

## What to Test

### Financial Calculations (Required)
```typescript
describe('calculateNetWorth', () => {
  it('should calculate assets minus liabilities', () => {
    const accounts = [
      { type: 'BANK', balance: 100000 },
      { type: 'CREDIT', balance: -15000 },
    ];
    const result = calculateNetWorth(accounts);
    expect(result.netWorth).toBe(85000);
  });
});
```

### Edge Cases (Required)
```typescript
it('should handle zero balance', () => {
  expect(getCreditCardStatus({ balance: 0, creditLimit: 100000 }))
    .toMatchObject({ outstanding: 0, utilization: 0 });
});

it('should handle null/undefined', () => {
  expect(toNumber(null)).toBe(0);
  expect(toNumber(undefined)).toBe(0);
});

it('should handle Prisma Decimal objects', () => {
  const decimal = { toNumber: () => 100 };
  expect(toNumber(decimal)).toBe(100);
});
```

### Boundary Cases
```typescript
it('should handle maximum values', () => {
  expect(roundMoney(999999999.999)).toBe(1000000000);
});

it('should handle negative numbers', () => {
  expect(roundMoney(-100.456)).toBe(-100.46);
});
```

## Matchers Reference

```typescript
// Exact match
expect(value).toBe(expected);

// Object comparison
expect(obj).toEqual({ a: 1, b: 2 });

// Partial object match
expect(obj).toMatchObject({ a: 1 });

// Close to (for floating point)
expect(value).toBeCloseTo(expected, 2);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// Arrays
expect(arr).toContain(item);
expect(arr).toHaveLength(3);

// Errors
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('error message');
```

## Testing Patterns

### Testing Multiple Inputs
```typescript
describe('roundMoney', () => {
  const cases = [
    [100.456, 100.46],
    [100.001, 100],
    [0, 0],
    [-50.999, -51],
  ];

  it.each(cases)('roundMoney(%s) should be %s', (input, expected) => {
    expect(roundMoney(input)).toBe(expected);
  });
});
```

### Testing with Mocks
```typescript
import { vi } from 'vitest';

it('should call callback', () => {
  const callback = vi.fn();
  someFunction(callback);
  expect(callback).toHaveBeenCalledWith(expectedArg);
});
```

## Test Coverage Goals

| Category | Target |
|----------|--------|
| Financial calculations | 100% |
| Utility functions | 90%+ |
| Edge cases | All identified |

## Checklist

- [ ] Test normal/happy path
- [ ] Test edge cases (0, null, undefined)
- [ ] Test negative numbers
- [ ] Test Prisma Decimal inputs
- [ ] Test boundary values
- [ ] Run full test suite before commit
