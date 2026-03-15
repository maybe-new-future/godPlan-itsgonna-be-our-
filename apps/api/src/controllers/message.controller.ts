import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { z } from "zod";
import { validationError } from "../utils/validation";

const conversationIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const messageContentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

const createConversationSchema = messageContentSchema.extend({
  candidateUserId: z.string().uuid().optional(),
  companyUserId: z.string().uuid().optional(),
});

function getMessagingUser(req: Request, res: Response) {
  const user = (req as any).user as { id: string; role: string };

  if (user.role === "ADMIN") {
    res.status(403).json({ message: "Forbidden" });
    return null;
  }

  return user;
}

function belongsToConversation(userId: string, conversation: { candidateUserId: string; companyUserId: string }) {
  return conversation.candidateUserId === userId || conversation.companyUserId === userId;
}

function getOtherUserPreview(
  userId: string,
  conversation: {
    candidateUserId: string;
    companyUserId: string;
    candidate: {
      id: string;
      email: string;
      candidateProfile: { fullName: string; city: string; avatarUrl: string | null } | null;
    };
    company: {
      id: string;
      email: string;
      companyProfile: { companyName: string; city: string; logoUrl: string | null } | null;
    };
  }
) {
  const isCandidate = conversation.candidateUserId === userId;

  if (isCandidate) {
    return {
      id: conversation.company.id,
      email: conversation.company.email,
      role: "COMPANY",
      companyProfile: conversation.company.companyProfile,
    };
  }

  return {
    id: conversation.candidate.id,
    email: conversation.candidate.email,
    role: "CANDIDATE",
    candidateProfile: conversation.candidate.candidateProfile,
  };
}

export async function listConversations(req: Request, res: Response) {
  const user = getMessagingUser(req, res);
  if (!user) return;

  const where =
    user.role === "CANDIDATE"
      ? { candidateUserId: user.id }
      : { companyUserId: user.id };

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      updatedAt: true,
      candidateUserId: true,
      companyUserId: true,
      candidate: {
        select: {
          id: true,
          email: true,
          candidateProfile: {
            select: {
              fullName: true,
              city: true,
              avatarUrl: true,
            },
          },
        },
      },
      company: {
        select: {
          id: true,
          email: true,
          companyProfile: {
            select: {
              companyName: true,
              city: true,
              logoUrl: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderUserId: true,
          isRead: true,
        },
      },
    },
  });

  const conversationsWithUnreadCount = await Promise.all(
    conversations.map(async (conversation) => {
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conversation.id,
          senderUserId: { not: user.id },
          isRead: false,
        },
      });

      return {
        id: conversation.id,
        updatedAt: conversation.updatedAt,
        otherUser: getOtherUserPreview(user.id, conversation),
        lastMessage: conversation.messages[0] || null,
        unreadCount,
      };
    })
  );

  return res.json({ conversations: conversationsWithUnreadCount });
}

export async function getConversation(req: Request, res: Response) {
  const user = getMessagingUser(req, res);
  if (!user) return;

  const paramsParsed = conversationIdParamsSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json(validationError(paramsParsed.error));
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: paramsParsed.data.id },
    select: {
      id: true,
      candidateUserId: true,
      companyUserId: true,
      candidate: {
        select: {
          id: true,
          email: true,
          candidateProfile: {
            select: {
              fullName: true,
              city: true,
              avatarUrl: true,
            },
          },
        },
      },
      company: {
        select: {
          id: true,
          email: true,
          companyProfile: {
            select: {
              companyName: true,
              city: true,
              logoUrl: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          senderUserId: true,
          content: true,
          isRead: true,
          createdAt: true,
        },
      },
    },
  });

  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  if (!belongsToConversation(user.id, conversation)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await prisma.message.updateMany({
    where: {
      conversationId: conversation.id,
      senderUserId: { not: user.id },
      isRead: false,
    },
    data: { isRead: true },
  });

  const messages = conversation.messages.map((message) => ({
    ...message,
    isRead: message.senderUserId === user.id ? message.isRead : true,
  }));

  return res.json({
    conversation: {
      id: conversation.id,
      otherUser: getOtherUserPreview(user.id, conversation),
      messages,
    },
  });
}

