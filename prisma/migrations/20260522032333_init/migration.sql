-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "emailPaymentSuccess" BOOLEAN NOT NULL DEFAULT true,
    "emailPaymentFailed" BOOLEAN NOT NULL DEFAULT true,
    "emailPayoutScheduled" BOOLEAN NOT NULL DEFAULT true,
    "emailDisputeFiled" BOOLEAN NOT NULL DEFAULT true,
    "emailVotingReminder" BOOLEAN NOT NULL DEFAULT true,
    "emailContributionReminder" BOOLEAN NOT NULL DEFAULT true,
    "smsPaymentSuccess" BOOLEAN NOT NULL DEFAULT true,
    "smsPaymentFailed" BOOLEAN NOT NULL DEFAULT true,
    "smsPayoutScheduled" BOOLEAN NOT NULL DEFAULT true,
    "smsDisputeFiled" BOOLEAN NOT NULL DEFAULT false,
    "smsVotingReminder" BOOLEAN NOT NULL DEFAULT true,
    "smsContributionReminder" BOOLEAN NOT NULL DEFAULT true,
    "notificationQuietHours" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT NOT NULL DEFAULT '22:00',
    "quietHoursEnd" TEXT NOT NULL DEFAULT '08:00',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");
