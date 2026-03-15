import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { z } from "zod";

export async function applyToJob(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const jobId = String(req.params.id);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      title: true,
      companyUserId: true,
    },
  });

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  if (job.status !== "OPEN") {
    return res.status(400).json({ message: "This job is closed" });
  }

  const existingApplication = await prisma.application.findUnique({
    where: {
      jobId_candidateUserId: {
        jobId,
        candidateUserId: userId,
      },
    },
  });

  if (existingApplication) {
    if (existingApplication.status === "WITHDRAWN") {
      const candidate = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          candidateProfile: {
            select: {
              fullName: true,
            },
          },
        },
      });

      const applicantLabel = candidate?.candidateProfile?.fullName || candidate?.email || "A candidate";

      const [application] = await prisma.$transaction([
        prisma.application.update({
          where: { id: existingApplication.id },
          data: {
            status: "SUBMITTED",
          },
        }),
        prisma.notification.create({
          data: {
            userId: job.companyUserId,
            type: "NEW_APPLICATION",
            title: "New application received",
            message: `${applicantLabel} applied to ${job.title}`,
          },
        }),
      ]);

      return res.status(201).json({ application });
    }

    return res.status(409).json({ message: "Already applied to this job" });
  }

  const candidate = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      candidateProfile: {
        select: {
          fullName: true,
        },
      },
    },
  });

  const applicantLabel = candidate?.candidateProfile?.fullName || candidate?.email || "A candidate";

  const [application] = await prisma.$transaction([
    prisma.application.create({
      data: {
        jobId,
        candidateUserId: userId,
      },
    }),
    prisma.notification.create({
      data: {
        userId: job.companyUserId,
        type: "NEW_APPLICATION",
        title: "New application received",
        message: `${applicantLabel} applied to ${job.title}`,
      },
    }),
  ]);

  return res.status(201).json({ application });
}

// Company views applicants
export async function listApplicants(req: Request, res: Response) {
  const companyUserId = (req as any).user.id;
  const jobId = String(req.params.id);

  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  if (job.companyUserId !== companyUserId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const applicants = await prisma.application.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
    include: {
      candidate: {
        select: {
          id: true,
          email: true,
          candidateProfile: true,
        },
      },
    },
  });

  return res.json({ applicants });
}

const updateApplicationStatusSchema = z.object({
  status: z.enum(["SEEN", "ACCEPTED", "REJECTED"]),
});

export async function updateApplicationStatus(req: Request, res: Response) {
  const companyUserId = (req as any).user.id;
  const applicationId = String(req.params.id);

  const parsed = updateApplicationStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        select: {
          id: true,
          companyUserId: true,
          title: true,
        },
      },
    },
  });

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  if (application.job.companyUserId !== companyUserId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (application.status === "WITHDRAWN") {
    return res
      .status(400)
      .json({ message: "Withdrawn applications cannot be updated" });
  }

  const notificationTypeByStatus = {
    SEEN: "APPLICATION_SEEN",
    ACCEPTED: "APPLICATION_ACCEPTED",
    REJECTED: "APPLICATION_REJECTED",
  } as const;

  const notificationTitleByStatus = {
    SEEN: "Application seen",
    ACCEPTED: "Application accepted",
    REJECTED: "Application rejected",
  } as const;

  const notificationMessageByStatus = {
    SEEN: `Your application for ${application.job.title} has been seen`,
    ACCEPTED: `Your application for ${application.job.title} has been accepted`,
    REJECTED: `Your application for ${application.job.title} has been rejected`,
  } as const;

  const [updated] = await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: {
        status: parsed.data.status,
      },
    }),
    prisma.notification.create({
      data: {
        userId: application.candidateUserId,
        type: notificationTypeByStatus[parsed.data.status],
        title: notificationTitleByStatus[parsed.data.status],
        message: notificationMessageByStatus[parsed.data.status],
      },
    }),
  ]);

  return res.json({ application: updated });
}

export async function withdrawApplication(req: Request, res: Response) {
  const candidateUserId = (req as any).user.id;
  const applicationId = String(req.params.id);

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      candidateUserId: true,
      status: true,
    },
  });

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  if (application.candidateUserId !== candidateUserId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (application.status === "WITHDRAWN") {
    return res.status(400).json({ message: "Application already withdrawn" });
  }

  if (application.status === "ACCEPTED" || application.status === "REJECTED") {
    return res
      .status(400)
      .json({ message: "This application can no longer be withdrawn" });
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: "WITHDRAWN",
    },
  });

  return res.json({
    message: "Application withdrawn successfully",
    application: updated,
  });
}
