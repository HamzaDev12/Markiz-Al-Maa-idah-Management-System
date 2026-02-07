import { Router } from "express";
import { authenticationMiddleware } from "../middlewares/auth.middleware.js";
import { authorized } from "../middlewares/authorized.middleware.js";
import { Role } from "../generated/prisma/enums.js";
import { createHalaqaSchemas } from "../schemas/halaqa.schemas.js";
import { validateMiddleware } from "../middlewares/validate.middleware.js";
import { createHalaqa } from "../controllers/haqala.controller.js";
const route = Router();

route.post(
  "/create",
  authenticationMiddleware,
  authorized([Role.ADMIN]),
  createHalaqaSchemas,
  validateMiddleware,
  createHalaqa,
);

export default route;
