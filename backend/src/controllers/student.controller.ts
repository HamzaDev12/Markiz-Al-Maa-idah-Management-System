import type { Response } from "express";
import type { AuthRequest } from "../utils/auth.utlis.js";
import { cathError, shorRes } from "../constants/messages.js";
import { prisma } from "../libs/prisma.js";
import { Role } from "../generated/prisma/enums.js";
import type { IUpdateStudent } from "../types/student.types.js";

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { gender, userId, halaqaId, parentId, classId } = req.body;
    if (!gender || userId === undefined) {
      shorRes(res, 400, "fadlan gali xogtada");
      return;
    }

    if (!["MALE", "FEMALE"].includes(gender)) {
      shorRes(res, 400, "jinsiyadu sax maahan");
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

    if (user.role !== Role.STUDENT) {
      shorRes(res, 400, "user-kan mahan arday");
      return;
    }

    const existingStudent = await prisma.student.findUnique({
      where: { userId },
    });

    if (existingStudent) {
      shorRes(res, 400, "ardaygan hore ayuu u jiray");
      return;
    }

    if (classId) {
      const existingclass = await prisma.class.findUnique({
        where: { id: classId },
      });

      if (!existingclass) {
        shorRes(res, 404, "fasalkan lama helin");
        return;
      }
    }

    if (parentId && parentId.length > 0) {
      const parents = await prisma.parent.findMany({
        where: { id: { in: parentId } },
      });
      if (parents.length !== parentId.length) {
        shorRes(res, 404, "qaar ka mid ah waalidiinta lama helin");
        return;
      }
    }

    if (halaqaId) {
      const halqah = await prisma.halaqa.findUnique({
        where: { id: halaqaId },
      });

      if (!halqah) {
        shorRes(res, 404, "xalqadan lama helin");
        return;
      }

      if (classId && halqah.classId !== classId) {
        shorRes(res, 400, "xalqadani kama tirsana fasalkan");
        return;
      }
    }

    const student = await prisma.$transaction(async (tx) => {
      const newStudent = await tx.student.create({
        data: {
          userId,
          gender,
          ...(classId && { classId }),
          ...(halaqaId && { halaqaId }),
        },
      });

      if (parentId && parentId.length > 0) {
        await tx.studentParent.createMany({
          data: parentId.map((parentId: number) => ({
            parentId,
            studentId: newStudent.id,
          })),
        });
      }

      return await tx.student.findUnique({
        where: { id: newStudent.id },
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
          class: true,
          halaqa: true,
          parents: {
            include: {
              parent: {
                include: {
                  user: { select: { fullName: true } },
                },
              },
            },
          },
        },
      });
    });

    shorRes(res, 201, "ardayga si guul leh ayaa loo abuuray", student);
  } catch (error) {
    cathError(error, res);
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const { fullName, email, gender, phone, image } =
      req.body as IUpdateStudent;

    if (!studentId || isNaN(Number(studentId))) {
      shorRes(res, 400, "id sax maaha");
      return;
    }

    if (!["MALE", "FEMALE"].includes(gender)) {
      shorRes(res, 400, "jinsiyadaadu sax mahan");
      return;
    }

    const student = await prisma.student.findUnique({
      where: {
        id: Number(studentId),
      },
      include: { user: true },
    });

    if (!student) {
      shorRes(res, 404, "ardaygan majiro");
      return;
    }

    if (email && email !== student.user.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        shorRes(res, 400, "email-kan hore ayuu u jiray");
        return;
      }
    }

    if (phone && phone !== student.user.phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: phone,
        },
      });
      if (existingPhone) {
        shorRes(res, 400, "phone-kan hore ayuu u jiray");
        return;
      }
    }

    const update = await prisma.$transaction(async (tx) => {
      if (email || fullName || image || phone) {
        await prisma.user.update({
          where: { id: student.userId },
          data: {
            ...(fullName && { fullName }),
            ...(image && { image }),
            ...(email && { email }),
            ...(phone && { phone }),
          },
        });
      }

      const updateStudent = await prisma.student.update({
        where: { id: Number(studentId) },
        data: {
          ...(gender && { gender }),
        },
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
          class: true,
          halaqa: true,
        },
      });
      return updateStudent;
    });

    shorRes(res, 200, "ardayga si guul leh ayaa loo badalay", update);
  } catch (error) {
    cathError(error, res);
  }
};

