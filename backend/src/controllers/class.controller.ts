import type { Response } from "express";
import { cathError, shorRes } from "../constants/messages.js";
import type { AuthRequest } from "../utils/auth.utlis.js";
import type { ICreateClass, IUpdateClass } from "../types/class.types.js";
import { prisma } from "../libs/prisma.js";

export const createClass = async (req: AuthRequest, res: Response) => {
  try {
    const { name, teacherId }: ICreateClass = req.body;
    if (!name || !teacherId) {
      shorRes(res, 400, "fadlan gali xogta fasalka cusub");
      return;
    }

    const existingClass = await prisma.class.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
      },
      include: {
        teacher: true,
      },
    });

    if (existingClass) {
      shorRes(res, 400, "fasalkan hore ayaa loo sameeyay");
      return;
    }

    const teacher = await prisma.teacher.findFirst({
      where: {
        id: teacherId,
      },
      include: {
        classes: true,
      },
    });

    if (!teacher) {
      shorRes(res, 404, "macalinkan mid jira maaha");
      return;
    }

    const creating = await prisma.class.create({
      data: {
        name,
        teacherId,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: { fullName: true, email: true },
            },
          },
        },
      },
    });

    shorRes(res, 201, "fasalka si guul leh ayaa loo sameeyay", creating);
  } catch (error) {
    cathError(error, res);
  }
};

export const getAllClasses = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search, teacherId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (search) {
      where.name = { contians: search as string, mode: "insensitive" };
    }

    if (teacherId) {
      where.teacherId = Number(teacherId);
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
          _count: {
            select: {
              exams: true,
              halaqas: true,
              schedules: true,
              students: true,
            },
          },
        },
        orderBy: { id: "desc" },
      }),
      prisma.class.count({ where }),
    ]);

    shorRes(res, 200, "fasalada si guul leh ayaa loo helay", {
      data: classes,
      pagination: {
        page: Number(page),
        take: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    cathError(error, res);
  }
};

export const getClassById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga fasalka sax");
      return;
    }

    const clssData = await prisma.class.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        _count: {
          select: {
            halaqas: true,
            students: true,
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                image: true,
              },
            },
          },
        },
        halaqas: {
          include: {
            leader: {
              include: {
                user: {
                  select: { fullName: true },
                },
              },
            },
          },
        },
      },
    });

    if (!clssData) {
      shorRes(res, 404, "fasalkan lama helin");
      return;
    }

    shorRes(res, 200, "si guul leh ayaa loo helay fasalakan", clssData);
  } catch (error) {
    cathError(error, res);
  }
};

export const changeTeacherClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { teacherId } = req.body;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga fasalka sax");
      return;
    }

    if (!teacherId) {
      shorRes(res, 400, "fadlan gali id-ga macalinka cusub");
      return;
    }
    const existingClass = await prisma.class.findFirst({
      where: {
        id: Number(id),
      },
      include: {
        teacher: true,
      },
    });

    if (!existingClass) {
      shorRes(res, 404, "fasalkan mid jira maaha");
      return;
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },
    });

    if (!teacher) {
      shorRes(res, 404, "macalinkan mid jira maaha");
      return;
    }

    const updated = await prisma.class.update({
      where: {
        id: Number(id),
      },
      data: {
        teacherId,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                fullName: true,
                image: true,
                email: true,
              },
            },
          },
        },
      },
    });

    shorRes(
      res,
      200,
      "si guul leh ayaad fasalkan uga badashay macalinka",
      updated,
    );
  } catch (error) {
    cathError(error, res);
  }
};

