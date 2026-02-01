# Skill: Add New Feature

Use this skill when adding a new feature to DhanDiary end-to-end.

## Checklist

### 1. Database (if needed)
- [ ] Update `prisma/schema.prisma`
- [ ] Create migration: `npx prisma migrate dev --name feature_name`
- [ ] Update seed files if needed

### 2. Types
- [ ] Add types to `src/types/index.ts`

### 3. API Routes
- [ ] Create route in `src/app/api/[feature]/route.ts`
- [ ] Add Zod validation schema to `src/lib/validations.ts`
- [ ] Handle errors consistently

### 4. React Query Hook
- [ ] Create hook in `src/hooks/use-[feature].ts`
- [ ] Export from `src/hooks/index.ts`

### 5. UI Components
- [ ] Create component in `src/components/shared/[Feature].tsx`
- [ ] Export from `src/components/shared/index.ts`

### 6. Page Integration
- [ ] Add to relevant page in `src/app/(dashboard)/`

### 7. Testing
- [ ] Add unit tests for calculations
- [ ] Manual testing on localhost

### 8. Final Steps
- [ ] Run `npm run typecheck`
- [ ] Run `npm run lint`
- [ ] Run `npm run format`
- [ ] Run `npm run test:run`
- [ ] Commit with descriptive message

## Example: Adding Budgets Feature

```bash
# 1. Database
# Add to schema.prisma:
model Budget {
  id         String   @id @default(cuid())
  userId     String
  categoryId String
  amount     Decimal  @db.Decimal(12, 2)
  month      Int
  year       Int
  ...
}

# Create migration
npx prisma migrate dev --name add_budgets

# 2. Types (src/types/index.ts)
export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}

# 3. API Route (src/app/api/budgets/route.ts)
# 4. Hook (src/hooks/use-budgets.ts)
# 5. Component (src/components/shared/BudgetCard.tsx)
# 6. Page (src/app/(dashboard)/budgets/page.tsx)
```

## File Naming

| Type | Pattern | Example |
|------|---------|---------|
| API Route | `src/app/api/[feature]/route.ts` | `src/app/api/budgets/route.ts` |
| Hook | `src/hooks/use-[feature].ts` | `src/hooks/use-budgets.ts` |
| Component | `src/components/shared/[Feature].tsx` | `src/components/shared/BudgetCard.tsx` |
| Page | `src/app/(dashboard)/[feature]/page.tsx` | `src/app/(dashboard)/budgets/page.tsx` |
