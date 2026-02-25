import { Router } from "express";
import { loginSchema, signupSchemas } from "../schemas/auth.schemas.js";
import { validateMiddleware } from "../middlewares/validate.middleware.js";
import {
  changeImage,
  changeRole,
  deleteUserByAdmin,
  deleteUserBySelf,
  forgetPassword,
  getAllusers,
  getSingleUser,
  getUserRecyclePin,
  loginUser,
  refreshToken,
  registerUser,
  resetPassword,
  restorUser,
  sendEmailCode,
  sendEmailMessages,
  sendPhoneCode,
  updateName,
  updateSome,
  updateUserByAdmin,
  updateUserByself,
  userDeleteTemporery,
  verfyPhone,
  verifyEmail,
  verifyResetCode,
  whoami,
} from "../controllers/auth.controller.js";
import { authenticationMiddleware } from "../middlewares/auth.middleware.js";
import { authorized } from "../middlewares/authorized.middleware.js";
import { Role } from "../generated/prisma/enums.js";
import multer from "multer";
const route = Router();

route.post("/create", registerUser);
route.post("/login", loginSchema, validateMiddleware, loginUser);

route.get("/whoami", authenticationMiddleware, whoami);

route.put(
  "/deleteTemp/:id",
  authenticationMiddleware,
  authorized([Role.ADMIN]),
  userDeleteTemporery,
);

route.get(
  "/recyclebin",
  authenticationMiddleware,
  authorized([Role.ADMIN]),
  getUserRecyclePin,
);

route.patch(
  "/restor/:id",
  authenticationMiddleware,
  authorized([Role.ADMIN]),
  restorUser,
);

route.patch(
  "/adminUpdate",
  authenticationMiddleware,
  authorized([Role.ADMIN]),
  updateUserByAdmin,
);

route.patch("/selfUpdate", authenticationMiddleware, updateUserByself);

route.patch("/changePass", authenticationMiddleware, updateSome);

route.patch("/changeName", authenticationMiddleware, updateName);

route.delete(
  "/delete",
  authenticationMiddleware,
  authorized([Role.ADMIN]),
  deleteUserByAdmin,
);

route.delete("/deleteSelf", authenticationMiddleware, deleteUserBySelf);

route.patch(
  "/changeRole",
  authenticationMiddleware,
  authorized([Role.ADMIN]),
  changeRole,
);

route.post("/sendEmailCode", authenticationMiddleware, sendEmailCode);

route.post("/sendPhoneCode", authenticationMiddleware, sendPhoneCode);

route.post("/verifyEmail", authenticationMiddleware, verifyEmail);

route.post("/verifyPhone", authenticationMiddleware, verfyPhone);

route.post("/verifyReset", verifyResetCode);

route.patch("/resetPassword", resetPassword);

route.get("/refresh", refreshToken);

route.post("/sendEmailMessage", sendEmailMessages);

route.post("/forgetPassword", forgetPassword);

route.get(
  "/getAll",
  authenticationMiddleware,
  authorized([Role.ADMIN]),
  getAllusers,
);

route.get("/getSignle", authenticationMiddleware, getSingleUser);

route.patch("/changeImage", authenticationMiddleware, changeImage);

export default route;
