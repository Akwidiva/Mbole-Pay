-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mfaOtp" TEXT,
ADD COLUMN     "mfaOtpExpiry" TIMESTAMP(3);
