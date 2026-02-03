import { Router } from "express";
import { authenticationMiddleware } from "../middlewares/auth.middleware.js";
import { authorized } from "../middlewares/authorized.middleware.js";
import { Role } from "../generated/prisma/enums.js";
import {
  activeStudent,
  assignToClass,
  assignToHalaqa,
  createStudent,
  deActiveStudent,
  deleteStudent,
  getAllStudents,
  getStudentAttendance,
  getStudentById,
  getStudentParents,
  getStudentPayment,
  linkToParent,
  removeLeaderHalaqa,
  resulStudent,
  setHalaqaLeader,
  studentProgressSubcis,
  unLinkToParent,
  updateStudent,
} from "../controllers/student.controller.js";
const route = Router();

const at = authorized([Role.ADMIN, Role.TEACHER]);
const atp = authorized([Role.ADMIN, Role.PARENT, Role.TEACHER]);
const a = authorized([Role.ADMIN]);

route.post("/create", authenticationMiddleware, a, createStudent);

route.patch("/update/:id", authenticationMiddleware, a, updateStudent);

route.patch("/active/:id", authenticationMiddleware, a, activeStudent);

route.patch("/deActive/:id", authenticationMiddleware, a, deActiveStudent);

route.delete("/delete/:id", authenticationMiddleware, a, deleteStudent);

route.get("/getAll", authenticationMiddleware, at, getAllStudents);

route.get("/getStudent/:id", authenticationMiddleware, getStudentById);

route.patch("/assignClass/:id", authenticationMiddleware, at, assignToClass);

route.patch("/assignHalaqa/:id", authenticationMiddleware, at, assignToHalaqa);

route.post("/linkParent/:id", authenticationMiddleware, at, linkToParent);

route.delete("/unLinkParent/:id", authenticationMiddleware, at, unLinkToParent);

route.get(
  "/getStudentParent/:id",
  authenticationMiddleware,
  at,
  getStudentParents,
);

route.get(
  "/getStudentPayment/:id",
  authenticationMiddleware,
  at,
  getStudentPayment,
);

route.patch("/leaderHalaqa/:id", authenticationMiddleware, at, setHalaqaLeader);

route.patch(
  "/removeLeaderHalaqa/:id",
  authenticationMiddleware,
  at,
  removeLeaderHalaqa,
);

route.get(
  "/subciProgress/:id",
  authenticationMiddleware,
  studentProgressSubcis,
);

route.get("/studentResult/:id", authenticationMiddleware, resulStudent);

route.get(
  "/studentAttandance/:id",
  authenticationMiddleware,
  getStudentAttendance,
);

export default route;
