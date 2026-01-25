import jwt from "jsonwebtoken";
import "dotenv/config";

export const generateTokenFn = (userId: number) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET_KEY as string, {
    expiresIn: "10m",
  });
};
