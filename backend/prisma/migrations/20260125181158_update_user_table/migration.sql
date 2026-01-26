/*
  Warnings:

  - You are about to drop the column `purpose` on the `OTP` table. All the data in the column will be lost.
  - You are about to drop the column `authProvider` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OTP" DROP COLUMN "purpose";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "authProvider";

-- DropEnum
DROP TYPE "AuthProvider";

-- DropEnum
DROP TYPE "OTPPurpose";
