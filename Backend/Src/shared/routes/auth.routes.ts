import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { requireRole } from "../middlewares/require-auth.middleware.js";

const authRoutes = Router();
const controller = new AuthController();

authRoutes.get(
  "/session",
  requireRole("parent", "provider", "admin"),
  controller.session,
);
authRoutes.post("/refresh", controller.refresh);
authRoutes.post(
  "/logout",
  requireRole("parent", "provider", "admin"),
  controller.logout,
);

export default authRoutes;
