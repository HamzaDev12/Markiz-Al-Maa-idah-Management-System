/*
  Warnings:

  - You are about to drop the column `image` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Teacher` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Student" DROP COLUMN "image";

-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "image";
