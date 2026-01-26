import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../utils/auth.utlis.js";
import { auth } from "../constants/messages.js";
import jwt from "jsonwebtoken";
import "dotenv/config";

export const authenticationMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const headers = req?.headers?.authorization;
    if (!headers) {
      res.status(401).json({
        message: auth,
      });
      return;
    }

    const token = headers.split(" ")[1];
    if (!token) {
      res.status(401).json({
        message: auth,
      });
      return;
    }

    const decode: any = jwt.verify(token, process.env.JWT_SECRET_KEY!);
    if (!decode) {
      res.status(401).json({
        message: auth,
      });
      return;
    }

    req.userId = decode.userId;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
