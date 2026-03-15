import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { z } from "zod";

const companyIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function getCompanyTrust(req: Request, res: Response) {
  const parsed = companyIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const company = await prisma.user.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      role: true,
      companyProfile: {
        select: {
          companyName: true,
          city: true,
          website: true,
          logoUrl: true,
          description: true,
          isVerified: true,
          verifiedAt: true,
        },
      },
      _count: {
        select: {
          jobs: true,
        },
      },
      jobs: {
        where: { status: "OPEN" },
        select: { id: true },
      },
    },
  });

  if (!company || company.role !== "COMPANY" || !company.companyProfile) {
    return res.status(404).json({ message: "Company not found" });
  }

  return res.json({
    id: company.id,
    companyName: company.companyProfile.companyName,
    city: company.companyProfile.city,
    website: company.companyProfile.website,
    logoUrl: company.companyProfile.logoUrl,
    description: company.companyProfile.description,
    isVerified: company.companyProfile.isVerified,
    verifiedAt: company.companyProfile.verifiedAt,
    metrics: {
      openJobs: company.jobs.length,
      totalJobs: company._count.jobs,
    },
  });
}
