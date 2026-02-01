# Skill: Database Schema Changes

Use this skill when making changes to the database schema.

## Overview

- **ORM:** Prisma
- **Database:** PostgreSQL (Neon)
- **Schema file:** `prisma/schema.prisma`

## Adding a New Table

### 1. Update Schema

```prisma
// prisma/schema.prisma

model NewTable {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  amount    Decimal  @db.Decimal(12, 2)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

### 2. Add Relation to User (if needed)

```prisma
model User {
  // ... existing fields
  newTables NewTable[]
}
```

### 3. Create Migration

```bash
npx prisma migrate dev --name add_new_table
```

### 4. Generate Client

```bash
npx prisma generate
```

## Adding Fields to Existing Table

### 1. Update Schema

```prisma
model Account {
  // ... existing fields
  newField    String?  // Optional field (nullable)
  newRequired String   @default("default_value")  // Required with default
}
```

### 2. Create Migration

```bash
npx prisma migrate dev --name add_new_field_to_account
```

## Field Types Reference

| Prisma Type | PostgreSQL | TypeScript |
|-------------|------------|------------|
| `String` | TEXT | string |
| `Int` | INTEGER | number |
| `Boolean` | BOOLEAN | boolean |
| `DateTime` | TIMESTAMP | Date |
| `Decimal` | DECIMAL(12,2) | Decimal (use toNumber()) |
| `String?` | TEXT NULL | string \| null |

## Common Patterns

### Money Fields
```prisma
amount    Decimal  @db.Decimal(12, 2)
```

### Optional Foreign Key
```prisma
categoryId String?
category   Category? @relation(fields: [categoryId], references: [id])
```

### Indexes
```prisma
@@index([userId])
@@index([date])
@@unique([userId, month, year])
```

### Enums
```prisma
enum AccountType {
  BANK
  CREDIT
  CASH
}

model Account {
  type AccountType
}
```

## Production Deployment

### Apply Migrations
```bash
DATABASE_URL="production-url" npx prisma migrate deploy
```

### Run Seed (if needed)
```bash
DATABASE_URL="production-url" npx tsx prisma/seed-banks.ts
```

## Troubleshooting

### Migration Drift
If database is out of sync with migrations:
```bash
# Check status
npx prisma migrate status

# Mark migration as applied (if already applied manually)
npx prisma migrate resolve --applied migration_name
```

### Reset Database (Development Only!)
```bash
npx prisma migrate reset
```
⚠️ This deletes ALL data!

## Checklist

- [ ] Update `prisma/schema.prisma`
- [ ] Run `npx prisma migrate dev --name descriptive_name`
- [ ] Run `npx prisma generate`
- [ ] Update TypeScript types in `src/types/index.ts`
- [ ] Update API routes to handle new fields
- [ ] Update validation schemas in `src/lib/validations.ts`
- [ ] Test locally
- [ ] Document migration in PR description