export const activeStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const active: boolean = req.body;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga ardayga sax");
      return;
    }

    const student = await prisma.student.findUnique({
      where: { id: Number(id) },
    });

    if (!student) {
      shorRes(res, 404, "ardaygan majiro");
      return;
    }

    if (student.active === false) {
      shorRes(res, 400, "ardaygan hore ayuu ahaa mid shaqada laga joojiyay");
      return;
    }

    await prisma.student.update({
      where: { id: Number(id) },
      data: {
        active: false,
      },
    });
    shorRes(res, 200, "si guul leh ayaa ardayga shaqada looga joojiyay");
  } catch (error) {
    cathError(error, res);
  }
};

export const deActiveStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const active: boolean = req.body;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga ardayga sax");
      return;
    }

    const student = await prisma.student.findUnique({
      where: { id: Number(id) },
    });

    if (!student) {
      shorRes(res, 404, "ardaygan majiro");
      return;
    }

    if (student.active === true) {
      shorRes(res, 400, "ardaygan hore ayuu ahaa mid shaqada ku jira");
      return;
    }

    await prisma.student.update({
      where: { id: Number(id) },
      data: {
        active: true,
      },
    });

    shorRes(res, 200, "si guul leh ayaa ardayga shaqada loogu bilaabay");
  } catch (error) {
    cathError(error, res);
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga ardayga sax");
      return;
    }

    const student = await prisma.student.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        leaderOf: true,
        payments: { where: { payment: { status: { not: "PAID" } } } },
      },
    });

    if (!student) {
      shorRes(res, 404, "ardaygan mid jira maaha");
      return;
    }

    if (student.payments.length > 0) {
      shorRes(res, 400, "ardaygan wali lacagbaa lagu leeyahay");
      return;
    }

    const deleted = await prisma.$transaction(async (tx) => {
      if (student.leaderOf) {
        await tx.halaqa.update({
          where: { id: student.leaderOf.id },
          data: {
            leaderId: null,
          },
        });
      }
      await tx.studentParent.deleteMany({
        where: { studentId: Number(id) },
      });

      await tx.attendance.deleteMany({
        where: {
          studentId: student.id,
        },
      });

      await tx.result.deleteMany({
        where: {
          studentId: student.id,
        },
      });

      await tx.paymentStudent.deleteMany({
        where: {
          studentId: student.id,
        },
      });

      await tx.subcis.deleteMany({
        where: {
          studentId: student.id,
        },
      });

      await tx.user.delete({
        where: {
          id: student.userId,
        },
      });

      await tx.student.delete({
        where: { id: student.id },
      });
    });

    shorRes(res, 200, "ardayga si guul leh ayaa loo saray");
  } catch (error) {
    cathError(error, res);
  }
};

