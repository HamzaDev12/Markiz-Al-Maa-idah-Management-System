import { Router } from "express";
import { authenticationMiddleware } from "../middlewares/auth.middleware.js";
import { authorized } from "../middlewares/authorized.middleware.js";
import { Role } from "../generated/prisma/enums.js";
import {
  createMemorizeStudent,
  deleteMemorization,
  getAllMemorization,
  getByStudentIdTargets,
  getClassMemorizationStats,
  updateMemorization,
} from "../controllers/memorize.controller.js";
const route = Router();

route.post(
  "/create",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER]),
  createMemorizeStudent,
);

route.delete(
  "/delete/:id",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER]),
  deleteMemorization,
);

route.patch(
  "/update/:id",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER]),
  updateMemorization,
);

route.get(
  "/getAll",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER]),
  getAllMemorization,
);

route.get(
  "/getStudetMemorization/:studentId",
  authenticationMiddleware,
  getByStudentIdTargets,
);

route.get(
  "/getClassMemorization/:classId",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER]),
  getClassMemorizationStats,
);

export default route;