export const updateClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { teacherId, name, rank, averageScore }: IUpdateClass = req.body;

    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga fasalka sax");
      return;
    }

    if (
      teacherId === undefined &&
      name === undefined &&
      rank === undefined &&
      averageScore === undefined
    ) {
      shorRes(res, 400, "fadlan ugu yaraan hal xog soo geli");
      return;
    }

    const existingClass = await prisma.class.findFirst({
      where: {
        id: Number(id),
      },
    });

    if (!existingClass) {
      shorRes(res, 404, "fasalkan mid jira maaha");
      return;
    }

    if (name && name === existingClass.name) {
      shorRes(res, 400, "magacan hore ayuu u haystay fasalkan");
      return;
    }

    if (name && name !== existingClass.name) {
      const searcClass = await prisma.class.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          id: { not: Number(id) },
        },
      });

      if (searcClass) {
        shorRes(res, 400, "magaca cusub e fasalkan hore ayuu u jiray");
        return;
      }
    }

    if (teacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: {
          id: teacherId,
        },
      });

      if (!teacher) {
        shorRes(res, 404, "macalinkan mid jira maaha");
        return;
      }
    }

    const updated = await prisma.class.update({
      where: {
        id: existingClass.id,
      },
      data: {
        ...(name && { name }),
        ...(teacherId && { teacherId }),
        ...(rank !== undefined && { rank }),
        ...(averageScore !== undefined && { averageScore }),
      },
    });

    shorRes(res, 200, "si guul leh ayaa loo badalay fasalkan", updated);
  } catch (error) {
    cathError(error, res);
  }
};

export const deleteClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga sax");
      return;
    }

    const existingClass = await prisma.class.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        students: true,
        halaqas: true,
      },
    });

    if (!existingClass) {
      shorRes(res, 404, "fasalkan mid jira maaha");
      return;
    }

    if (existingClass.halaqas.length > 0) {
      shorRes(
        res,
        400,
        `fasalkan masaari kartid, waxa uu lee yahay ${existingClass.halaqas.length} xalqadood`,
      );
      return;
    }
    if (existingClass.students.length > 0) {
      shorRes(
        res,
        400,
        `fasalkan masaari kartid, waxa uu lee yahay ${existingClass.students.length} arday `,
      );
      return;
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const exam = await prisma.exam.findMany({
        where: {
          classId: Number(id),
        },
        select: {
          id: true,
        },
      });

      const examIds = exam.map((e) => e.id);
      await tx.result.deleteMany({
        where: { examId: { in: examIds } },
      });

      await tx.exam.deleteMany({
        where: {
          classId: Number(id),
        },
      });

      await tx.classSchedule.deleteMany({
        where: {
          classId: Number(id),
        },
      });

      await tx.class.delete({
        where: {
          id: Number(id),
        },
      });
    });

    shorRes(res, 200, "si guul leh ayaa fasalkan loo saaray");
  } catch (error) {
    cathError(error, res);
  }
};

export const getClassStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, active, gender, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan sax id-ga fasalka");
      return;
    }

    const existingClass = await prisma.class.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!existingClass) {
      shorRes(res, 404, "majiro fasalkan");
      return;
    }
    const where: any = { classId: Number(id) };

    if (search) {
      where.use = {
        OR: [
          { fullname: { contains: search as string, mode: "insensitive" } },
          { email: { contains: search as string, mode: "insensitive" } },
        ],
      };
    }

    if (gender) {
      where.gender = gender;
    }

    if (active !== undefined) {
      where.active = active === "true";
    }

    const [classStudens, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
              image: true,
            },
          },
          halaqa: true,
          memorizationTargets: {
            select: {
              status: true,
              targetAyah: true,
              targetSurah: true,
            },
          },
        },
        orderBy: { id: "desc" },
      }),
      prisma.student.count({ where }),
    ]);

    shorRes(res, 200, "fasalka ardeydiisa si guul leh ayaa loo helay", {
      date: classStudens,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    cathError(error, res);
  }
};

export const getClassHalaqas = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan sax id-ga fasalka");
      return;
    }

    const existingClass = await prisma.class.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!existingClass) {
      shorRes(res, 404, "fasalkan mid jira maaha");
      return;
    }

    const halaqas = await prisma.halaqa.findMany({
      where: {
        classId: Number(id),
      },
      include: {
        leader: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    shorRes(
      res,
      200,
      "fasalkan xalqadihiisa si guul leh ayaa loo helay",
      halaqas,
    );
  } catch (error) {
    cathError(error, res);
  }
};

export const getClassSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan sax id-ga fasalka");
      return;
    }

    const existingClass = await prisma.class.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!existingClass) {
      shorRes(res, 404, "fasalkan mid jira maaha");
      return;
    }

    const where: any = { classId: Number(id) };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate as string);
      if (endDate) where.startTime.lte = new Date(endDate as string);
    }

    const scheduleClass = await prisma.classSchedule.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    shorRes(
      res,
      200,
      "jadwalka fasalkan si guul leh ayaa loo helay",
      scheduleClass,
    );
  } catch (error) {
    cathError(error, res);
  }
};

