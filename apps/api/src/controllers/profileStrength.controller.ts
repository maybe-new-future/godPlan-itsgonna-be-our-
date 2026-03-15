import { Request, Response } from "express";
import { prisma } from "../config/prisma";

function isFilled(value: unknown) {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== null && value !== undefined;
}

export async function getProfileStrength(req: Request, res: Response) {
  const userId = (req as any).user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      candidateProfile: {
        select: {
          fullName: true,
          city: true,
          skills: true,
          experienceLevel: true,
          cvUrl: true,
          bio: true,
        },
      },
      companyProfile: {
        select: {
          companyName: true,
          city: true,
          description: true,
          website: true,
          logoUrl: true,
          isVerified: true,
          verifiedAt: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.role === "CANDIDATE") {
    const fields = {
      fullName: user.candidateProfile?.fullName,
      city: user.candidateProfile?.city,
      skills: user.candidateProfile?.skills,
      experienceLevel: user.candidateProfile?.experienceLevel,
      cvUrl: user.candidateProfile?.cvUrl,
      bio: user.candidateProfile?.bio,
    };

    const checks = Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, isFilled(value)])
    );
    const completedFields = Object.values(checks).filter(Boolean).length;
    const totalFields = Object.keys(fields).length;
    const missingFields = Object.entries(checks)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    return res.json({
      role: user.role,
      completion: Math.round((completedFields / totalFields) * 100),
      completedFields,
      totalFields,
      missingFields,
      checks,
    });
  }

  const fields = {
    companyName: user.companyProfile?.companyName,
    city: user.companyProfile?.city,
    description: user.companyProfile?.description,
    website: user.companyProfile?.website,
    logoUrl: user.companyProfile?.logoUrl,
  };

  const checks = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, isFilled(value)])
  );
  const completedFields = Object.values(checks).filter(Boolean).length;
  const totalFields = Object.keys(fields).length;
  const missingFields = Object.entries(checks)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return res.json({
    role: user.role,
    completion: Math.round((completedFields / totalFields) * 100),
    completedFields,
    totalFields,
    missingFields,
    checks,
    verification: {
      isVerified: user.companyProfile?.isVerified ?? false,
      verifiedAt: user.companyProfile?.verifiedAt ?? null,
    },
  });
}
