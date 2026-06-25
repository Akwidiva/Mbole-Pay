DELETE FROM "Payment";
DELETE FROM "Contribution";
DELETE FROM "Payout";
DELETE FROM "Notification" WHERE "groupId" IS NOT NULL;
DELETE FROM "Dispute";
DELETE FROM "Vote";
DELETE FROM "Membership";
DELETE FROM "Group";