export const getClassExams = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { upcomming } = req.query;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan sax id-ga fasalka");
      return;
    }

    const existingClass = await prisma.class.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!existingClass) {
      shorRes(res, 404, "fasalkan mid jira maaha");
      return;
    }

    const where: any = { classId: Number(id) };

    if (upcomming === "true") {
      where.date = { gte: new Date() };
    } else if (upcomming === "false") {
      where.date = { lt: new Date() };
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        _count: {
          select: {
            results: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    shorRes(
      res,
      200,
      "imtaxanaadka fasalkan si guul leh ayaa loo helay",
      exams,
    );
  } catch (error) {
    cathError(error, res);
  }
};

export const getClassAttendanceReport = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { date, startDate, endDate } = req.query;

    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan sax id-ga fasalka");
      return;
    }

    const classExists = await prisma.class.findUnique({
      where: { id: Number(id) },
    });

    if (!classExists) {
      shorRes(res, 404, "fasalkan majiro");
      return;
    }

    const attendanceWhere: any = {
      student: { classId: Number(id) },
    };

    if (date) {
      const targetDate = new Date(date as string);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      attendanceWhere.date = { gte: targetDate, lt: nextDay };
    } else if (startDate || endDate) {
      attendanceWhere.date = {};
      if (startDate) attendanceWhere.date.gte = new Date(startDate as string);
      if (endDate) attendanceWhere.date.lte = new Date(endDate as string);
    }

    const attendance = await prisma.attendance.findMany({
      where: attendanceWhere,
      include: {
        student: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const total = attendance.length;
    const present = attendance.filter((a) => a.status === "PRESENT").length;
    const absent = attendance.filter((a) => a.status === "ABSENT").length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : "0";

    const studentSummary: any = {};
    attendance.forEach((a) => {
      if (!studentSummary[a.studentId]) {
        studentSummary[a.studentId] = {
          student: a.student,
          present: 0,
          absent: 0,
          total: 0,
        };
      }
      studentSummary[a.studentId][a.status.toLowerCase()]++;
      studentSummary[a.studentId].total++;
    });

    const studentReport = Object.values(studentSummary).map((s: any) => ({
      ...s,
      percentage: ((s.present / s.total) * 100).toFixed(2),
    }));

    shorRes(res, 200, "imaanshaha fasalkan si guul leh ayaa loo helay", {
      data: attendance,
      summary: {
        total,
        present,
        absent,
        percentage,
      },
      studentReport,
    });
  } catch (error) {
    cathError(error, res);
  }
};

export const getClassResultsSummary = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { examId } = req.query;

    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "id sax maaha");
      return;
    }

    const classExists = await prisma.class.findUnique({
      where: { id: Number(id) },
    });

    if (!classExists) {
      shorRes(res, 404, "fasalka lama helin");
      return;
    }

    const students = await prisma.student.findMany({
      where: { classId: Number(id) },
      include: {
        user: { select: { fullName: true } },
        results: {
          where: examId ? { examId: Number(examId) } : {},
          include: { exam: true },
        },
      },
    });

    const summary = students.map((s) => {
      const totalMarks = s.results.reduce((sum, r) => sum + r.marks, 0);
      const average = s.results.length > 0 ? totalMarks / s.results.length : 0;
      return {
        studentId: s.id,
        name: s.user.fullName,
        totalExams: s.results.length,
        totalMarks,
        average: average.toFixed(2),
      };
    });

    summary.sort((a, b) => Number(b.average) - Number(a.average));
    const ranked = summary.map((s, index) => ({ ...s, rank: index + 1 }));

    const classAverage =
      ranked.length > 0
        ? ranked.reduce((sum, s) => sum + Number(s.average), 0) / ranked.length
        : 0;

    await prisma.class.update({
      where: { id: Number(id) },
      data: { averageScore: classAverage },
    });

    shorRes(res, 200, "natiijooyinka fasalka si guul leh ayaa loo helay", {
      data: ranked,
      classAverage: classAverage.toFixed(2),
    });
  } catch (error) {
    cathError(error, res);
  }
};