export const getAllStudents = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      classId,
      halaqaId,
      gender,
      active,
    } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (search) {
      where.user = {
        OR: [
          { fullName: { contains: search as string, mode: "insensitive" } },
          { email: { contains: search as string, mode: "insensitive" } },
          { phone: { contains: search as string } },
        ],
      };
    }

    if (classId) {
      where.classId = Number(classId);
    }

    if (halaqaId) {
      where.halaqaId = Number(halaqaId);
    }

    if (gender) {
      where.gender = gender;
    }

    if (active !== undefined) {
      where.active = active === "true";
    }

    const [student, total] = await Promise.all([
      await prisma.student.findMany({
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
          class: true,
          halaqa: true,
        },
        orderBy: { id: "desc" },
      }),
      prisma.student.count({ where }),
    ]);

    shorRes(res, 200, "ardayda si guul leh ayaa loo helay", {
      data: student,
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

export const getStudentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga ardayga sax");
      return;
    }

    const student = await prisma.student.findUnique({
      where: {
        id: Number(id),
      },
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
        class: {
          select: {
            teacher: {
              include: { user: { select: { fullName: true } } },
            },
          },
        },
        leaderOf: true,
        parents: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        halaqa: {
          select: {
            teacher: {
              include: { user: { select: { fullName: true } } },
            },
          },
        },
      },
    });

    if (!student) {
      shorRes(res, 404, "ardaygan mid jira maaha");
      return;
    }

    shorRes(res, 200, "ardayga si guul leh ayaa loo helay", student);
  } catch (error) {
    cathError(error, res);
  }
};
export const assignToClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { classId } = req.body;

    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga ardayga sax");
      return;
    }

    const student = await prisma.student.findUnique({
      where: { id: Number(id) },
      include: { halaqa: true, class: true },
    });

    if (!student) {
      shorRes(res, 404, "ardayga lama helin");
      return;
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
    if (student.classId && classId && student.classId === classId) {
      shorRes(
        res,
        400,
        `ardaygan hore ayuu fasalkan uga tirsanaa ${student.class?.name}`,
      );
      return;
    }

    let newHalaqaId = student.halaqaId;
    if (student.halaqa && classId && student.halaqa.classId !== classId) {
      newHalaqaId = null;
    }

    const updated = await prisma.student.update({
      where: { id: Number(id) },
      data: {
        classId: classId || null,
        halaqaId: newHalaqaId,
      },
      include: {
        user: { select: { fullName: true } },
        class: true,
        halaqa: true,
      },
    });

    shorRes(res, 200, "ardayga fasalka si guul leh ayaa loogu daray", updated);
  } catch (error) {
    cathError(error, res);
  }
};

export const assignToHalaqa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { halaqaId } = req.body;

    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga ardayga sax");
      return;
    }

    if (!halaqaId) {
      shorRes(res, 400, "fadlan xalqada id-geeda gali");
      return;
    }

    const student = await prisma.student.findUnique({
      where: {
        id: Number(id),
      },
      include: { halaqa: true },
    });

    if (!student) {
      shorRes(res, 404, "ardaygan majiro");
      return;
    }

    if (student.halaqaId && halaqaId && student.halaqaId === halaqaId) {
      shorRes(res, 400, "ardaygan hore ay");
      return;
    }

    if (halaqaId) {
      const existingHalaqa = await prisma.halaqa.findUnique({
        where: { id: halaqaId },
      });

      if (!existingHalaqa) {
        shorRes(res, 404, "xaldadan mid jirta maaha");
        return;
      }

      if (student.classId && student.classId !== existingHalaqa.classId) {
        shorRes(res, 400, "xalqadan kama tirsana fasalka ardaygan");
        return;
      }
      if (!student.classId) {
        await prisma.student.update({
          where: { id: Number(id) },
          data: {
            classId: existingHalaqa.classId,
          },
        });
      }
    }

    const updated = await prisma.student.update({
      where: { id: Number(id) },
      data: { halaqaId },
      include: {
        class: true,
        halaqa: true,
        user: { select: { fullName: true } },
      },
    });
    shorRes(res, 200, "ardayga si guul leh ayaa xalqada lagu daray", updated);
  } catch (error) {
    cathError(error, res);
  }
};

export const linkToParent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { parentId } = req.body;

    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga ardayga sax");
      return;
    }

    if (!parentId) {
      shorRes(res, 400, "fadlan gali walidka ardaygan");
      return;
    }

    const student = await prisma.student.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!student) {
      shorRes(res, 404, "ardaygan majiro");
      return;
    }

    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      shorRes(res, 404, "walidakn ma jiro");
      return;
    }

    const existinLink = await prisma.studentParent.findFirst({
      where: {
        studentId: Number(id),
        parentId,
      },
    });

    if (existinLink) {
      shorRes(res, 400, "ardaygan hore ayuu walidkiisa lagu xidhay");
      return;
    }

    const created = await prisma.studentParent.create({
      data: {
        studentId: Number(id),
        parentId,
      },
    });

    shorRes(
      res,
      201,
      "ardaygan si guul leh ayaa walidkii lagu xidhay",
      created,
    );
  } catch (error) {
    cathError(error, res);
  }
};

