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
import type {
  ICreateUser,
  ILoginUser,
  IUpdateUserByAdmin,
  IUpdateUserBySelf,
} from "../types/auth.types.js";
import type { Role } from "../generated/prisma/enums.js";
import { generateToken } from "../services/jwt.service.js";
import type { AuthRequest } from "../utils/auth.utlis.js";
import { generateCode } from "../services/code.service.js";
import { sendEmail } from "../services/sendEmail.service.js";
import { sendWhatsApp } from "../services/whatsApp.service.js";

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

export const getUserRecyclePin = async (req: Request, res: Response) => {
  try {
    const isActive = await prisma.user.findMany({
      where: {
        isActive: true,
      },
    });

    if (!isActive) {
      shorRes(res, 404, "zNo deleted user");
      return;
    }

    shorRes(res, 200, "", isActive);
  } catch (error) {
    cathError(error, res);
  }
};

export const restorUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      shorRes(res, 404, "you must provide ID");
      return;
    }
    const user = await prisma.user.findFirst({
      where: {
        id,
      },
    });

    if (user?.isActive) {
      shorRes(res, 404, "user already is not deleted");
      return;
    }

    await prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive: true,
      },
    });

    shorRes(res, 200, "user seccessfully restored");
  } catch (error) {
    cathError(error, res);
  }
};

export const updateUserByAdmin = async (req: Request, res: Response) => {
  try {
    const data = req.body as IUpdateUserByAdmin;
    if (data.id === null) {
      shorRes(res, 400, "enter user id");
      return;
    }

    if (!data.name || !data.phone || !data.role) {
      shorRes(res, 400, "please fill all inputs");
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!user) {
      shorRes(res, 400, "user is not exist");
      return;
    }

    await prisma.user.update({
      where: {
        id: data.id,
      },
      data: {
        fullName: data.name,
        role: data.role as Role,
        phone: data.phone,
      },
    });
  } catch (error) {
    cathError(error, res);
  }
};

export const updateUserByself = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body as IUpdateUserBySelf;
    if (data.id === null) {
      shorRes(res, 400, "Please enter your id");
      return;
    }

    if (
      data.OldPassword === "" ||
      data.confirm === "" ||
      data.email === "" ||
      data.name === "" ||
      data.newPassword === "" ||
      data.phone === "" ||
      data.role === ""
    ) {
      shorRes(res, 400, "please fill all the inputs");
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: data.id,
      },
    });
    if (!user) {
      shorRes(res, 400, "user is not exist");
      return;
    }

    const isMatch = await argon2.verify(user.password, data.OldPassword);
    if (!isMatch) {
      shorRes(res, 400, "your old password is not correct");
      return;
    }

    if (data.newPassword !== data.confirm) {
      shorRes(res, 400, "the password must mutch a cofirm password");
      return;
    }

    const isHash = await argon2.hash(data.newPassword);

    const updated = await prisma.user.update({
      where: {
        id: data.id,
      },
      data: {
        fullName: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role as Role,
        password: isHash,
      },
    });

    shorRes(res, 200, "Successfully updated", updated);
  } catch (error) {
    cathError(error, res);
  }
};

export const updateSome = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body as IUpdateUserBySelf;
    const user = await prisma.user.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!user) {
      res.status(400).json({
        message: "user is not exist",
      });
      return;
    }
    if (!data.OldPassword || !data.confirm || !data.name || !data.newPassword) {
      shorRes(res, 400, "please fill all inputs");
      return;
    }

    const isMatch = await argon2.verify(user.password, data.OldPassword);
    if (!isMatch) {
      shorRes(res, 400, "your old password is not correct");
      return;
    }

    if (data.newPassword !== data.confirm) {
      shorRes(res, 400, "the password must mutch a cofirm password");
      return;
    }

    const hash = await argon2.hash(data.newPassword);

    await prisma.user.update({
      where: {
        id: data.id,
      },
      data: {
        fullName: data.name,
        password: hash,
        role: data.role as Role,
      },
    });

    shorRes(res, 200, "Successfully changed your password");
  } catch (error) {
    cathError(error, res);
  }
};

export const updateName = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName } = req.body;
    const userId = req.userId;

    if (!userId) {
      shorRes(res, 401, "user ID is not provided");
      return;
    }

    if (!fullName || fullName.trim().length < 3) {
      shorRes(res, 400, "Please enter a valid name");
      return;
    }

    if (typeof fullName !== "string") {
      shorRes(res, 400, "Invalid name format");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { fullName },
    });

    shorRes(res, 200, "Successfully changed your name");
  } catch (error) {
    cathError(error, res);
  }
};

export const deleteUserByAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      shorRes(res, 400, "user ID is not provided");
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: +id,
      },
    });

    if (!user) {
      shorRes(res, 404, "user is not found");
      return;
    }

    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    shorRes(res, 200, `user ${user.id} deleted permenantly`);
  } catch (error) {
    cathError(error, res);
  }
};

