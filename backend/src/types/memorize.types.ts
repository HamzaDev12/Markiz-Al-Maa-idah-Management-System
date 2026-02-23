import type { TargetStatus } from "../generated/prisma/enums.js";

export interface ICreateMemorize {
  studentId: number;
  startSurah: string;
  startAyah: number;
  targetSurah: string;
  targetAyah: number;
  startDate: Date;
  durationMonths: number;
}