export const unLinkToParent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { parentId } = req.body;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga ardayga sax");
      return;
    }

    if (!parentId) {
      shorRes(res, 400, "fadlan gali walidka ardaygan");
      return;
    }

    const student = await prisma.student.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!student) {
      shorRes(res, 404, "ardaygan majiro");
      return;
    }

    const unLink = await prisma.studentParent.findFirst({
      where: {
        studentId: Number(id),
        parentId,
      },
    });

    if (!unLink) {
      shorRes(res, 400, "ardaygan hore ayaa looga saray qaybta walidkiisa");
      return;
    }

    const countParents = await prisma.studentParent.count({
      where: {
        studentId: Number(id),
      },
    });

    if (countParents <= 1) {
      shorRes(res, 400, "ardaygu waa inu lee yahay ugu yaraan hal walid");
      return;
    }

    const unLinkUpdate = await prisma.studentParent.deleteMany({
      where: {
        studentId: student.id,
        parentId,
      },
    });

    shorRes(
      res,
      200,
      "ardayga si guul leh ayaa loga saray qaybta walidkiisa",
      unLinkUpdate,
    );
  } catch (error) {
    cathError(error, res);
  }
};

export const getStudentParents = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga ardayga sax");
      return;
    }

    const student = await prisma.student.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!student) {
      shorRes(res, 404, "ardaygan majiro");
      return;
    }

    const parents = await prisma.studentParent.findMany({
      where: {
        studentId: Number(id),
      },
      include: {
        parent: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!parents) {
      shorRes(res, 404, "ardaygan wali laguma xidhin walidkiisa");
      return;
    }

    shorRes(
      res,
      200,
      "ardaygan walidiintiisa si guul leh ayaa loo helay",
      parents,
    );
  } catch (error) {
    cathError(error, res);
  }
};

export const getStudentPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga ardayga sax");
      return;
    }

    const student = await prisma.student.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!student) {
      shorRes(res, 404, "ardaygan majiro");
      return;
    }

    const where: any = { studentId: Number(id) };

    if (status) {
      where.payment = status;
    }

    const payment = await prisma.paymentStudent.findMany({
      where,
      include: {
        payment: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { payment: { date: "desc" } },
    });

    const totalAmount = payment.reduce((sum, a) => sum + a.amount, 0);
    const paidAmount = payment
      .filter((p) => p.payment.status === "PAID")
      .reduce((sum, a) => sum + a.amount, 0);

    shorRes(res, 200, "ardayda fee-gooda si guul leh ayaa loo helay", {
      payment,
      summary: {
        totalAmount,
        paidAmount,
        pendingAmount: totalAmount - paidAmount,
      },
    });
  } catch (error) {
    cathError(error, res);
  }
};

export const removeLeaderHalaqa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga ardayga sax");
      return;
    }

    const student = await prisma.student.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        leaderOf: true,
      },
    });

    if (!student) {
      shorRes(res, 404, "ardaygan majiro");
      return;
    }

    if (!student.leaderOf) {
      shorRes(res, 400, "ardaygan maaha aliflaha xalqada");
      return;
    }

    const updated = await prisma.halaqa.update({
      where: {
        id: student.leaderOf.id,
      },
      data: {
        leaderId: null,
      },
    });

    shorRes(res, 200, "aliflaha xalqada si guul leh ayaa loo saaray");
  } catch (error) {
    cathError(error, res);
  }
};

