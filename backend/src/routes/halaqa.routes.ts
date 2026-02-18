import { Router } from "express";
import { authenticationMiddleware } from "../middlewares/auth.middleware.js";
import { authorized } from "../middlewares/authorized.middleware.js";
import { Role } from "../generated/prisma/enums.js";
import { createHalaqaSchemas } from "../schemas/halaqa.schemas.js";
import { validateMiddleware } from "../middlewares/validate.middleware.js";
import {
  addHalaqaStudents,
  changeTeacher,
  createHalaqa,
  deleteHalaqa,
  getAllHalaqa,
  getAllStudentsHalaqa,
  getHalaqaSubcisProgress,
  removeHalaqaStudents,
  setHalaqaLeader,
  updateHalaqa,
} from "../controllers/haqala.controller.js";
import { removeLeaderHalaqa } from "../controllers/student.controller.js";
const route = Router();

route.post(
  "/create",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER]),
  createHalaqaSchemas,
  validateMiddleware,
  createHalaqa,
);

route.patch(
  "/update/:id",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER]),
  updateHalaqa,
);

route.delete(
  "/delete/:id",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER]),
  deleteHalaqa,
);

route.get(
  "/getAll",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER]),
  getAllHalaqa,
);

route.patch(
  "/setLeader/:id",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER]),
  setHalaqaLeader,
);

route.delete(
  "/deleteLeader/:id",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER]),
  removeLeaderHalaqa,
);

route.get(
  "/getAllstudentHalaqa/:id",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER]),
  getAllStudentsHalaqa,
);

route.patch(
  "/changeTeacher/:id",
  authenticationMiddleware,
  authorized([Role.ADMIN]),
  changeTeacher,
);

route.get(
  "/getHalaqaProgress/:id",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER, Role.STUDENT]),
  getHalaqaSubcisProgress,
);

route.patch(
  "/addHalaqaStudent/:id",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER]),
  addHalaqaStudents,
);

route.patch(
  "/removeHalaqaStudent/:id",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER]),
  removeHalaqaStudents,
);
export default route;
