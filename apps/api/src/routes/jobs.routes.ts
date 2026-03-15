import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import {
  createJob,
  updateJob,
  listJobs,
  getJob,
  closeJob,
  deleteJob,
  saveJob,
  unsaveJob,
} from "../controllers/jobs.controller";

const router = Router();

// guest
router.get("/", listJobs);
router.get("/:id", getJob);

// candidate
router.post("/:id/save", requireAuth, requireRole("CANDIDATE"), saveJob);
router.delete("/:id/save", requireAuth, requireRole("CANDIDATE"), unsaveJob);

// company
router.post("/", requireAuth, requireRole("COMPANY"), createJob);
router.put("/:id", requireAuth, requireRole("COMPANY"), updateJob);
router.post("/:id/close", requireAuth, requireRole("COMPANY"), closeJob);
router.delete("/:id", requireAuth, requireRole("COMPANY"), deleteJob);

export default router;