import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { uploadCv as uploadCvMiddleware } from "../middlewares/uploadCv";
import {
  uploadAvatar as uploadAvatarMiddleware,
  uploadCompanyLogo as uploadCompanyLogoMiddleware,
} from "../middlewares/uploadImage";
import {
  getMe,
  getOnboardingStatus,
  upsertCandidateProfile,
  upsertCompanyProfile,
  getMyJobs,
  getMyApplications,
  getMySavedJobs,
  uploadCv,
  uploadAvatar,
  uploadCompanyLogo,
} from "../controllers/me.controller";

const router = Router();

router.get("/", requireAuth, getMe);
router.get("/onboarding-status", requireAuth, getOnboardingStatus);
router.get("/jobs", requireAuth, requireRole("COMPANY"), getMyJobs);
router.get("/applications", requireAuth, requireRole("CANDIDATE"), getMyApplications);
router.get("/saved-jobs", requireAuth, requireRole("CANDIDATE"), getMySavedJobs);

router.put(
  "/candidate-profile",
  requireAuth,
  requireRole("CANDIDATE"),
  upsertCandidateProfile
);

router.post(
  "/avatar",
  requireAuth,
  requireRole("CANDIDATE"),
  (req, res, next) => {
    uploadAvatarMiddleware(req, res, (err: unknown) => {
      if (err) {
        return res.status(400).json({ message: err instanceof Error ? err.message : "Upload failed" });
      }
      next();
    });
  },
  uploadAvatar
);

router.post(
  "/cv",
  requireAuth,
  requireRole("CANDIDATE"),
  (req, res, next) => {
    uploadCvMiddleware(req, res, (err: unknown) => {
      if (err) {
        return res.status(400).json({ message: err instanceof Error ? err.message : "Upload failed" });
      }
      next();
    });
  },
  uploadCv
);

router.put(
  "/company-profile",
  requireAuth,
  requireRole("COMPANY"),
  upsertCompanyProfile
);

router.post(
  "/company-logo",
  requireAuth,
  requireRole("COMPANY"),
  (req, res, next) => {
    uploadCompanyLogoMiddleware(req, res, (err: unknown) => {
      if (err) {
        return res.status(400).json({ message: err instanceof Error ? err.message : "Upload failed" });
      }
      next();
    });
  },
  uploadCompanyLogo
);

export default router;
