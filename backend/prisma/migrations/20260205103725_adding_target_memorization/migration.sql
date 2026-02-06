-- CreateEnum
CREATE TYPE "TargetStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'ACHIEVED', 'FAILED');

-- CreateTable
CREATE TABLE "MemorizationTarget" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "halaqaId" INTEGER NOT NULL,
    "startSurah" TEXT NOT NULL,
    "startAyah" INTEGER NOT NULL,
    "targetSurah" TEXT NOT NULL,
    "targetAyah" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completeDate" TIMESTAMP(3) NOT NULL,
    "status" "TargetStatus" NOT NULL DEFAULT 'PENDING',
    "currentSurah" TEXT NOT NULL,
    "currentAyah" INTEGER NOT NULL,

    CONSTRAINT "MemorizationTarget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemorizationTarget_studentId_idx" ON "MemorizationTarget"("studentId");

-- CreateIndex
CREATE INDEX "MemorizationTarget_classId_idx" ON "MemorizationTarget"("classId");

-- CreateIndex
CREATE INDEX "MemorizationTarget_halaqaId_idx" ON "MemorizationTarget"("halaqaId");

-- CreateIndex
CREATE INDEX "MemorizationTarget_status_idx" ON "MemorizationTarget"("status");

-- CreateIndex
CREATE INDEX "MemorizationTarget_dueDate_idx" ON "MemorizationTarget"("dueDate");

-- AddForeignKey
ALTER TABLE "MemorizationTarget" ADD CONSTRAINT "MemorizationTarget_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorizationTarget" ADD CONSTRAINT "MemorizationTarget_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorizationTarget" ADD CONSTRAINT "MemorizationTarget_halaqaId_fkey" FOREIGN KEY ("halaqaId") REFERENCES "Halaqa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