export async function createConversationAndSendMessage(req: Request, res: Response) {
  const user = getMessagingUser(req, res);
  if (!user) return;

  const parsed = createConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(validationError(parsed.error));
  }

  let candidateUserId = parsed.data.candidateUserId;
  let companyUserId = parsed.data.companyUserId;

  if (user.role === "CANDIDATE") {
    candidateUserId = user.id;
    if (!companyUserId) {
      return res.status(400).json({ message: "companyUserId is required" });
    }
  } else if (user.role === "COMPANY") {
    companyUserId = user.id;
    if (!candidateUserId) {
      return res.status(400).json({ message: "candidateUserId is required" });
    }
  } else {
    return res.status(403).json({ message: "Forbidden" });
  }

  const [candidateUser, companyUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: candidateUserId },
      select: {
        id: true,
        role: true,
        email: true,
        candidateProfile: {
          select: {
            fullName: true,
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: companyUserId },
      select: {
        id: true,
        role: true,
        email: true,
        companyProfile: {
          select: {
            companyName: true,
          },
        },
      },
    }),
  ]);

  if (!candidateUser || candidateUser.role !== "CANDIDATE") {
    return res.status(404).json({ message: "Candidate not found" });
  }

  if (!companyUser || companyUser.role !== "COMPANY") {
    return res.status(404).json({ message: "Company not found" });
  }

  const existingConversation = await prisma.conversation.findUnique({
    where: {
      candidateUserId_companyUserId: {
        candidateUserId,
        companyUserId,
      },
    },
  });

  const now = new Date();
  const recipientUserId = user.role === "CANDIDATE" ? companyUserId : candidateUserId;
  const senderLabel =
    user.role === "CANDIDATE"
      ? candidateUser.candidateProfile?.fullName || candidateUser.email
      : companyUser.companyProfile?.companyName || companyUser.email;

  const [conversation, message] = existingConversation
    ? await prisma.$transaction(async (tx) => {
        const updatedConversation = await tx.conversation.update({
          where: { id: existingConversation.id },
          data: { updatedAt: now },
        });

        const createdMessage = await tx.message.create({
          data: {
            conversationId: existingConversation.id,
            senderUserId: user.id,
            content: parsed.data.content,
          },
        });

        await tx.notification.create({
          data: {
            userId: recipientUserId,
            type: "MESSAGE_RECEIVED",
            title: "New message received",
            message: `You received a new message from ${senderLabel}`,
          },
        });

        return [updatedConversation, createdMessage] as const;
      })
    : await prisma.$transaction(async (tx) => {
        const createdConversation = await tx.conversation.create({
          data: {
            candidateUserId,
            companyUserId,
          },
        });

        const createdMessage = await tx.message.create({
          data: {
            conversationId: createdConversation.id,
            senderUserId: user.id,
            content: parsed.data.content,
          },
        });

        await tx.notification.create({
          data: {
            userId: recipientUserId,
            type: "MESSAGE_RECEIVED",
            title: "New message received",
            message: `You received a new message from ${senderLabel}`,
          },
        });

        return [createdConversation, createdMessage] as const;
      });

  return res.status(existingConversation ? 200 : 201).json({
    conversation,
    message,
  });
}

export async function sendMessageInConversation(req: Request, res: Response) {
  const user = getMessagingUser(req, res);
  if (!user) return;

  const paramsParsed = conversationIdParamsSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json(validationError(paramsParsed.error));
  }

  const bodyParsed = messageContentSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json(validationError(bodyParsed.error));
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: paramsParsed.data.id },
    select: {
      id: true,
      candidateUserId: true,
      companyUserId: true,
      candidate: {
        select: {
          email: true,
          candidateProfile: {
            select: {
              fullName: true,
            },
          },
        },
      },
      company: {
        select: {
          email: true,
          companyProfile: {
            select: {
              companyName: true,
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  if (!belongsToConversation(user.id, conversation)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const recipientUserId =
    conversation.candidateUserId === user.id ? conversation.companyUserId : conversation.candidateUserId;
  const senderLabel =
    conversation.candidateUserId === user.id
      ? conversation.candidate.candidateProfile?.fullName || conversation.candidate.email
      : conversation.company.companyProfile?.companyName || conversation.company.email;
  const now = new Date();

  const [updatedConversation, message] = await prisma.$transaction(async (tx) => {
    const nextConversation = await tx.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: now },
    });

    const createdMessage = await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderUserId: user.id,
        content: bodyParsed.data.content,
      },
    });

    await tx.notification.create({
      data: {
        userId: recipientUserId,
        type: "MESSAGE_RECEIVED",
        title: "New message received",
        message: `You received a new message from ${senderLabel}`,
      },
    });

    return [nextConversation, createdMessage] as const;
  });

  return res.json({
    conversation: updatedConversation,
    message,
  });
}

export async function getUnreadMessagesCount(req: Request, res: Response) {
  const user = getMessagingUser(req, res);
  if (!user) return;

  const unreadCount = await prisma.message.count({
    where: {
      isRead: false,
      senderUserId: { not: user.id },
      conversation:
        user.role === "CANDIDATE"
          ? { candidateUserId: user.id }
          : { companyUserId: user.id },
    },
  });

  return res.json({ unreadCount });
}
