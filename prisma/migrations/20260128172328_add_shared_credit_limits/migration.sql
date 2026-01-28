-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "sharedCreditLimitId" TEXT;

-- CreateTable
CREATE TABLE "SharedCreditLimit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalLimit" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedCreditLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SharedCreditLimit_userId_idx" ON "SharedCreditLimit"("userId");

-- CreateIndex
CREATE INDEX "Account_sharedCreditLimitId_idx" ON "Account"("sharedCreditLimitId");

-- AddForeignKey
ALTER TABLE "SharedCreditLimit" ADD CONSTRAINT "SharedCreditLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_sharedCreditLimitId_fkey" FOREIGN KEY ("sharedCreditLimitId") REFERENCES "SharedCreditLimit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
