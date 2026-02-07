import type { Response } from "express";
import type { AuthRequest } from "../utils/auth.utlis.js";
import type { ICreateHalaqa } from "../types/halaqa.types.js";
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
