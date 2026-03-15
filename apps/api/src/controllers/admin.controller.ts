import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { z } from "zod";
import { validationError } from "../utils/validation";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const usersQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional().default(""),
  role: z.enum(["CANDIDATE", "COMPANY", "ADMIN"]).optional(),
  isActive: z.preprocess((value) => {
    if (value === undefined || value === "") return undefined;
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  }, z.boolean().optional()),
});

const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

const userIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const companyIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const jobsQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional().default(""),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
  companyUserId: z.string().uuid().optional(),
  city: z.string().trim().optional().default(""),
});

const updateJobStatusSchema = z.object({
  status: z.enum(["OPEN", "CLOSED"]),
});

const jobIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const updateCompanyVerificationSchema = z.object({
  isVerified: z.boolean(),
});

export async function getAdminStats(_req: Request, res: Response) {
  const [
    totalUsers,
    totalCandidates,
    totalCompanies,
    totalAdmins,
    activeUsers,
    inactiveUsers,
    totalJobs,
    openJobs,
    closedJobs,
    totalApplications,
    totalSavedJobs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "CANDIDATE" } }),
    prisma.user.count({ where: { role: "COMPANY" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.job.count(),
    prisma.job.count({ where: { status: "OPEN" } }),
    prisma.job.count({ where: { status: "CLOSED" } }),
    prisma.application.count(),
    prisma.savedJob.count(),
  ]);

  return res.json({
    totalUsers,
    totalCandidates,
    totalCompanies,
    totalAdmins,
    activeUsers,
    inactiveUsers,
    totalJobs,
    openJobs,
    closedJobs,
    totalApplications,
    totalSavedJobs,
  });
}

export async function listAdminUsers(req: Request, res: Response) {
  const parsed = usersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json(validationError(parsed.error));
  }

  const { page, limit, search, role, isActive } = parsed.data;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      {
        email: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        candidateProfile: {
          is: {
            fullName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
      {
        companyProfile: {
          is: {
            companyName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        candidateProfile: {
          select: {
            fullName: true,
            city: true,
            experienceLevel: true,
          },
        },
        companyProfile: {
          select: {
            companyName: true,
            city: true,
            sector: true,
          },
        },
        _count: {
          select: {
            jobs: true,
            applications: true,
            savedJobs: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return res.json({
    users,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function updateAdminUserStatus(req: Request, res: Response) {
  const paramsParsed = userIdParamsSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json(validationError(paramsParsed.error));
  }

  const bodyParsed = updateUserStatusSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json(validationError(bodyParsed.error));
  }

  const adminUserId = (req as any).user.id;
  const userId = paramsParsed.data.id;

  if (adminUserId === userId && bodyParsed.data.isActive === false) {
    return res.status(400).json({ message: "Admin cannot deactivate themself" });
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!existing) {
    return res.status(404).json({ message: "User not found" });
  }

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { isActive: bodyParsed.data.isActive },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        adminUserId,
        action: "USER_STATUS_UPDATED",
        targetType: "User",
        targetId: userId,
        details: `Updated user status to ${bodyParsed.data.isActive ? "active" : "inactive"}`,
      },
    }),
  ]);

  return res.json({ user });
}

export async function deleteAdminUser(req: Request, res: Response) {
  const paramsParsed = userIdParamsSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json(validationError(paramsParsed.error));
  }

  const adminUserId = (req as any).user.id;
  const userId = paramsParsed.data.id;

  if (adminUserId === userId) {
    return res.status(400).json({ message: "Admin cannot delete themself" });
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      candidateProfile: { select: { userId: true } },
      companyProfile: { select: { userId: true } },
      _count: {
        select: {
          jobs: true,
          applications: true,
          savedJobs: true,
        },
      },
    },
  });

  if (!existing) {
    return res.status(404).json({ message: "User not found" });
  }

  const hasRelatedRecords =
    Boolean(existing.candidateProfile) ||
    Boolean(existing.companyProfile) ||
    existing._count.jobs > 0 ||
    existing._count.applications > 0 ||
    existing._count.savedJobs > 0;

  if (hasRelatedRecords) {
    return res.status(400).json({ message: "Cannot delete user with related records" });
  }

  await prisma.$transaction([
    prisma.adminAuditLog.create({
      data: {
        adminUserId,
        action: "USER_DELETED",
        targetType: "User",
        targetId: userId,
        details: "Deleted user without related records",
      },
    }),
    prisma.user.delete({
      where: { id: userId },
    }),
  ]);

  return res.json({ message: "User deleted successfully" });
}

