import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { z } from "zod";
import fs from "fs/promises";
import { validationError } from "../utils/validation";
import { resolveManagedUploadPath } from "../config/storage";

function isFilled(value: unknown) {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== null && value !== undefined;
}

function getSafeLocalUploadPath(fileUrl: string | null | undefined) {
  return resolveManagedUploadPath(fileUrl);
}

async function deleteLocalUploadIfManaged(fileUrl: string | null | undefined) {
  const absolutePath = getSafeLocalUploadPath(fileUrl);
  if (!absolutePath) {
    return;
  }

  await fs.unlink(absolutePath).catch(() => undefined);
}

export async function getMe(req: Request, res: Response) {
  const userId = (req as any).user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      candidateProfile: true,
      companyProfile: true,
      createdAt: true,
    },
  });

  return res.json({ user });
}

const candidateSchema = z.object({
  avatarUrl: z.string().trim().min(1).optional(),
  fullName: z.string().trim().min(2),
  city: z.string().trim().min(2),
  headline: z.string().trim().min(2).optional(),
  bio: z.string().trim().optional(),
  skills: z.string().trim().optional(),
  experienceLevel: z.string().trim().optional(),
  cvUrl: z.string().trim().min(1).optional(),
});

export async function upsertCandidateProfile(req: Request, res: Response) {
  const userId = (req as any).user.id;

  const parsed = candidateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(validationError(parsed.error));

  const profile = await prisma.candidateProfile.upsert({
    where: { userId },
    update: parsed.data,
    create: { userId, ...parsed.data },
  });

  return res.json({ profile });
}

const companySchema = z.object({
  companyName: z.string().trim().min(2),
  city: z.string().trim().min(2),
  sector: z.string().trim().optional(),
  description: z.string().trim().optional(),
  website: z.string().trim().url().optional(),
  logoUrl: z.string().trim().url().optional(),
});

export async function upsertCompanyProfile(req: Request, res: Response) {
  const userId = (req as any).user.id;

  const parsed = companySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(validationError(parsed.error));

  const profile = await prisma.companyProfile.upsert({
    where: { userId },
    update: parsed.data,
    create: { userId, ...parsed.data },
  });

  return res.json({ profile });
}

export async function getOnboardingStatus(req: Request, res: Response) {
  const userId = (req as any).user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      candidateProfile: {
        select: {
          avatarUrl: true,
          fullName: true,
          city: true,
          headline: true,
          bio: true,
          skills: true,
          experienceLevel: true,
        },
      },
      companyProfile: {
        select: {
          logoUrl: true,
          companyName: true,
          city: true,
          description: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const fields =
    user.role === "CANDIDATE"
      ? {
          avatarUrl: user.candidateProfile?.avatarUrl,
          fullName: user.candidateProfile?.fullName,
          city: user.candidateProfile?.city,
          headline: user.candidateProfile?.headline,
          bio: user.candidateProfile?.bio,
          skills: user.candidateProfile?.skills,
          experienceLevel: user.candidateProfile?.experienceLevel,
        }
      : {
          logoUrl: user.companyProfile?.logoUrl,
          companyName: user.companyProfile?.companyName,
          city: user.companyProfile?.city,
          description: user.companyProfile?.description,
        };

  const missingFields = Object.entries(fields)
    .filter(([, value]) => !isFilled(value))
    .map(([key]) => key);

  return res.json({
    role: user.role,
    isComplete: missingFields.length === 0,
    missingFields,
  });
}

export async function getMyJobs(req: Request, res: Response) {
  const userId = (req as any).user.id;

  const jobs = await prisma.job.findMany({
    where: { companyUserId: userId },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ jobs });
}

export async function getMyApplications(req: Request, res: Response) {
  const userId = (req as any).user.id;

  const applications = await prisma.application.findMany({
    where: { candidateUserId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          city: true,
          contractType: true,
          companyUserId: true,
          createdAt: true,
        },
      },
    },
  });

  return res.json({ applications });
}

export async function getMySavedJobs(req: Request, res: Response) {
  const userId = (req as any).user.id;

  const savedJobs = await prisma.savedJob.findMany({
    where: { candidateUserId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          city: true,
          contractType: true,
          salaryMin: true,
          salaryMax: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  return res.json({ savedJobs });
}

export async function uploadCv(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded. Send a PDF as 'cv'." });
  }

  const existing = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: { userId: true, cvUrl: true },
  });

  if (!existing) {
    return res.status(400).json({ message: "Complete your candidate profile first (full name and city)." });
  }

  await deleteLocalUploadIfManaged(existing.cvUrl);

  const publicPath = `/uploads/cv/${file.filename}`;
  const profile = await prisma.candidateProfile.update({
    where: { userId },
    data: { cvUrl: publicPath },
  });

  return res.json({ profile, cvUrl: profile.cvUrl });
}

export async function uploadAvatar(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded. Send an image as 'avatar'." });
  }

  const existing = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: { userId: true, avatarUrl: true },
  });

  if (!existing) {
    return res.status(400).json({ message: "Complete your candidate profile first (full name and city)." });
  }

  await deleteLocalUploadIfManaged(existing.avatarUrl);

  const publicPath = `/uploads/avatars/${file.filename}`;
  const profile = await prisma.candidateProfile.update({
    where: { userId },
    data: { avatarUrl: publicPath },
  });

  return res.json({ profile, avatarUrl: profile.avatarUrl });
}

export async function uploadCompanyLogo(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded. Send an image as 'logo'." });
  }

  const existing = await prisma.companyProfile.findUnique({
    where: { userId },
    select: { userId: true, logoUrl: true },
  });

  if (!existing) {
    return res.status(400).json({ message: "Complete your company profile first (company name and city)." });
  }

  await deleteLocalUploadIfManaged(existing.logoUrl);

  const publicPath = `/uploads/logos/${file.filename}`;
  const profile = await prisma.companyProfile.update({
    where: { userId },
    data: { logoUrl: publicPath },
  });

  return res.json({ profile, logoUrl: profile.logoUrl });
}
