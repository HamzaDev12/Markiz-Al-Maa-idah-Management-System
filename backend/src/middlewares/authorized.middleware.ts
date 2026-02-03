import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../utils/auth.utlis.js";
import { auth, cathError, serverError } from "../constants/messages.js";
import { prisma } from "../libs/prisma.js";

export const authorized = (role: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: req.userId!,
        },
      });

      if (!user) {
        res.status(401).json({
          message: auth,
        });
        return;
      }

      if (!role.includes(user.role)) {
        res.status(403).json({
          message: "Forbidden: looma ogala doorkaga inuu arko qaybtan",
        });
        return;
      }

      next();
    } catch (error) {
      cathError(error, res);
    }
  };
};
