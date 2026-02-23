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
  ISendMessage,
  IUpdateUserByAdmin,
  IUpdateUserBySelf,
} from "../types/auth.types.js";
import { Role } from "../generated/prisma/enums.js";
import { generateToken } from "../services/jwt.service.js";
import type { AuthRequest } from "../utils/auth.utlis.js";
import { generateCode } from "../services/code.service.js";
import { sendEmail, sendEmailMessage } from "../services/sendEmail.service.js";
import { sendWhatsApp } from "../services/whatsApp.service.js";
import multer from "multer";
import cloudinary from "../services/cloudinary.service.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

export const registerUser = [
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const data: ICreateUser = req.body;
      const image = req.file ? req.file.filename : null;
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

      if (email) {
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

      if (phone) {
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
          image,
        },
      });

      if (!newUser) {
        throw new Error("Error while creating new user");
      }
      // generateToken(newUser.id, res);
      res.status(201).json({
        message: "Successfully Created",
        user: newUser,
      });
    } catch (error) {
      cathError(error, res);
    }
  },
];

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

export const verifyResetCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      shorRes(res, 400, "please fill the inputs");
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      shorRes(res, 404, "user not found");
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

    if (cofirmCode !== code) {
      shorRes(res, 400, "Incorrect verification code");
      return;
    }

    await prisma.oTP.update({
      where: {
        id: cofirmCode.id,
      },
      data: {
        isVerified: true,
      },
    });

    shorRes(
      res,
      200,
      "Verification code is correct, proceed to reset password",
    );
  } catch (error) {
    cathError(error, res);
  }
};

export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const { newPassword, cofirmPassword } = req.body;

    if (!newPassword || !cofirmPassword) {
      shorRes(res, 400, "Please enter your new password");
      return;
    }

    if (newPassword !== cofirmPassword) {
      shorRes(res, 400, "the password must mutch a cofirm password");
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId!,
      },
    });

    if (!user) {
      shorRes(res, 404, "user not found");
      return;
    }

    const verification = await prisma.oTP.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!verification) {
      shorRes(res, 404, "verification code not found");
      return;
    }

    if (!verification.isVerified) {
      shorRes(res, 400, "Not verified");
      return;
    }

    const hashPassword = await argon2.hash(newPassword);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashPassword,
      },
    });

    shorRes(res, 200, "password changed successfully");
  } catch (error) {
    cathError(error, res);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      shorRes(res, 401, "Unauthorized - no refresh token provided");
      return;
    }

    const refreshToken = authHeader.split(" ")[1];

    const decod = jwt.verify(
      refreshToken as string,
      process.env.JWT_REFRESH_TOKEN!,
    ) as { userId: number };

    const accessToken = jwt.sign(
      { userId: decod.userId },
      process.env.JWT_SECRET_KEY!,
      { expiresIn: "15m" },
    );

    res.status(201).json({
      accessToken,
    });

    res.status(200).json({});
  } catch (error) {
    shorRes(res, 401, "Unauthorized - invalid or expired refresh token");
  }
};

export const sendEmailMessages = async (req: Request, res: Response) => {
  try {
    const { message, email, name, subject } = req.body as ISendMessage;

    if (!message || !email || !name || !subject) {
      shorRes(res, 400, "please fill inputs");
      return;
    }

    await sendEmailMessage(email, message, subject);

    shorRes(res, 200, "Email sended successfully");
  } catch (error) {
    cathError(error, res);
  }
};

export const forgetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      shorRes(res, 400, "email is required");
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      shorRes(res, 404, "user not found");
      return;
    }

    if (!user.email) {
      shorRes(res, 400, "user have not emial");
      return;
    }

    const code = generateCode();
    const expire = new Date(Date.now() + 2 * 60 * 1000);

    await prisma.oTP.create({
      data: {
        code,
        expiresAt: expire,
        userId: user.id,
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

export const getAllusers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = (req.query.status as string) || "all";
    const role = (req.query.role as string) || "all";

    let where: any = {};

    if (status === "active") where.isActive = true;
    if (status === "suspend") where.isActive = false;

    if (role === Role.ADMIN) where.role = Role.ADMIN;
    if (role === Role.PARENT) where.role = Role.PARENT;
    if (role === Role.STUDENT) where.role = Role.STUDENT;
    if (role === Role.TEACHER) where.role = Role.TEACHER;

    const [users, usersCount, activrCount, suspendCount] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        where,
        select: {
          id: true,
          image: true,
          fullName: true,
          email: true,
          isActive: true,
          phone: true,
          role: true,
        },
      }),
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, isActive: true } }),
      prisma.user.count({ where: { ...where, isActive: false } }),
    ]);

    res.status(200).json({
      users,
      number: usersCount || 0,
      activeCount: activrCount || 0,
      suspendCount: suspendCount || 0,
      pagination: {
        page,
        limit,
        totalPages: usersCount > 0 ? Math.ceil(usersCount / limit) : 0,
      },
    });
  } catch (error) {
    cathError(error, res);
  }
};

export const getSingleUser = async (req: Request, res: Response) => {
  try {
    const { id }: { id: number } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        image: true,
        fullName: true,
        email: true,
        isActive: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      shorRes(res, 404, "user not found");
      return;
    }

    shorRes(res, 200, "user found", user);
  } catch (error) {
    cathError(error, res);
  }
};

export const changeImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      shorRes(res, 401, "No user ID provided");
      return;
    }

    if (!req.file) {
      shorRes(res, 400, "No image provided");
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      shorRes(res, 404, "User not found");
      return;
    }

    const cloudinaryImage = await cloudinary.uploader.upload(req.file.path, {
      folder: "uploads",
    });

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        image: cloudinaryImage.secure_url,
      },
    });

    shorRes(res, 200, "Image updated successfully", updatedUser);
  } catch (error) {
    cathError(error, res);
  }
};
