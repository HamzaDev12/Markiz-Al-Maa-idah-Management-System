import type { Request, Response } from "express";
import { prisma } from "../libs/prisma.js";
import type { AuthRequest } from "../utils/auth.utlis.js";
import { cathError, shorRes } from "../constants/messages.js";
import type { ICreateTeacher } from "../types/teacher.types.js";
import { Role } from "../generated/prisma/enums.js";

export const createTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, salary } = req.body as ICreateTeacher;

    if (!userId || salary === undefined) {
      shorRes(res, 400, "fadlan gali xogta");
      return;
    }

    if (salary <= 0) {
      shorRes(res, 400, "fadlan mushahar saxan gali");
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      shorRes(res, 404, "user-kan lama helin");
      return;
    }

    if (user.role !== Role.TEACHER) {
      shorRes(res, 400, "id ga aad doratay maha macalin");
      return;
    }

    const existingTeacher = await prisma.teacher.findUnique({
      where: {
        userId,
      },
    });

    if (existingTeacher) {
      shorRes(res, 400, "macalinkan hore ayuu u jiray");
      return;
    }

    const created = await prisma.teacher.create({
      data: {
        salary,
        userId,
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            image: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    shorRes(res, 201, "macalin si guul leh ayaa loo abuuray", created);
  } catch (error) {
    cathError(error, res);
  }
};

export const updateTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { salary } = req.body;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "id-gu ma-saxna ");
      return;
    }

    if (!salary) {
      shorRes(res, 400, "fadlan fali mushaharka cusub e macalinka");
      return;
    }
    const teacher = await prisma.teacher.findFirst({
      where: {
        id: Number(id),
      },
    });

    if (!teacher) {
      shorRes(res, 404, "lama helin macalinka");
      return;
    }

    if (salary <= 0) {
      shorRes(res, 400, "fadlan mushahar saxan gali");
      return;
    }

    const updatedTeacher = await prisma.teacher.update({
      where: {
        id: teacher.id,
      },
      data: {
        salary,
      },
    });

    shorRes(
      res,
      200,
      "macalinka si guul leh ayaa loo cusbonaysiyay",
      updatedTeacher,
    );
  } catch (error) {
    cathError(error, res);
  }
};

export const deleteTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { salary } = req.body;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "id-gu ma-saxna ");
      return;
    }

    const teacher = await prisma.teacher.findFirst({
      where: {
        id: Number(id),
      },
      include: {
        classes: true,
        halaqas: true,
        salaries: { where: { status: { not: "PAID" } } },
      },
    });

    if (!teacher) {
      shorRes(res, 404, "macalinka lama helin");
      return;
    }

    if (teacher.classes.length > 0) {
      shorRes(res, 400, "macalinku wuxu lee yahay fasalo, marka hore ka saar");
      return;
    }

    if (teacher.halaqas.length > 0) {
      shorRes(res, 400, "macalinku wuxu lee yahay xalqado, marka hore ka saar");
      return;
    }
    if (teacher.salaries.length > 0) {
      shorRes(res, 400, "macalinka wuxu lee yahay mushahar, aan la bixinin");
      return;
    }

    await prisma.$transaction(async (tx) => {
      (await tx.classSchedule.deleteMany({
        where: {
          id: Number(id),
        },
      }),
        await tx.halaqa.deleteMany({
          where: { id: Number(id) },
        }),
        await tx.teacherAttendance.deleteMany({
          where: { id: Number(id) },
        }),
        await tx.teacherSalary.deleteMany({
          where: { id: Number(id) },
        }),
        await tx.teacher.delete({
          where: { id: Number(id) },
        }),
        await tx.user.delete({
          where: { id: Number(id) },
        }));
    });

    shorRes(res, 200, "macalinka si guul leh ayaa loo tirtiray");
  } catch (error) {
    cathError(error, res);
  }
};

export const getTeacherClasses = async (req: AuthRequest, res: Response) => {
  try {
  } catch (error) {
    cathError(error, res);
  }
};
