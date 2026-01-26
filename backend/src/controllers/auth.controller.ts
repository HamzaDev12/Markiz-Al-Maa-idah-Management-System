import type { Response, Request } from "express";
import jwt from "jsonwebtoken";
import {
  cathError,
  fill,
  serverError,
  shorRes,
} from "../constants/messages.js";
import argon2 from "argon2";
import { prisma } from "../libs/prisma.js";
import type { ICreateUser, ILoginUser } from "../types/auth.types.js";
import type { Role } from "../generated/prisma/enums.js";
import { generateToken } from "../services/jwt.service.js";
import type { AuthRequest } from "../utils/auth.utlis.js";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const data: ICreateUser = req.body;
    if (
      !data.confirm ||
      !data.name ||
      !data.password ||
      !data.phone ||
      !data.role ||
      !data.email
    ) {
      res.status(400).json({
        message: fill,
      });
      return;
    }

    const email = await prisma.user.findFirst({
      where: {
        email: data.email,
      },
    });

    if (!email) {
      res.status(400).json({
        message: "email already exist",
      });
      return;
    }

    const phone = await prisma.user.findFirst({
      where: {
        phone: data.phone,
      },
    });

    if (!phone) {
      res.status(400).json({
        message: "email already exist",
      });
      return;
    }

    if (data.confirm !== data.password) {
      res.status(400).json({
        message: "The password must match confirm password",
      });
      return;
    }

    const hashPassword = await argon2.hash(data.password);

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.name,
        password: hashPassword,
        role: data.role as Role,
        phone: data.phone,
      },
    });

    if (!newUser) {
      throw new Error("Error while creating new user");
    }
    generateToken(newUser.id, res);
    res.status(201).json({
      message: "Successfully Created",
      user: newUser,
    });
  } catch (error) {
    cathError(error, res);
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as ILoginUser;
    if (!email || !password) {
      res.status(400).json({
        message: fill,
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      res.status(400).json({
        message: "email or password incorrect",
      });
      return;
    }

    const { password: _, ...rest } = user;
    const confirm_password = await argon2.verify(user.password, password);
    if (!confirm_password) {
      res.status(400).json({
        message: "email or password incorrect",
      });
      return;
    }

    if (!user.isActive) {
      res.status(400).json({
        message:
          "Your account is disabled. Contact the administrator to reactivate it.",
      });
      return;
    }

    const token = generateToken(user.id, res);

    res.status(200).json({
      message: "Successfully Login",
      user: rest,
      token,
    });
  } catch (error) {
    cathError(error, res);
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(400).json({
        message: "user ID is not provided",
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: req.userId,
      },
    });

    if (!user) {
      res.status(400).json({
        message: "user not found",
      });
      return;
    }

    await prisma.user.update({
      where: {
        id: req.userId,
      },
      data: {
        isLogged: false,
      },
    });

    const token = req.headers.authorization;

    if (!token) {
      res.status(400).json({
        message: "Already logged out",
      });
      return;
    }

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    shorRes(res, 200, "Logged our successfully");
  } catch (error) {
    cathError(error, res);
  }
};

export const whoami = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.userId!,
      },
    });

    if (!user) {
      shorRes(res, 404, "user not found");
      return;
    }

    shorRes(res, 200, "found user", user);
  } catch (error) {
    cathError(error, res);
  }
};

export const userDeleteTemporery = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.findFirst({
      where: {
        id,
      },
    });

    if (!user) {
      shorRes(res, 404, "user not found");
      return;
    }

    if (user.isActive) {
      shorRes(res, 400, "user already deleted");
      return;
    }

    await prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });

    shorRes(res, 200, "user successfully deleted");
  } catch (error) {
    cathError(error, res);
  }
};
