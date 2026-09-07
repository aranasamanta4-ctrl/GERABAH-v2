/*
  Warnings:

  - You are about to drop the column `resetTokenExpiry` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenHash` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "resetTokenExpiry",
DROP COLUMN "resetTokenHash";
