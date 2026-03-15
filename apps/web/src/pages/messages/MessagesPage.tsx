import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, MessageSquare, SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../api/client";
import { getUserIdFromToken } from "../../auth/auth";
import UserAvatar from "../../components/shared/UserAvatar";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import {
  formatConversationTime,
  formatMessageTime,
  getMessagingErrorMessage,
  getOtherUserName,
  getUserDisplayName,
  getUserImage,
  type MessagingCurrentUser,
  type ConversationListItem,
  type ConversationThread,
} from "../../components/messages/messages.utils";

type ConversationsResponse = {
  conversations: ConversationListItem[];
};

type ThreadResponse = {
  conversation: ConversationThread;
};

export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("conversation");
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [currentUser, setCurrentUser] = useState<MessagingCurrentUser | null>(null);
  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const currentUserId = getUserIdFromToken();

  async function loadConversations() {
    try {
      setLoadingConversations(true);
      const [messagesResponse, meResponse] = await Promise.all([
        api.get<ConversationsResponse>("/messages/conversations"),
        api.get("/me"),
      ]);
      const nextConversations = messagesResponse.data.conversations ?? [];
      setConversations(nextConversations);
      setCurrentUser(meResponse.data?.user ?? null);

      if (!selectedId && nextConversations.length > 0) {
        setSearchParams({ conversation: nextConversations[0].id });
      }
    } catch (error) {
      toast.error(getMessagingErrorMessage(error, "Failed to load conversations"));
    } finally {
      setLoadingConversations(false);
    }
  }

  async function loadThread(conversationId: string) {
    try {
      setLoadingThread(true);
      const response = await api.get<ThreadResponse>(`/messages/conversations/${conversationId}`);
      const nextThread = response.data.conversation;
      setThread(nextThread);
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
        )
      );
    } catch (error) {
      toast.error(getMessagingErrorMessage(error, "Failed to load conversation"));
    } finally {
      setLoadingThread(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setThread(null);
      return;
    }

    loadThread(selectedId);
  }, [selectedId]);

  async function sendMessage() {
    const content = composer.trim();
    if (!selectedId || !content) return;

    try {
      setSending(true);
      const response = await api.post(`/messages/conversations/${selectedId}`, { content });
      const message = response.data?.message;

      setThread((current) =>
        current
          ? {
              ...current,
              messages: [...current.messages, message],
            }
          : current
      );

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === selectedId
            ? {
                ...conversation,
                updatedAt: message.createdAt,
                lastMessage: {
                  id: message.id,
                  content: message.content,
                  createdAt: message.createdAt,
                  senderUserId: message.senderUserId,
                  isRead: message.isRead,
                },
              }
            : conversation
        )
      );

      setComposer("");
    } catch (error) {
      toast.error(getMessagingErrorMessage(error, "Failed to send message"));
    } finally {
      setSending(false);
    }
  }

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) || null,
    [conversations, selectedId]
  );

  return (
    <div className="page-container space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white px-6 py-7 shadow-[var(--shadow-card-hover)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,102,204,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,209,0,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(0,158,73,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(225,29,72,0.10),transparent_24%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--tifawin-primary)]/10 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--tifawin-primary)]">
              <span className="h-2 w-2 rounded-full bg-[var(--tifawin-primary)] animate-pulse" />
              Messaging workspace
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--tifawin-neutral-900)] sm:text-4xl">
                Messages
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[var(--tifawin-neutral-700)] sm:text-base">
                Keep conversations flowing between candidates and companies from one focused inbox.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card
          className={`rounded-[1.75rem] border-white/80 bg-white p-4 shadow-[var(--shadow-card)] ${
            selectedId ? "hidden xl:block" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-gray-200/80 px-2 pb-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--tifawin-neutral-900)]">Conversations</h2>
              <p className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                Select a thread to view messages.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {loadingConversations ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="rounded-2xl bg-[var(--tifawin-neutral-50)] p-4">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="mt-3 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-24" />
                </div>
              ))
            ) : conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[var(--tifawin-neutral-50)] px-5 py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white">
                  <MessageSquare className="h-6 w-6 text-[var(--tifawin-neutral-700)]" />
                </div>
                <div className="mt-4 text-base font-semibold text-[var(--tifawin-neutral-900)]">
                  No conversations yet
                </div>
                <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
                  Start a conversation from a job page or from your applicants list.
                </p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const active = conversation.id === selectedId;
                const otherUserName = getOtherUserName(conversation.otherUser);

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                      active
                        ? "border-[var(--tifawin-primary)]/15 bg-[linear-gradient(135deg,rgba(10,102,194,0.06),rgba(255,255,255,0.95))] shadow-[var(--shadow-card)]"
                        : "border-transparent bg-[var(--tifawin-neutral-50)] hover:bg-white hover:shadow-[var(--shadow-card)]"
                    }`}
                    onClick={() => setSearchParams({ conversation: conversation.id })}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <UserAvatar
                          imageUrl={getUserImage(conversation.otherUser)}
                          label={otherUserName}
                          sizeClassName="h-11 w-11"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="truncate font-semibold text-[var(--tifawin-neutral-900)]">
                              {otherUserName}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <span className="rounded-full bg-[#E11D48] px-2 py-0.5 text-[10px] font-bold text-white">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 break-all text-sm text-[var(--tifawin-neutral-700)]">
                            {conversation.otherUser.email}
                          </p>
                          <p className="mt-2 line-clamp-2 text-sm text-[var(--tifawin-neutral-700)]">
                            {conversation.lastMessage?.content || "No messages yet"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--tifawin-neutral-700)]">
                        {formatConversationTime(conversation.updatedAt)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <Card className={`rounded-[1.75rem] border-white/80 bg-white shadow-[var(--shadow-card)] ${selectedId ? "" : "min-h-[32rem]"}`}>
          {selectedId && (
            <div className="border-b border-gray-200/80 px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-gray-300 xl:hidden"
                    onClick={() => setSearchParams({})}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <UserAvatar
                    imageUrl={selectedConversation ? getUserImage(selectedConversation.otherUser) : null}
                    label={selectedConversation ? getOtherUserName(selectedConversation.otherUser) : "Conversation"}
                    sizeClassName="h-12 w-12"
                  />
                  <div>
                    <div className="font-semibold text-[var(--tifawin-neutral-900)]">
                      {selectedConversation ? getOtherUserName(selectedConversation.otherUser) : "Conversation"}
                    </div>
                    <div className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                      {selectedConversation?.otherUser.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!selectedId ? (
            <div className="flex h-full min-h-[32rem] flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--tifawin-neutral-50)]">
                <MessageSquare className="h-7 w-7 text-[var(--tifawin-neutral-700)]" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-[var(--tifawin-neutral-900)]">
                Select a conversation
              </h2>
              <p className="mt-2 max-w-md text-sm text-[var(--tifawin-neutral-700)]">
                Choose a conversation from the list to read messages and reply in real time. If you do not have one yet, start from a job page or your applicants list.
              </p>
            </div>
          ) : loadingThread ? (
            <div className="space-y-4 px-5 py-6 sm:px-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <Skeleton className="h-20 w-[70%] rounded-3xl" />
                </div>
              ))}
            </div>
          ) : thread ? (
            <>
              <div className="space-y-4 px-5 py-6 sm:px-6">
                {thread.messages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-[var(--tifawin-neutral-50)] px-5 py-10 text-center">
                    <div className="text-base font-semibold text-[var(--tifawin-neutral-900)]">
                      No messages yet
                    </div>
                    <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
                      Send the first message to start this conversation.
                    </p>
                  </div>
                ) : (
                  thread.messages.map((message) => {
                    const isMine = message.senderUserId === currentUserId;
                    const sender = isMine ? currentUser : thread.otherUser;
                    const senderLabel = sender ? getUserDisplayName(sender) : "User";

                    return (
                      <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`flex max-w-[85%] items-end gap-3 sm:max-w-[70%] ${isMine ? "flex-row-reverse" : ""}`}>
                          <UserAvatar
                            imageUrl={sender ? getUserImage(sender) : null}
                            label={senderLabel}
                            sizeClassName="h-9 w-9"
                            textClassName="text-xs"
                          />
                          <div
                            className={`rounded-[1.5rem] px-4 py-3 shadow-sm ${
                              isMine
                                ? "bg-[linear-gradient(135deg,#0066CC,#0a66c2)] text-white"
                                : "bg-[var(--tifawin-neutral-50)] text-[var(--tifawin-neutral-900)]"
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                            <div
                              className={`mt-2 text-[11px] font-medium ${
                                isMine ? "text-white/80" : "text-[var(--tifawin-neutral-700)]"
                              }`}
                            >
                              {formatMessageTime(message.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-gray-200/80 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Input
                    value={composer}
                    onChange={(event) => setComposer(event.target.value)}
                    placeholder="Write your message..."
                    className="min-h-12 rounded-2xl border-gray-200 bg-[var(--tifawin-neutral-50)]"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    className="rounded-2xl bg-[var(--tifawin-primary)] text-white hover:bg-[var(--tifawin-primary-hover)]"
                    onClick={sendMessage}
                    disabled={sending || !composer.trim()}
                  >
                    <SendHorizonal className="h-4 w-4" />
                    {sending ? "Sending..." : "Send"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[32rem] items-center justify-center px-6 py-16 text-center">
              <div>
                <div className="text-lg font-semibold text-[var(--tifawin-neutral-900)]">
                  Conversation unavailable
                </div>
                <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
                  Try selecting another thread from the list.
                </p>
                <Button variant="outline" className="mt-4 rounded-full border-gray-300" asChild>
                  <Link to="/messages">Refresh workspace</Link>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
