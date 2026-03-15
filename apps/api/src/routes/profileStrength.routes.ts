import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { getProfileStrength } from "../controllers/profileStrength.controller";

const router = Router();

router.get("/profile-strength", requireAuth, getProfileStrength);

export default router;