export const deleteUserBySelf = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.userId;

    if (!id) {
      shorRes(res, 400, "user ID is not provided");
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: id,
      },
    });

    if (!user) {
      shorRes(res, 404, "user is not found");
      return;
    }

    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    shorRes(res, 200, `user ${user.id} deleted permenantly`);
  } catch (error) {
    cathError(error, res);
  }
};

export const changeRole = async (req: Request, res: Response) => {
  try {
    const { role, id }: { role: Role; id: number } = req.body;

    if (id === null) {
      shorRes(res, 400, "user ID is not provided");
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        id,
      },
    });

    if (!user) {
      shorRes(res, 404, "user not found");
      return;
    }

    if (user.role == role) {
      shorRes(res, 400, `user role is already ${role}`);
      return;
    }

    await prisma.user.update({
      where: {
        id,
      },
      data: {
        role,
      },
    });

    shorRes(res, 200, `user successfully changes role to: ${role}`);
  } catch (error) {
    cathError(error, res);
  }
};

export const sendEmailCode = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      shorRes(res, 400, "user ID is not provided");
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: req.userId,
      },
    });

    if (!user) shorRes(res, 404, "user is not found");
    if (!user?.email) shorRes(res, 400, "user have not email");

    const code = generateCode();
    const expire = new Date(Date.now() + 2 * 60 * 1000);

    await prisma.oTP.create({
      data: {
        code,
        expiresAt: expire,
        userId: req.userId,
      },
    });

    await sendEmail(
      user?.email!,
      "Markiz Al-Maa'idah Verification code",
      `${code} is your verification code. For your security do not share this code`,
    );

    shorRes(res, 200, "Verification code sent successfully");
  } catch (error) {
    cathError(error, res);
  }
};

export const sendPhoneCode = async (req: AuthRequest, res: Response) => {
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

    const phone = user.phone;
    const expire = new Date(Date.now() + 2 * 60 * 1000);
    const code = generateCode();

    if (!phone) {
      shorRes(res, 400, "Please enter phone number");
      return;
    }

    await prisma.oTP.create({
      data: {
        code,
        expiresAt: expire,
        userId: user.id,
      },
    });

    await sendWhatsApp(
      phone,
      `${code} is your verification code. For your security do not share this code`,
    );

    shorRes(res, 200, "Verification code sent successfully");
  } catch (error) {
    cathError(error, res);
  }
};

export const verifyEmail = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.userId!,
      },
    });
    if (!user) {
      shorRes(res, 400, "user ID is not provided");
      return;
    }

    const { code } = req.body;

    if (!code) {
      shorRes(res, 400, "please enter your verification code");
      return;
    }

    if (user.isEmailVerify) {
      shorRes(res, 400, "user already verified");
      return;
    }

    const cofirmCode = await prisma.oTP.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!cofirmCode) {
      shorRes(res, 404, "No verification code registered");
      return;
    }

    if (cofirmCode.expiresAt.getTime() < Date.now()) {
      await prisma.oTP.delete({
        where: {
          id: cofirmCode.id,
        },
      });
      shorRes(res, 400, "Verification code expired");
      return;
    }

    if (cofirmCode.code !== code) {
      shorRes(res, 400, "Verification code incorrect");
      return;
    }

    const verified = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isEmailVerify: true,
      },
    });

    await prisma.oTP.update({
      where: {
        id: cofirmCode.id,
      },
      data: {
        isVerified: true,
      },
    });

    shorRes(res, 200, "Verification successful");
  } catch (error) {
    cathError(error, res);
  }
};

export const verfyPhone = async (req: AuthRequest, res: Response) => {
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

    const { code } = req.body;

    if (!code) {
      shorRes(res, 400, "please enter your verification code");
      return;
    }

    if (user.isPhoneVerify) {
      shorRes(res, 400, "user already verified");
      return;
    }

    const confirmCode = await prisma.oTP.findFirst({
      where: {
        userId: req.userId!,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!confirmCode) {
      shorRes(res, 404, "No verification code registered");
      return;
    }

    if (confirmCode.expiresAt.getTime() < Date.now()) {
      await prisma.oTP.delete({
        where: {
          id: confirmCode.id,
        },
      });

      shorRes(res, 400, "Verification code expired");
      return;
    }

    if (confirmCode.code !== code) {
      shorRes(res, 400, "Verification code incorrect");
      return;
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isPhoneVerify: true,
      },
    });

    await prisma.oTP.update({
      where: {
        id: confirmCode.id,
      },
      data: {
        isVerified: true,
      },
    });

    shorRes(res, 200, "Verification code successfully");
  } catch (error) {
    cathError(error, res);
  }
};
