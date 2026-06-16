-- AlterTable
ALTER TABLE "User" ADD COLUMN     "idDocumentCid" TEXT,
ADD COLUMN     "kycRejectionReason" TEXT,
ADD COLUMN     "kycReviewedAt" TIMESTAMP(3),
ADD COLUMN     "kycStatus" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "kycSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "selfiePhotoCid" TEXT;