export const setHalaqaLeader = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { halaqaId } = req.body;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga ardayga sax");
      return;
    }

    if (!halaqaId) {
      shorRes(res, 400, "xalqada id-geeda waa lo bahan yahay");
      return;
    }

    const student = await prisma.student.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        halaqa: true,
      },
    });

    if (!student) {
      shorRes(res, 404, "ardaygan majiro");
      return;
    }

    const halaqa = await prisma.halaqa.findUnique({
      where: {
        id: halaqaId,
      },
    });

    if (!halaqa) {
      shorRes(res, 404, "xalqadan mid jirta maaha");
      return;
    }

    if (student.classId !== student.halaqa?.classId) {
      shorRes(res, 400, "xalqadan maaha fasalka ardaygan");
      return;
    }

    if (student.halaqaId !== halaqaId) {
      shorRes(res, 400, "xalqadan ardaygan kama tirsana");
      return;
    }
    const updated = await prisma.halaqa.update({
      where: {
        id: halaqaId,
      },
      data: {
        leaderId: student.id,
      },
      include: {
        students: {
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
      "ardaygan si guul leh ayaa loga dhigay aliflaha xalqadan",
      updated,
    );
  } catch (error) {
    cathError(error, res);
  }
};

export const studentProgressSubcis = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, level } = req.query;

    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga ardayga sax");
      return;
    }

    const student = await prisma.student.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!student) {
      shorRes(res, 404, "ardaygan majiro");
      return;
    }

    const where: any = { studentId: Number(id) };

    if (level) {
      where.level = level;
    }

    if (startDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const subcisProgress = await prisma.subcis.findMany({
      where,
      include: {
        halaqa: true,
      },
      orderBy: { date: "desc" },
    });

    const uniquieJuz = [...new Set(subcisProgress.map((s) => s.juz))];
    const levelCount = {
      GOOD: subcisProgress.filter((s) => s.level === "GOOD").length,
      AVERAGE: subcisProgress.filter((s) => s.level === "AVERAGE").length,
      BAD: subcisProgress.filter((s) => s.level === "BAD").length,
    };

    shorRes(res, 200, "ardayga si guul leh ayaa loo helay heerkiisa subcis", {
      data: subcisProgress,
      summary: {
        totalRecord: subcisProgress.length,
        juzComplete: uniquieJuz.length,
        juzLis: uniquieJuz,
        level: levelCount,
      },
    });
  } catch (error) {
    cathError(error, res);
  }
};

export const resulStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { examId } = req.query;

    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga ardayga sax");
      return;
    }

    const student = await prisma.student.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!student) {
      shorRes(res, 404, "ardaygan majiro");
      return;
    }

    const where: any = { studentId: Number(id) };

    if (examId) {
      where.examId = Number(examId);
    }

    const results = await prisma.result.findMany({
      where,
      include: {
        exam: {
          include: { class: true },
        },
      },
      orderBy: { exam: { date: "desc" } },
    });

    const totalMarks = results.reduce((sum, r) => sum + r.marks, 0);
    const average =
      results.length > 0 ? Number((totalMarks / results.length).toFixed(2)) : 0;
    const highest =
      results.length > 0 ? Math.max(...results.map((r) => r.marks)) : 0;
    const lowest =
      results.length > 0 ? Math.min(...results.map((r) => r.marks)) : 0;

    let grade = "F";

    if (average >= 90 && average <= 100) {
      grade = "A";
    } else if (average >= 80) {
      grade = "B";
    } else if (average >= 70) {
      grade = "C";
    } else if (average >= 60) {
      grade = "D";
    }

    shorRes(res, 200, "natiijooyinka ardaygan si guul leh ayaa loo helay", {
      data: results,
      summary: {
        totalExams: results.length,
        totalMarks,
        average,
        highest,
        lowest,
        grade,
      },
    });
  } catch (error) {
    cathError(error, res);
  }
};

export const getStudentAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, month, status } = req.query;

    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga ardayga sax");
      return;
    }

    const student = await prisma.student.findUnique({
      where: { id: Number(id) },
    });

    if (!student) {
      shorRes(res, 404, "ardaygan majiro");
      return;
    }

    const where: any = { studentId: Number(id) };

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
    const present = attendance.filter((a) => a.status === "PRESENT").length;
    const absent = attendance.filter((a) => a.status === "ABSENT").length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : "0";

    shorRes(res, 200, "imaanshaha si guul leh ayaa loo helay", {
      data: attendance,
      summary: {
        total,
        present,
        absent,
        percentage,
      },
    });
  } catch (error) {
    cathError(error, res);
  }
};
