import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { applyRateLimiter } from "../middlewares/rateLimit";
import {
  applyToJob,
  listApplicants,
  updateApplicationStatus,
  withdrawApplication,
} from "../controllers/applications.controller";

const router = Router();

// candidate applies
router.post("/jobs/:id/apply", applyRateLimiter, requireAuth, requireRole("CANDIDATE"), applyToJob);

// company views applicants
router.get("/jobs/:id/applications", requireAuth, requireRole("COMPANY"), listApplicants);

// company updates application status
router.patch(
  "/applications/:id/status",
  requireAuth,
  requireRole("COMPANY"),
  updateApplicationStatus
);

// candidate withdraws application
router.patch(
  "/applications/:id/withdraw",
  requireAuth,
  requireRole("CANDIDATE"),
  withdrawApplication
);

export default router;
