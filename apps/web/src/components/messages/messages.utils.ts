export type ConversationListItem = {
  id: string;
  updatedAt: string;
  unreadCount: number;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderUserId: string;
    isRead: boolean;
  } | null;
  otherUser: {
    id: string;
    email: string;
    role: "CANDIDATE" | "COMPANY";
    candidateProfile?: {
      fullName?: string | null;
      city?: string | null;
      avatarUrl?: string | null;
    } | null;
    companyProfile?: {
      companyName?: string | null;
      city?: string | null;
      logoUrl?: string | null;
    } | null;
  };
};

export type ConversationThread = {
  id: string;
  otherUser: ConversationListItem["otherUser"];
  messages: Array<{
    id: string;
    senderUserId: string;
    content: string;
    isRead: boolean;
    createdAt: string;
  }>;
};

export type MessagingCurrentUser = {
  id: string;
  email: string;
  role: "CANDIDATE" | "COMPANY";
  candidateProfile?: {
    fullName?: string | null;
    avatarUrl?: string | null;
  } | null;
  companyProfile?: {
    companyName?: string | null;
    logoUrl?: string | null;
  } | null;
};

export function getMessagingErrorMessage(error: unknown, fallback: string) {
  const maybeError = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return maybeError?.response?.data?.message || maybeError?.message || fallback;
}

export function getOtherUserName(otherUser: ConversationListItem["otherUser"]) {
  return (
    otherUser.candidateProfile?.fullName?.trim() ||
    otherUser.companyProfile?.companyName?.trim() ||
    otherUser.email
  );
}

export function getUserDisplayName(user: ConversationListItem["otherUser"] | MessagingCurrentUser) {
  return (
    user.candidateProfile?.fullName?.trim() ||
    user.companyProfile?.companyName?.trim() ||
    user.email
  );
}

export function getUserImage(user: ConversationListItem["otherUser"] | MessagingCurrentUser) {
  if (user.role === "CANDIDATE") {
    return user.candidateProfile?.avatarUrl ?? null;
  }

  return user.companyProfile?.logoUrl ?? null;
}

export function formatConversationTime(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatMessageTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
