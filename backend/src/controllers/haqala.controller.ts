import type { Response } from "express";
import type { AuthRequest } from "../utils/auth.utlis.js";
import type { ICreateHalaqa, IUpdateHalaqa } from "../types/halaqa.types.js";
import { cathError, shorRes } from "../constants/messages.js";
import { prisma } from "../libs/prisma.js";

export const createHalaqa = async (req: AuthRequest, res: Response) => {
  try {
    const { teacherId, name, classId } = req.body as ICreateHalaqa;
    if (!teacherId || !classId || !name) {
      shorRes(res, 400, "fadlan gali xogta xalaqada");
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
    const classE = await prisma.class.findUnique({
      where: {
        id: teacherId,
      },
    });

    if (!classE) {
      shorRes(res, 404, "fasalkan mid jira maaha");
      return;
    }

    const halaqas = await prisma.halaqa.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        classId,
      },
    });

    if (halaqas) {
      shorRes(res, 400, "magaca xalqadani hore ayuu u jiray");
      return;
    }

    const halaqa = await prisma.halaqa.create({
      data: {
        teacherId,
        classId,
        name,
      },
    });

    shorRes(res, 201, "si guul leh ayaa loo sameeyay xalqada", halaqa);
  } catch (error) {
    cathError(error, res);
  }
};
export const updateHalaqa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, teacherId, classId } = req.body;

    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga xalqada sax");
      return;
    }

    const halaqa = await prisma.halaqa.findUnique({
      where: { id: Number(id) },
    });

    if (!halaqa) {
      shorRes(res, 404, "halaqada lama helin");
      return;
    }

    if (name && name !== halaqa.name) {
      const targetClassId = classId || halaqa.classId;
      const nameExists = await prisma.halaqa.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          classId: targetClassId,
          id: { not: Number(id) },
        },
      });
      if (nameExists) {
        shorRes(
          res,
          400,
          "magacan halaqada hore ayaa loo isticmaalay fasalkan",
        );
        return;
      }
    }

    if (teacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
      });
      if (!teacher) {
        shorRes(res, 404, "macalinka lama helin");
        return;
      }
    }

    if (classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: classId },
      });
      if (!classExists) {
        shorRes(res, 404, "fasalka lama helin");
        return;
      }
    }

    if (classId && classId !== halaqa.classId) {
      await prisma.student.updateMany({
        where: { halaqaId: Number(id) },
        data: { halaqaId: null },
      });

      await prisma.halaqa.update({
        where: { id: Number(id) },
        data: { leaderId: null },
      });
    }

    const updated = await prisma.halaqa.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(teacherId && { teacherId }),
        ...(classId && { classId }),
      },
      include: {
        teacher: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        class: true,
        leader: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });

    shorRes(res, 200, "xalqada si guul leh ayaa loo cusbooneysiiyay", updated);
  } catch (error) {
    cathError(error, res);
  }
};

export const deleteHalaqa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga xalqada sax");
      return;
    }

    const halaqa = await prisma.halaqa.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        students: true,
      },
    });

    if (!halaqa) {
      shorRes(res, 404, "xalqadan mid jirta maaha");
      return;
    }

    const deleted = await prisma.$transaction(async (tx) => {
      await tx.student.updateMany({
        where: {
          halaqaId: Number(id),
        },
        data: {
          halaqaId: null,
        },
      });

      await tx.subcis.deleteMany({
        where: {
          halaqaId: Number(id),
        },
      });

      await tx.halaqa.delete({
        where: {
          id: Number(id),
        },
      });
    });

    shorRes(res, 200, "xalqadan si guul leh ayaa loo saray");
  } catch (error) {
    cathError(error, res);
  }
};

export const getAllHalaqa = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search, classId, teacherId } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.name = { contains: search as string, mode: "insensitive" };
    }

    if (search) {
      where.classId = Number(classId);
    }

    if (search) {
      where.teacherId = Number(teacherId);
    }
    const [halaqa, total] = await Promise.all([
      prisma.halaqa.findMany({
        where,
        skip,
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  image: true,
                  fullName: true,
                },
              },
            },
          },
          class: true,
          leader: {
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
              subac: true,
            },
          },
        },
        orderBy: { id: "desc" },
      }),
      prisma.halaqa.count({ where }),
    ]);

    shorRes(res, 200, "xalaqooyinka si guul leh ayaa loo helay", {
      data: halaqa,
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

export const setHalaqaLeader = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga xalqada sax");
      return;
    }

    const halaqa = await prisma.halaqa.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!halaqa) {
      shorRes(res, 404, "xalqadan lama helin");
      return;
    }

    const student = await prisma.student.findUnique({
      where: {
        id: studentId,
      },
    });

    if (!student) {
      shorRes(res, 404, "ardaygan mid jira maaha");
      return;
    }

    if (student.halaqaId !== Number(id)) {
      shorRes(res, 400, "ardaygan kama tirsana xalqada");
      return;
    }

    const setLeader = await prisma.halaqa.update({
      where: {
        id: Number(id),
      },
      data: {
        leaderId: studentId,
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
      },
    });

    shorRes(
      res,
      200,
      "xalqada si guul leh ayaa lagu sameeyay alifle",
      setLeader,
    );
  } catch (error) {
    cathError(error, res);
  }
};

export const removeHalaqaLeader = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga sax");
      return;
    }

    const halaqa = await prisma.halaqa.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!halaqa) {
      shorRes(res, 404, "xalqadan mid jirta maaha");
      return;
    }

    if (!halaqa.leaderId) {
      shorRes(res, 400, "xalqadan hore alifle umay lahayn");
      return;
    }

    const updated = await prisma.halaqa.update({
      where: {
        id: Number(id),
      },
      data: {
        leaderId: null,
      },
    });

    shorRes(res, 200, "xalqada alifla heeda si guul leh ayaa looga qaaday");
  } catch (error) {
    cathError(error, res);
  }
};

export const getAllStudentsHalaqa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, active, search, gender } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan sax id-ga xalqada");
      return;
    }

    const halaqa = await prisma.halaqa.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!halaqa) {
      shorRes(res, 404, "xalqadani mid jirta maaha");
      return;
    }

    const where: any = { halaqaId: Number(id) };

    if (search) {
      where.user = {
        OR: [
          { fullName: { contain: search as string, mode: "insensitive" } },
          { email: { contain: search as string, mode: "insensitive" } },
        ],
      };
    }

    if (gender) {
      where.gender = gender;
    }

    if (active !== undefined) {
      where.active = active === "true";
    }

    const [student, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              image: true,
            },
          },
          leaderOf: true,
        },
        orderBy: { id: "desc" },
      }),
      prisma.student.count({ where }),
    ]);

    const studentsWithLeader = student.map((s) => ({
      ...s,
      isLeader: s.leaderOf?.id === Number(id),
    }));

    shorRes(res, 200, "ardayda xalaqada si guul leh ayaa loo helay", {
      data: studentsWithLeader,
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

export const changeTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { teacherId } = req.body;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan sax id-ga xalqada");
      return;
    }

    const halaqa = await prisma.halaqa.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!halaqa) {
      shorRes(res, 404, "xalqadan lama helin");
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

    const updated = await prisma.halaqa.update({
      where: {
        id: Number(id),
      },
      data: {
        teacherId,
      },
      include: {
        teacher: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    shorRes(
      res,
      200,
      "xaqlada si guul leh ayaa macalinka looga badalay",
      updated,
    );
  } catch (error) {
    cathError(error, res);
  }
};
