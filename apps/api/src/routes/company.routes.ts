import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { getCompanyDashboard } from "../controllers/companyDashboard.controller";

const router = Router();

router.get("/dashboard", requireAuth, requireRole("COMPANY"), getCompanyDashboard);

export default router;
