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
      shorRes(res, 400, "fadlan si sax ah ugali id-ga macalinka ");
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
      shorRes(res, 400, "fadlan si sax ah ugali id-ga macalinka ");
      return;
    }

    const teacher = await prisma.teacher.findUnique({
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

export const getAllTeachers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, isActive, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      OR: [
        { fullName: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
        { phone: { contains: search as string } },
      ];
    }

    if (isActive !== undefined) {
      where.user = {
        ...where.user,
        isActive: isActive === "true",
      };
    }

    const [teachers, total] = await Promise.all([
      await prisma.teacher.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              image: true,
              fullName: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              classes: true,
              halaqas: true,
            },
          },
        },
        orderBy: { id: "desc" },
      }),
      prisma.teacher.count({ where }),
    ]);

    res.status(200).json({
      message: "macalika si guul leh ayaa loo helay",
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        data: teachers,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    cathError(error, res);
  }
};

export const getTeacherById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan si sax ah ugali id-ga macalinka");
      return;
    }

    const teacher = await prisma.teacher.findFirst({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            image: true,
            fullName: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
        classes: {
          include: {
            _count: { select: { students: true, halaqas: true } },
          },
        },
        schedules: {
          include: { class: true },
          orderBy: { startTime: "asc" },
        },
        halaqas: {
          include: {
            class: true,
            _count: { select: { students: true } },
          },
        },
      },
    });

    if (!teacher) {
      shorRes(res, 404, "macalinka lama helin");
      return;
    }

    shorRes(res, 200, "macalinka si guul leh ayaa loo helay", teacher);
  } catch (error) {
    cathError(error, res);
  }
};

export const getTeacherClasses = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan si sax ah ugali id-ga macalinka");
      return;
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!teacher) {
      shorRes(res, 404, "macalinka lama helin");
      return;
    }

    const teacherClasses = await prisma.class.findMany({
      where: {
        teacherId: Number(id),
      },
      include: {
        _count: {
          select: {
            halaqas: true,
            students: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    shorRes(res, 200, "fasalada si guul leh ayaa loo helay", teacherClasses);
  } catch (error) {
    cathError(error, res);
  }
};

export const getTeacherHalaqa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan si saxan u gali id-ga macalinka");
      return;
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!teacher) {
      shorRes(res, 404, "macalinka lama helin");
      return;
    }

    const teacherHalaqas = await prisma.halaqa.findMany({
      where: {
        teacherId: teacher.id,
      },
      include: {
        class: true,
        leader: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        _count: {
          select: {
            students: true,
            subac: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    if (!teacherHalaqas) {
      shorRes(res, 404, "macalinkan wax xalqado ah malahan");
      return;
    }

    shorRes(
      res,
      200,
      "xalqadaha macalinka si guul leh ayaa loo helay",
      teacherHalaqas,
    );
  } catch (error) {
    cathError(error, res);
  }
};

export const getScheduleTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan si saxan u gali id-ga macalinka");
      return;
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!teacher) {
      shorRes(res, 404, "macalinka lama helin");
      return;
    }

    const where: any = { teacherId: Number(id) };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate as string);
      if (endDate) where.startTime.lte = new Date(endDate as string);
    }
    const schedule = await prisma.classSchedule.findMany({
      where,
      include: {
        class: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    shorRes(res, 200, "macalinka jadwalkiisa si saxn ayaa loo helay", schedule);
  } catch (error) {
    cathError(error, res);
  }
};

export const deActiveTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan si saxan u gali id-ga macalinka");
      return;
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!teacher) {
      shorRes(res, 404, "macalinka lama helin");
      return;
    }

    const active = await prisma.user.update({
      where: {
        id: teacher.userId,
      },
      data: {
        isActive: false,
      },
    });

    shorRes(res, 200, "macalinka si guul leh ayaad shaqada uga joojisay");
  } catch (error) {
    cathError(error, res);
  }
};

export const activeTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan si saxan u gali id-ga macalinka");
      return;
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!teacher) {
      shorRes(res, 404, "macalinka lama helin");
      return;
    }

    await prisma.user.update({
      where: {
        id: teacher.userId,
      },
      data: {
        isActive: true,
      },
    });

    shorRes(res, 200, "macalinka si guul leh ayaa loo hawl galiyay");
  } catch (error) {
    cathError(error, res);
  }
};

export const getStudentTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { halqaId, classId } = req.query;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan si saxan u gali id-ga macalinka");
      return;
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        classes: { select: { id: true } },
        halaqas: { select: { id: true } },
      },
    });

    if (!teacher) {
      shorRes(res, 404, "macalinka lama helin");
      return;
    }

    const where: any = {
      OR: [
        { classId: { in: teacher.classes.map((c) => c.id) } },
        { halqaId: { in: teacher.halaqas.map((c) => c.id) } },
      ],
    };

    if (halqaId) {
      where.halqaId = Number(halqaId);
    }

    if (halqaId) {
      where.classId = Number(halqaId);
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            image: true,
            fullName: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
        class: true,
        halaqa: true,
      },
      orderBy: { id: "desc" },
    });

    shorRes(res, 200, "ardeyda macalinkan si guul leh ayaa lo helay", students);
  } catch (error) {
    cathError(error, res);
  }
};

export const teacherHistorySalary = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, year } = req.query;

    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan si saxan u gali id-ga macalinka");
      return;
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!teacher) {
      shorRes(res, 404, "macalinka lama helin");
      return;
    }

    const where: any = { teacherId: Number(id) };

    if (year) {
      where.month = { startWith: year as string };
    }

    if (status) {
      where.status = status;
    }

    const salaries = await prisma.teacherSalary.findMany({
      where,
      orderBy: { month: "desc" },
    });

    const totalEarn = salaries.reduce((sum, s) => sum + s.totalSalary, 0);
    const totalPaid = salaries.reduce((sum, s) => sum + s.paidAmount, 0);
    const total = totalEarn - totalPaid;

    shorRes(res, 200, "macalinka mushaharkiisa si saxn ayaa loo heleay", {
      data: salaries,
      summary: {
        total,
        totalEarn,
        totalPaid,
      },
    });
  } catch (error) {
    cathError(error, res);
  }
};

export const teacherAttendanceHistory = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, month, status } = req.query;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan si saxan u gali id-ga macalinka");
      return;
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!teacher) {
      shorRes(res, 404, "macalinka lama helin");
      return;
    }

    const where: any = { teacherId: Number(id) };

    if (status) {
      where.status = status;
    }
    if (month) {
      const [year, m] = (month as string).split("-");
      const start = new Date(Number(year), Number(m) - 1, 1);
      const end = new Date(Number(year), Number(m), 0);
      where.date = { gte: start, lte: end };
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const attendance = await prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
    });

    const total = attendance.length;
    const absent = attendance.filter((a) => a.status === "ABSENT").length;
    const present = attendance.filter((a) => a.status === "PRESENT").length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : "0";
    const percentageAbsent =
      total > 0 ? ((absent / total) * 100).toFixed(2) : "0";

    shorRes(
      res,
      200,
      "imaanshaha iyo maqnaanshaha macalinka si guul leh ayaa loo heley",
      {
        data: attendance,
        summary: {
          absent,
          present,
          percentage,
          percentageAbsent,
        },
      },
    );
  } catch (error) {
    cathError(error, res);
  }
};
