import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const notificationIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function listNotifications(req: Request, res: Response) {
  const userId = (req as any).user.id;

  const parsed = paginationSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where = { userId };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    }),
  ]);

  return res.json({
    notifications,
    unreadCount,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function getUnreadNotificationsCount(req: Request, res: Response) {
  const userId = (req as any).user.id;

  const unreadCount = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });

  return res.json({ unreadCount });
}

export async function markNotificationAsRead(req: Request, res: Response) {
  const userId = (req as any).user.id;

  const parsed = notificationIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const notification = await prisma.notification.findUnique({
    where: { id: parsed.data.id },
  });

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  if (notification.userId !== userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const updated = await prisma.notification.update({
    where: { id: parsed.data.id },
    data: { isRead: true },
  });

  return res.json({ notification: updated });
}

export async function markAllNotificationsAsRead(req: Request, res: Response) {
  const userId = (req as any).user.id;

  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return res.json({
    message: "All notifications marked as read",
    updatedCount: result.count,
  });
}
