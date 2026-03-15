import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export async function getCompanyDashboard(req: Request, res: Response) {
  const companyUserId = (req as any).user.id;

  const [
    activeJobs,
    closedJobs,
    totalApplicants,
    recentApplicants,
    recentJobs,
  ] = await Promise.all([
    prisma.job.count({
      where: {
        companyUserId,
        status: "OPEN",
      },
    }),
    prisma.job.count({
      where: {
        companyUserId,
        status: "CLOSED",
      },
    }),
    prisma.application.count({
      where: {
        job: {
          companyUserId,
        },
      },
    }),
    prisma.application.findMany({
      where: {
        job: {
          companyUserId,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        candidate: {
          select: {
            id: true,
            email: true,
            candidateProfile: {
              select: {
                fullName: true,
                city: true,
              },
            },
          },
        },
      },
    }),
    prisma.job.findMany({
      where: {
        companyUserId,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
    }),
  ]);

  return res.json({
    stats: {
      activeJobs,
      closedJobs,
      totalApplicants,
    },
    recentApplicants: recentApplicants.map((application) => ({
      id: application.id,
      status: application.status,
      createdAt: application.createdAt,
      job: application.job,
      candidate: application.candidate,
    })),
    recentJobs: recentJobs.map((job) => ({
      id: job.id,
      title: job.title,
      status: job.status,
      createdAt: job.createdAt,
      applicationsCount: job._count.applications,
    })),
  });
}
