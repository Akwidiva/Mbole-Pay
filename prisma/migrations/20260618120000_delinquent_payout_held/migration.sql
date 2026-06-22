-- AlterTable: add delinquent tracking to Membership (FR-08)
ALTER TABLE "Membership" ADD COLUMN "isDelinquent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Membership" ADD COLUMN "delinquentAt" TIMESTAMP(3);

-- AlterTable: add escrow reason to Payout (FR-08)
ALTER TABLE "Payout" ADD COLUMN "escrowReason" TEXT;
