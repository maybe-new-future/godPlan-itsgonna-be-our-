import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import {
  deleteAdminJob,
  deleteAdminUser,
  getAdminStats,
  listAdminJobs,
  listAdminUsers,
  updateAdminCompanyVerification,
  updateAdminJobStatus,
  updateAdminUserStatus,
} from "../controllers/admin.controller";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/stats", getAdminStats);
router.get("/users", listAdminUsers);
router.patch("/users/:id/status", updateAdminUserStatus);
router.delete("/users/:id", deleteAdminUser);
router.patch("/companies/:id/verify", updateAdminCompanyVerification);
router.get("/jobs", listAdminJobs);
router.patch("/jobs/:id/status", updateAdminJobStatus);
router.delete("/jobs/:id", deleteAdminJob);

export default router;
