import { Router } from "express";
import { authenticationMiddleware } from "../middlewares/auth.middleware.js";
import { authorized } from "../middlewares/authorized.middleware.js";
import { Role } from "../generated/prisma/enums.js";
import { createHalaqaSchemas } from "../schemas/halaqa.schemas.js";
import { validateMiddleware } from "../middlewares/validate.middleware.js";
import {
  changeTeacher,
  createHalaqa,
  deleteHalaqa,
  getAllHalaqa,
  getAllStudentsHalaqa,
  setHalaqaLeader,
  updateHalaqa,
} from "../controllers/haqala.controller.js";
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
  "/setLeader",
  authenticationMiddleware,
  authorized([Role.ADMIN, Role.TEACHER]),
  setHalaqaLeader,
);

route.get(
  "/getAllstudentHalaqa",
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
export default route;
