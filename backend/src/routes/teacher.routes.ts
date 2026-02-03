import { Router } from "express";
import { authenticationMiddleware } from "../middlewares/auth.middleware.js";
import { authorized } from "../middlewares/authorized.middleware.js";
import { Role } from "../generated/prisma/enums.js";
import {
  activeTeacher,
  createTeacher,
  deActiveTeacher,
  deleteTeacher,
  getAllTeachers,
  getScheduleTeacher,
  getStudentTeacher,
  getTeacherById,
  getTeacherClasses,
  getTeacherHalaqa,
  teacherAttendanceHistory,
  teacherHistorySalary,
  updateTeacher,
} from "../controllers/teacher.controller.js";
const route = Router();

const a = authorized([Role.ADMIN]);
const at = authorized([Role.ADMIN, Role.TEACHER]);

route.post(
  "/create",
  authenticationMiddleware,
  authorized([Role.ADMIN]),
  createTeacher,
);

route.patch(
  "/update",
  authenticationMiddleware,
  authorized([Role.ADMIN]),
  updateTeacher,
);

route.delete(
  "/delete",
  authenticationMiddleware,
  authorized([Role.ADMIN]),
  deleteTeacher,
);

route.get(
  "/getAll",
  authenticationMiddleware,
  authorized([Role.ADMIN]),
  getAllTeachers,
);

route.get(
  "/getTeacher/:id",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER]),
  getTeacherById,
);

route.get(
  "/getClass/:id",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER]),
  getTeacherClasses,
);

route.get("/getHalaqa/:id", authenticationMiddleware, at, getTeacherHalaqa);

route.get("/schedul/:id", authenticationMiddleware, at, getScheduleTeacher);

route.patch("/deActive/:id", authenticationMiddleware, a, deActiveTeacher);

route.patch("/active/:id", authenticationMiddleware, a, activeTeacher);

route.get(
  "/teacherStudent/:id",
  authenticationMiddleware,
  at,
  getStudentTeacher,
);

route.get(
  "/teacherSalary/:id",
  authenticationMiddleware,
  at,
  teacherHistorySalary,
);

route.get(
  "/teacherAttendance/:id",
  authenticationMiddleware,
  at,
  teacherAttendanceHistory,
);

export default route;
