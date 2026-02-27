import type { Response } from "express";
import type { AuthRequest } from "../utils/auth.utlis.js";
import { cathError, shorRes } from "../constants/messages.js";
import type { ICreateParent } from "../types/parent.types.js";
import { prisma } from "../libs/prisma.js";
import { upload } from "../utils/multer.utils.js";

export const createParent = async (req: AuthRequest, res: Response) => {
  try {
    const { userId }: ICreateParent = req.body;
    if (!userId || isNaN(Number(userId))) {
      shorRes(res, 400, "fadlan id-ga sax");
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      shorRes(res, 404, "user-kan mid jira maaha");
      return;
    }

    if (user.role !== "PARENT") {
      shorRes(res, 400, "user-kan maaha waalid, fadlan sax id-ga waalidka");
      return;
    }

    const parent = await prisma.parent.findUnique({
      where: {
        userId,
      },
    });

    if (parent) {
      shorRes(res, 400, "waalidkan hore ayaad ugu dartay qaybta waalidka");
      return;
    }

    const parents = await prisma.parent.create({
      data: {
        userId,
      },
    });

    shorRes(res, 201, "si guul leh ayaad walidka u diwan galisay", parents);
  } catch (error) {
    cathError(error, res);
  }
};

export const updateParent = [
  upload.single("image"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { fullName, phone } = req.body;
      const image = req.file ? req.file.filename : null;
      if (!id || isNaN(Number(id))) {
        shorRes(res, 400, "fadlan id-ga sax");
        return;
      }

      const parent = await prisma.parent.findUnique({
        where: {
          id: Number(id),
        },
      });

      if (!parent) {
        shorRes(res, 404, "waalidkan mid jira maaha");
        return;
      }

      const updated = await prisma.user.update({
        where: {
          id: parent.userId,
        },
        data: {
          fullName,
          phone,
          ...(image && { image }),
        },
      });

      shorRes(
        res,
        200,
        "waalidka magaciisa si guul leh ayaa loo badalay",
        updated,
      );
    } catch (error) {
      cathError(error, res);
    }
  },
];

export const deleteParent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga sax");
      return;
    }

    const parent = await prisma.parent.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        payments: {
          where: {
            status: { not: "PAID" },
          },
        },
        students: true,
      },
    });

    if (!parent) {
      shorRes(res, 404, "waalidkan mid jira maaha");
      return;
    }

    if (parent.students.length > 0) {
      shorRes(
        res,
        400,
        "waalidkan arday baa u dhigata madarsada, marka hore ardayda saar",
      );
      return;
    }

    if (parent.payments.length > 0) {
      shorRes(res, 400, "waalidkan wali lacagbaa ku hadhsan");
      return;
    }

    const deleted = await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({
        where: {
          parentId: Number(id),
        },
      });

      await tx.parent.delete({
        where: {
          id: Number(id),
        },
      });
    });

    shorRes(res, 200, "si guul leh ayaa waalidka loo saaray");
  } catch (error) {
    cathError(error, res);
  }
};

export const getAllParenst = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      active,

      studentId,
      search,
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

    if (active !== undefined) {
      where.user = {
        ...where.user,
        isActive: active === "true",
      };
    }

    if (studentId) {
      where.students = {
        some: {
          studentId: Number(studentId),
        },
      };
    }
    const [parent, total] = await Promise.all([
      prisma.parent.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              image: true,
              email: true,
              phone: true,
            },
          },
          payments: true,
          _count: {
            select: {
              students: true,
            },
          },
        },
        orderBy: { id: "desc" },
      }),
      prisma.parent.count({ where }),
    ]);

    shorRes(res, 200, "waalidiinta si guul leh ayaa loo heley", {
      data: parent,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pageNumber: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    cathError(error, res);
  }
};

export const getParentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      shorRes(res, 400, "fadlan id-ga sax");
      return;
    }

    const parent = await prisma.parent.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        _count: {
          select: {
            students: true,
            payments: {
              where: {
                status: { not: "PAID" },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            image: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!parent) {
      shorRes(res, 404, "waalidkan mid jira maaha");
      return;
    }

    shorRes(res, 200, "waalidkan si guul leh ayaa loo helay", parent);
  } catch (error) {
    cathError(error, res);
  }
};
