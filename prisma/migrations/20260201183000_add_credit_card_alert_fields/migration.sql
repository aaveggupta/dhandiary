-- AlterTable (add credit card alert and billing fields)
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "billingCycleDay" INTEGER;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "paymentDueDay" INTEGER;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "utilizationAlertEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "utilizationAlertPercent" INTEGER NOT NULL DEFAULT 30;
