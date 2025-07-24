/*
  Warnings:

  - You are about to drop the column `notification_methods` on the `AlertConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AlertConfig" DROP COLUMN "notification_methods",
ADD COLUMN     "notification_emails" TEXT[];
