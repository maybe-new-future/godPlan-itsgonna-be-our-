import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { authRateLimiter } from "../middlewares/rateLimit";
import { login, logout, refresh, register } from "../controllers/auth.controller";

const router = Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.post("/refresh", authRateLimiter, refresh);
router.post("/logout", requireAuth, logout);

export default router;
