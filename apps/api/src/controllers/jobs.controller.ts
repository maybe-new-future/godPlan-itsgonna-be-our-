import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { z } from "zod";
import { validationError } from "../utils/validation";

// Create / Update Job schema
const jobSchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().min(10),
  city: z.string().trim().min(2),
  contractType: z.string().trim().nullable().optional(),
  salaryMin: z.number().int().nullable().optional(),
  salaryMax: z.number().int().nullable().optional(),
});

export async function createJob(req: Request, res: Response) {
  const userId = (req as any).user.id;

  const parsed = jobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(validationError(parsed.error));
  }

  const job = await prisma.job.create({
    data: {
      companyUserId: userId,
      ...parsed.data,
    },
  });

  return res.status(201).json({ job });
}

export async function updateJob(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const jobId = String(req.params.id);

  const parsed = jobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(validationError(parsed.error));
  }

  const existing = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!existing) {
    return res.status(404).json({ message: "Job not found" });
  }

  if (existing.companyUserId !== userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const job = await prisma.job.update({
    where: { id: jobId },
    data: parsed.data,
  });

  return res.json({ job });
}

// List Jobs with filters
export async function listJobs(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
  const skip = (page - 1) * limit;

  const q = String(req.query.q || "").trim();
  const city = String(req.query.city || "").trim();
  const contractType = String(req.query.contractType || "").trim();

  const where: any = {
    status: "OPEN",
  };

  if (q) {
    where.OR = [
      {
        title: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: q,
          mode: "insensitive",
        },
      },
    ];
  }

  if (city) {
    where.city = {
      contains: city,
      mode: "insensitive",
    };
  }

  if (contractType) {
    where.contractType = {
      contains: contractType,
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
        title: true,
        city: true,
        contractType: true,
        salaryMin: true,
        salaryMax: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            companyProfile: {
              select: {
                companyName: true,
                logoUrl: true,
              },
            },
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

// Job Detail
export async function getJob(req: Request, res: Response) {
  const jobId = String(req.params.id);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: {
        select: {
          id: true,
          companyProfile: true,
        },
      },
    },
  });

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  return res.json({ job });
}

export async function closeJob(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const jobId = String(req.params.id);

  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  if (job.companyUserId !== userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: { status: "CLOSED" },
  });

  return res.json({ job: updated });
}

export async function deleteJob(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const jobId = String(req.params.id);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      companyUserId: true,
    },
  });

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  if (job.companyUserId !== userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await prisma.application.deleteMany({
    where: { jobId },
  });

  await prisma.savedJob.deleteMany({
    where: { jobId },
  });

  await prisma.job.delete({
    where: { id: jobId },
  });

  return res.json({ message: "Job deleted successfully" });
}

export async function saveJob(req: Request, res: Response) {
  const candidateUserId = (req as any).user.id;
  const jobId = String(req.params.id);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true },
  });

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  const existingSavedJob = await prisma.savedJob.findUnique({
    where: {
      jobId_candidateUserId: {
        jobId,
        candidateUserId,
      },
    },
  });

  if (existingSavedJob) {
    return res.status(409).json({ message: "Job already saved" });
  }

  const savedJob = await prisma.savedJob.create({
    data: {
      jobId,
      candidateUserId,
    },
  });

  return res.status(201).json({ savedJob });
}

export async function unsaveJob(req: Request, res: Response) {
  const candidateUserId = (req as any).user.id;
  const jobId = String(req.params.id);

  const existingSavedJob = await prisma.savedJob.findUnique({
    where: {
      jobId_candidateUserId: {
        jobId,
        candidateUserId,
      },
    },
  });

  if (!existingSavedJob) {
    return res.status(404).json({ message: "Saved job not found" });
  }

  await prisma.savedJob.delete({
    where: {
      jobId_candidateUserId: {
        jobId,
        candidateUserId,
      },
    },
  });

  return res.json({ message: "Job removed from saved jobs" });
}
