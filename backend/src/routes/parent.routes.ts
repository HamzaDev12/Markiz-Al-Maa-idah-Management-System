import { Router } from "express";
import { authenticationMiddleware } from "../middlewares/auth.middleware.js";
import { authorized } from "../middlewares/authorized.middleware.js";
import { Role } from "../generated/prisma/enums.js";
import {
  createParent,
  deleteParent,
  getAllParenst,
  getParentById,
  updateParent,
} from "../controllers/parent.controller.js";
const route = Router();

route.post(
  "/create",
  authenticationMiddleware,
  authorized([Role.ADMIN]),
  createParent,
);

route.patch(
  "/update/:id",
  authenticationMiddleware,
  authorized([Role.ADMIN]),
  updateParent,
);

route.delete(
  "/delete/:id",
  authenticationMiddleware,
  authorized([Role.ADMIN]),
  deleteParent,
);

route.get(
  "/getAll",
  authenticationMiddleware,
  authorized([Role.ADMIN]),
  getAllParenst,
);

route.get(
  "/getParentById/:id",
  authenticationMiddleware,
  authorized([Role.PARENT]),
  getParentById,
);

export default route;
