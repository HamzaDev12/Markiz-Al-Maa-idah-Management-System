import jwt from "jsonwebtoken";
import "dotenv/config";
import type { Response } from "express";

export const generateToken = (userId: number, res: Response) => {
  const access_token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY!, {
    expiresIn: "15m",
  });

  const refresh_token = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_TOKEN as string,
    {
      expiresIn: "30d",
    },
  );

  return { access_token, refresh_token };
};
