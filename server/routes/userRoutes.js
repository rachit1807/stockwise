import { Router } from "express";
import { userController } from "../controllers/userController.js";
import { verifyToken } from "../middleware/verifyToken.js";
export function userRoutes(store, settings, limiter) {
  const router = Router();
  const controller = userController(store, settings);
  const guard = verifyToken(store, settings);
  router.post("/register", limiter, controller.register);
  router.post("/login", limiter, controller.login);
  router.get("/me", guard, controller.me);
  router.get("/verify", guard, controller.verify);
  router.post("/logout", guard, controller.logout);
  return router;
}
