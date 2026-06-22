-- FR-09: Dispute categories, evidence, voting window, anonymous voting
ALTER TABLE "Dispute" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'OTHER';
ALTER TABLE "Dispute" ADD COLUMN "evidenceCid" TEXT;
ALTER TABLE "Dispute" ADD COLUMN "resolution" TEXT;
ALTER TABLE "Dispute" ADD COLUMN "votingDeadline" TIMESTAMP(3) NOT NULL DEFAULT NOW() + INTERVAL '72 hours';
ALTER TABLE "DisputeVote" ADD COLUMN "voterId" TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS "DisputeVote_disputeId_voterId_key" ON "DisputeVote"("disputeId", "voterId");

-- FR-11: Member exit notice period
ALTER TABLE "Membership" ADD COLUMN "exitRequestedAt" TIMESTAMP(3);
