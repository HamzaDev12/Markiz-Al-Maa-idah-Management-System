import { Router } from "express";
import { authenticationMiddleware } from "../middlewares/auth.middleware.js";
import { authorized } from "../middlewares/authorized.middleware.js";
import { Role } from "../generated/prisma/enums.js";
import {
  changeTeacherClass,
  createClass,
  deleteClass,
  getAllClasses,
  getClassAttendanceReport,
  getClassById,
  getClassExams,
  getClassHalaqas,
  getClassResultsSummary,
  getClassSchedule,
  getClassStudent,
  updateClass,
} from "../controllers/class.controller.js";
const route = Router();

const at = authorized([Role.ADMIN, Role.TEACHER]);
const a = authorized([Role.ADMIN]);

route.post("/create", authenticationMiddleware, a, createClass);

route.get("/getAll", authenticationMiddleware, at, getAllClasses);

route.get("/getClass/:id", authenticationMiddleware, at, getClassById);

route.patch(
  "/changeTeacher/:id",
  authenticationMiddleware,
  a,
  changeTeacherClass,
);

route.patch("/update/:id", authenticationMiddleware, a, updateClass);

route.delete("/delete/:id", authenticationMiddleware, a, deleteClass);

route.get(
  "/getClassStudents/:id",
  authenticationMiddleware,
  at,
  getClassStudent,
);

route.get("/getClassHalaqa/:id", authenticationMiddleware, at, getClassHalaqas);

route.get(
  "/getClassSchedule/:id",
  authenticationMiddleware,
  at,
  getClassSchedule,
);

route.get("/getClassExam/:id", authenticationMiddleware, at, getClassExams);

route.get(
  "/getClassAttendance/:id",
  authenticationMiddleware,
  at,
  getClassAttendanceReport,
);

route.get(
  "/getClassResults/:id",
  authenticationMiddleware,
  at,
  getClassResultsSummary,
);

export default route;
