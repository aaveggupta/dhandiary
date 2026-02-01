# CLAUDE.md - DhanDiary Development Guide

This file contains coding conventions, architecture decisions, and rules for AI assistants (Claude, Cursor, etc.) working on this codebase.

---

## 🏗️ Architecture Overview

### Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL (Neon) with Prisma ORM
- **Auth:** Clerk
- **Styling:** Tailwind CSS
- **State Management:** TanStack Query (React Query)
- **Validation:** Zod
- **Testing:** Vitest

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (sign-in, sign-up)
│   ├── (dashboard)/       # Main app pages
│   ├── (onboarding)/      # Onboarding flow
│   └── api/               # API routes
├── components/
│   ├── ui/                # Base UI components (Button, Input, Card)
│   └── shared/            # Feature components (AccountCard, BankSelect)
├── hooks/                 # React Query hooks
├── lib/                   # Utilities, constants, validations
├── types/                 # TypeScript types
└── providers/             # React context providers
```

---

## ⚠️ Critical Rules

### 1. Single Source of Truth for Calculations

**ALL financial calculations MUST be in `src/lib/finance.ts`**

```typescript
// ✅ CORRECT - Use finance.ts functions
import { calculateNetWorth, getCreditCardStatus, toNumber } from '@/lib/finance';
const netWorth = calculateNetWorth(accounts);

// ❌ WRONG - Don't duplicate calculations in components/API routes
const netWorth = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
```

**Key functions in finance.ts:**
- `toNumber()` - Convert Prisma Decimal to number
- `roundMoney()` - Round to 2 decimal places
- `calculateNetWorth()` - Calculate assets, liabilities, net worth
- `getCreditCardStatus()` - Get outstanding, available credit, utilization
- `getAvailableCredit()` - Get available credit (handles shared limits)
- `calculateSharedLimitStats()` - Stats for shared credit limit groups
- `getUtilizationColor()` - Get color based on utilization %

### 2. Always Use `toNumber()` for Prisma Decimals

```typescript
// ✅ CORRECT
import { toNumber } from '@/lib/finance';
const balance = toNumber(account.balance);

// ❌ WRONG - Don't use Number() directly
const balance = Number(account.balance);
```

### 3. All Calculations Must Be Unit Tested

Tests live in `src/lib/*.test.ts`. Run with:
```bash
npm run test        # Watch mode
npm run test:run    # Single run
```

**Before adding new calculations:**
1. Add the function to `finance.ts`
2. Write tests in `finance.test.ts`
3. Then use it in components/API routes

---

## 💳 Credit Card Balance Convention

**Internal storage:** Negative balance = debt, Positive balance = credit/refund

```typescript
// User owes ₹15,000 → stored as -15000
// User has ₹1,000 credit/refund → stored as +1000

// When displaying to user:
const outstanding = Math.abs(Math.min(balance, 0)); // Amount owed
const creditBalance = Math.max(balance, 0);          // Credit available
```

**Use helper functions:**
```typescript
import { getCreditCardStatus } from '@/lib/finance';

const status = getCreditCardStatus({ balance: -15000, creditLimit: 100000 });
// Returns: { outstanding: 15000, availableCredit: 85000, utilization: 15, ... }
```

---

## 🏦 Bank Dictionary

Banks are stored globally in the `Bank` table, shared across all users.

**Adding new banks:**
- Pre-seeded banks are in `prisma/seed-banks.ts`
- Users can add custom banks via the UI
- Custom banks have `isSystem: false`

**Using BankSelect:**
```tsx
import { BankSelect } from '@/components/shared';

<BankSelect
  value={bankName}
  onChange={(value) => setBankName(value)}
  placeholder="Select bank..."
/>
```

---

## 📝 Code Style

### Run Before Committing
```bash
npm run typecheck   # TypeScript check
npm run lint        # ESLint
npm run format      # Prettier
npm run test:run    # Tests
```

### Naming Conventions
- **Files:** kebab-case (`use-accounts.ts`, `credit-card-insights.test.ts`)
- **Components:** PascalCase (`AccountCard.tsx`, `BankSelect.tsx`)
- **Functions:** camelCase (`calculateNetWorth`, `getAvailableCredit`)
- **Constants:** UPPER_SNAKE_CASE (`ACCOUNT_TYPES`, `TRANSACTION_TYPES`)

### API Routes
- Use Zod for validation
- Return consistent response format: `{ data: ... }` or `{ error: ... }`
- Use `toNumber()` when serializing Prisma Decimals

```typescript
// API response pattern
return NextResponse.json({ data: result });
return NextResponse.json({ error: 'Message' }, { status: 400 });
```

---

## 🔄 React Query Hooks

All data fetching uses React Query hooks in `src/hooks/`.

**Pattern:**
```typescript
// src/hooks/use-accounts.ts
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
```

---

## 🗃️ Database Migrations

**Creating migrations:**
```bash
npx prisma migrate dev --name description_of_change
```

**Applying to production:**
```bash
DATABASE_URL="prod-url" npx prisma migrate deploy
```

**Seeding banks:**
```bash
npx tsx prisma/seed-banks.ts
```

---

## 🧪 Testing Guidelines

**Test file location:** Same directory as source, with `.test.ts` suffix

**What to test:**
- All functions in `finance.ts`
- Complex business logic
- Edge cases (zero values, negative numbers, null handling)

**Test structure:**
```typescript
describe('functionName', () => {
  it('should handle normal case', () => {
    expect(fn(input)).toBe(expected);
  });

  it('should handle edge case', () => {
    expect(fn(edgeInput)).toBe(edgeExpected);
  });
});
```

---

## 📁 Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/finance.ts` | All financial calculations (single source of truth) |
| `src/lib/finance.test.ts` | Tests for financial calculations |
| `src/lib/constants.ts` | App constants (ACCOUNT_TYPES, etc.) |
| `src/lib/validations.ts` | Zod schemas for API validation |
| `src/types/index.ts` | TypeScript type definitions |
| `prisma/schema.prisma` | Database schema |
| `prisma/seed-banks.ts` | Bank seeding script |

---

## 🚫 Don't Do

1. **Don't duplicate calculations** - Always use `finance.ts`
2. **Don't use `Number()` on Prisma Decimals** - Use `toNumber()`
3. **Don't skip tests** for new calculation functions
4. **Don't hardcode bank names** - Use the Bank table
5. **Don't commit without running** `typecheck`, `lint`, `format`

---

## ✅ Do

1. **Do use single source of truth** for all calculations
2. **Do write tests first** for complex logic
3. **Do use TypeScript strictly** - no `any` types
4. **Do follow existing patterns** - check similar files first
5. **Do keep components small** - extract when >200 lines

---

*Last updated: February 2026*
