import { Router } from "express";
import { getCompanyTrust } from "../controllers/companies.controller";

const router = Router();

router.get("/:id/trust", getCompanyTrust);

export default router;
