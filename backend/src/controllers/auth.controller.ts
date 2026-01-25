import type { Response, Request } from "express";
import jwt from "jsonwebtoken";
import { generateTokenFn } from "../services/jwt.service.js";
import { serverError } from "../constants/messages.js";
import argon2 from "argon2";
import { prisma } from "../libs/prisma.js";

export const registerUser = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: serverError,
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: serverError,
    });
  }
};
