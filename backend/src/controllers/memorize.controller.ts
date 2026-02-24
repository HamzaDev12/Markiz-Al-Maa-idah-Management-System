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

    const targets = await prisma.memorizationTarget.create({
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

    shorRes(res, 201, "taxdiidka si guul leh ayaa loo abuuray", targets);
  } catch (error) {
    cathError(error, res);
  }
};

export const deleteMemorization = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga sax");
      return;
    }

    const targets = await prisma.memorizationTarget.findFirst({
      where: {
        id: Number(id),
      },
    });

    if (!targets) {
      shorRes(res, 404, "taxdiidkan mid jira maaha");
      return;
    }

    await prisma.memorizationTarget.delete({
      where: {
        id: targets.id,
      },
    });

    shorRes(res, 200, "taxdiidka si guul leh ayaa loo saaray");
  } catch (error) {
    cathError(error, res);
  }
};

export const updateMemorization = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga sax");
      return;
    }

    const targets = await prisma.memorizationTarget.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!targets) {
      shorRes(res, 404, "taxdiidkan mid jira maaha");
      return;
    }

    if (targets.status === "FAILED" || targets.status === "ACHIEVED") {
      shorRes(res, 400, "hore ayaa loo dhameeyay taxdiidkan");
      return;
    }

    const now = new Date();
    if (now >= targets.dueDate) {
      const updated = await prisma.memorizationTarget.update({
        where: {
          id: Number(id),
        },
        data: {
          status,
          completeDate: now,
        },
      });

      shorRes(res, 200, "taxdiidka si guul leh ayaa loo cusboonaysiiyay");

      return;
    } else {
      shorRes(res, 400, "wali lama gaadhin wakhtiga uu dhamanayay taxdiidku");
      return;
    }
  } catch (error) {
    cathError(error, res);
  }
};

export const getAllMemorization = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [targets, total] = await Promise.all([
      prisma.memorizationTarget.findMany({
        skip,
        take: Number(limit),
        include: {
          class: {
            select: {
              name: true,
            },
          },
          halaqa: {
            select: {
              name: true,
            },
          },
          student: {
            include: {
              user: {
                select: {
                  image: true,
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: {
          dueDate: "desc",
        },
      }),
      prisma.memorizationTarget.count(),
    ]);

    shorRes(res, 200, "taxdiidka si guul leh ayaa loo helay", {
      data: targets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    cathError(error, res);
  }
};

export const getByStudentIdTargets = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { studentId } = req.params;

    if (!studentId || isNaN(Number(studentId))) {
      return shorRes(res, 400, "Fadlan id-ga ardayga sax");
    }

    const targets = await prisma.memorizationTarget.findMany({
      where: {
        studentId: Number(studentId),
      },
      include: {
        class: { select: { name: true } },
        halaqa: { select: { name: true } },
        student: {
          include: {
            user: {
              select: {
                image: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: "desc",
      },
    });

    if (targets.length === 0) {
      return shorRes(res, 404, "Ardaygan wax taxdiid ah ma leh");
    }

    const now = new Date();

    const targetsWithProgress = targets.map((target) => {
      const isOverdue =
        now > target.dueDate &&
        ["PENDING", "IN_PROGRESS"].includes(target.status);

      const daysRemaining = Math.ceil(
        (target.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const totalDays = Math.ceil(
        (target.dueDate.getTime() - target.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const daysElapsed = totalDays - daysRemaining;

      const timeProgress =
        totalDays > 0
          ? Number(((daysElapsed / totalDays) * 100).toFixed(2))
          : 0;

      return {
        ...target,
        isOverdue,
        daysRemaining: daysRemaining < 0 ? 0 : daysRemaining,
        totalDays,
        daysElapsed: daysElapsed < 0 ? 0 : daysElapsed,
        timeProgress,
      };
    });

    shorRes(
      res,
      200,
      "Taxdiidka ardayga si guul leh ayaa loo helay",
      targetsWithProgress,
    );
  } catch (error) {
    cathError(error, res);
  }
};

export const getClassMemorizationStats = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { classId } = req.params;

    if (!classId || isNaN(Number(classId))) {
      return shorRes(res, 400, "Fadlan id-ga fasalka sax");
    }

    const now = new Date();

    const classData = await prisma.class.findUnique({
      where: { id: Number(classId) },
      select: {
        name: true,
        halaqa: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!classData) {
      return shorRes(res, 404, "Fasalkan lama helin");
    }

    const [totalStudents, achievedCount, failedCount] = await Promise.all([
      prisma.student.count({
        where: { classId: Number(classId) },
      }),

      prisma.memorizationTarget.count({
        where: {
          classId: Number(classId),
          status: "ACHIEVED",
        },
      }),

      prisma.memorizationTarget.count({
        where: {
          classId: Number(classId),
          dueDate: { lt: now },
          status: {
            in: ["PENDING", "IN_PROGRESS"],
          },
        },
      }),
    ]);

    const inProgress = totalStudents - achievedCount - failedCount;

    shorRes(res, 200, "Statistics-ka fasalka si guul leh ayaa loo helay", {
      className: classData.name,
      halaqaName: classData.halaqa,
      totalStudents,
      achieved: achievedCount,
      failed: failedCount,
      inProgress: inProgress < 0 ? 0 : inProgress,
    });
  } catch (error) {
    cathError(error, res);
  }
};
