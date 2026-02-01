import type { Response } from "express";
import type { AuthRequest } from "../utils/auth.utlis.js";
import { cathError, shorRes } from "../constants/messages.js";
import { prisma } from "../libs/prisma.js";
import { Role } from "../generated/prisma/enums.js";

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
