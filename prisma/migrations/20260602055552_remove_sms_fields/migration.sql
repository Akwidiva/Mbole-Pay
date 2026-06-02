/*
  Warnings:

  - You are about to drop the column `smsContributionReminder` on the `NotificationPreference` table. All the data in the column will be lost.
  - You are about to drop the column `smsDisputeFiled` on the `NotificationPreference` table. All the data in the column will be lost.
  - You are about to drop the column `smsPaymentFailed` on the `NotificationPreference` table. All the data in the column will be lost.
  - You are about to drop the column `smsPaymentSuccess` on the `NotificationPreference` table. All the data in the column will be lost.
  - You are about to drop the column `smsPayoutScheduled` on the `NotificationPreference` table. All the data in the column will be lost.
  - You are about to drop the column `smsVotingReminder` on the `NotificationPreference` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NotificationPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "emailPaymentSuccess" BOOLEAN NOT NULL DEFAULT true,
    "emailPaymentFailed" BOOLEAN NOT NULL DEFAULT true,
    "emailPayoutScheduled" BOOLEAN NOT NULL DEFAULT true,
    "emailDisputeFiled" BOOLEAN NOT NULL DEFAULT true,
    "emailVotingReminder" BOOLEAN NOT NULL DEFAULT true,
    "emailContributionReminder" BOOLEAN NOT NULL DEFAULT true,
    "notificationQuietHours" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT NOT NULL DEFAULT '22:00',
    "quietHoursEnd" TEXT NOT NULL DEFAULT '08:00',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_NotificationPreference" ("createdAt", "emailContributionReminder", "emailDisputeFiled", "emailPaymentFailed", "emailPaymentSuccess", "emailPayoutScheduled", "emailVotingReminder", "id", "notificationQuietHours", "quietHoursEnd", "quietHoursStart", "updatedAt", "userId") SELECT "createdAt", "emailContributionReminder", "emailDisputeFiled", "emailPaymentFailed", "emailPaymentSuccess", "emailPayoutScheduled", "emailVotingReminder", "id", "notificationQuietHours", "quietHoursEnd", "quietHoursStart", "updatedAt", "userId" FROM "NotificationPreference";
DROP TABLE "NotificationPreference";
ALTER TABLE "new_NotificationPreference" RENAME TO "NotificationPreference";
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
