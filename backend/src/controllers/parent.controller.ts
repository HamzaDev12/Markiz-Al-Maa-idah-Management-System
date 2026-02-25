import type { Response } from "express";
import type { AuthRequest } from "../utils/auth.utlis.js";
import { cathError, shorRes } from "../constants/messages.js";
import type { ICreateParent } from "../types/parent.types.js";
import { prisma } from "../libs/prisma.js";

export const createParent = async (req: AuthRequest, res: Response) => {
  try {
    const { userId }: ICreateParent = req.body;
    if (!userId || isNaN(userId)) {
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