export async function listAdminJobs(req: Request, res: Response) {
  const parsed = jobsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json(validationError(parsed.error));
  }

  const { page, limit, search, status, companyUserId, city } = parsed.data;
  const skip = (page - 1) * limit;
  const where: any = {};

  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        company: {
          is: {
            companyProfile: {
              is: {
                companyName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
        },
      },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (companyUserId) {
    where.companyUserId = companyUserId;
  }

  if (city) {
    where.city = {
      contains: city,
      mode: "insensitive",
    };
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        companyUserId: true,
        title: true,
        description: true,
        city: true,
        contractType: true,
        salaryMin: true,
        salaryMax: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            email: true,
            companyProfile: {
              select: {
                companyName: true,
                city: true,
                sector: true,
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
            savedBy: true,
          },
        },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return res.json({
    jobs,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function updateAdminJobStatus(req: Request, res: Response) {
  const paramsParsed = jobIdParamsSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json(validationError(paramsParsed.error));
  }

  const bodyParsed = updateJobStatusSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json(validationError(bodyParsed.error));
  }

  const adminUserId = (req as any).user.id;

  const existing = await prisma.job.findUnique({
    where: { id: paramsParsed.data.id },
    select: { id: true },
  });

  if (!existing) {
    return res.status(404).json({ message: "Job not found" });
  }

  const [job] = await prisma.$transaction([
    prisma.job.update({
      where: { id: paramsParsed.data.id },
      data: { status: bodyParsed.data.status },
    }),
    prisma.adminAuditLog.create({
      data: {
        adminUserId,
        action: "JOB_STATUS_UPDATED",
        targetType: "Job",
        targetId: paramsParsed.data.id,
        details: `Updated job status to ${bodyParsed.data.status}`,
      },
    }),
  ]);

  return res.json({ job });
}

export async function deleteAdminJob(req: Request, res: Response) {
  const paramsParsed = jobIdParamsSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json(validationError(paramsParsed.error));
  }

  const adminUserId = (req as any).user.id;
  const jobId = paramsParsed.data.id;

  const existing = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true },
  });

  if (!existing) {
    return res.status(404).json({ message: "Job not found" });
  }

  await prisma.$transaction([
    prisma.adminAuditLog.create({
      data: {
        adminUserId,
        action: "JOB_DELETED",
        targetType: "Job",
        targetId: jobId,
        details: "Deleted job and related applications/saved jobs",
      },
    }),
    prisma.application.deleteMany({
      where: { jobId },
    }),
    prisma.savedJob.deleteMany({
      where: { jobId },
    }),
    prisma.job.delete({
      where: { id: jobId },
    }),
  ]);

  return res.json({ message: "Job deleted successfully" });
}

export async function updateAdminCompanyVerification(req: Request, res: Response) {
  const paramsParsed = companyIdParamsSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json(validationError(paramsParsed.error));
  }

  const bodyParsed = updateCompanyVerificationSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json(validationError(bodyParsed.error));
  }

  const adminUserId = (req as any).user.id;

  const existing = await prisma.user.findUnique({
    where: { id: paramsParsed.data.id },
    select: {
      id: true,
      role: true,
      companyProfile: {
        select: {
          userId: true,
          companyName: true,
          city: true,
          website: true,
          logoUrl: true,
          description: true,
          isVerified: true,
          verifiedAt: true,
        },
      },
    },
  });

  if (!existing || existing.role !== "COMPANY" || !existing.companyProfile) {
    return res.status(404).json({ message: "Company not found" });
  }

  const [profile] = await prisma.$transaction([
    prisma.companyProfile.update({
      where: { userId: paramsParsed.data.id },
      data: {
        isVerified: bodyParsed.data.isVerified,
        verifiedAt: bodyParsed.data.isVerified ? new Date() : null,
      },
      select: {
        userId: true,
        companyName: true,
        city: true,
        website: true,
        logoUrl: true,
        description: true,
        isVerified: true,
        verifiedAt: true,
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        adminUserId,
        action: "COMPANY_VERIFIED",
        targetType: "CompanyProfile",
        targetId: paramsParsed.data.id,
        details: bodyParsed.data.isVerified ? "Marked company as verified" : "Removed company verification",
      },
    }),
  ]);

  return res.json({ profile });
}
