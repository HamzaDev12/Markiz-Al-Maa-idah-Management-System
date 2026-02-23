import type { Response } from "express";
import { prisma } from "../libs/prisma.js";
import type { AuthRequest } from "../utils/auth.utlis.js";
import { cathError, shorRes } from "../constants/messages.js";
import type { ICreateMemorize } from "../types/memorize.types.js";

export const createMemorizeStudent = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const {
      studentId,
      startSurah,
      startAyah,
      targetSurah,
      targetAyah,
      startDate,
      durationMonths = 3,
    } = req.body;

    if (
      !studentId ||
      !startSurah ||
      !startAyah ||
      !targetAyah ||
      !targetSurah
    ) {
      shorRes(res, 400, "fadlan gali xogta o dhamaystiran");
      return;
    }

    if (startAyah < 1 || targetAyah < 1) {
      shorRes(res, 400, "fadlan tirada ayaadaha waa inaad ka badisaa 0");
      return;
    }

    const student = await prisma.student.findUnique({
      where: {
        id: studentId,
      },
      include: {
        halaqa: true,
        class: true,
      },
    });

    if (!student) {
      shorRes(res, 404, "ardaygan mid jira maaha");
      return;
    }

    if (!student.classId) {
      shorRes(
        res,
        400,
        "ardaygan kama tirsana fasal, fadlan marka hore kusoo dar fasal",
      );
      return;
    }

    if (!student.halaqaId) {
      shorRes(
        res,
        400,
        "ardaygan kama tirsana xalqad, fadlan marka hore kusoo dar xalqad",
      );
      return;
    }

    const activeTarget = await prisma.memorizationTarget.findFirst({
      where: {
        studentId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    });

    if (activeTarget) {
      shorRes(res, 400, "ardaygan taxdiid socda ayuu lee yahay");
      return;
    }

    const start = startDate ? new Date(startDate) : new Date();
    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + durationMonths);

    const target = await prisma.memorizationTarget.create({
      data: {
        studentId,
        classId: student.classId,
        halaqaId: student.halaqaId,
        startSurah,
        startAyah,
        targetSurah,
        targetAyah,
        startDate: start,
        dueDate,
        currentSurah: startSurah,
        currentAyah: startAyah,
        completeDate: null,
      },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, image: true } },
          },
        },
        class: true,
        halaqa: true,
      },
    });

    shorRes(res, 201, "taxdiidka si guul leh ayaa loo abuuray", target);
  } catch (error) {
    cathError(error, res);
  }
};
