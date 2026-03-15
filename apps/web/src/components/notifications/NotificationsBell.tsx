import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../api/client";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import {
  formatRelativeTime,
  getNotificationErrorMessage,
  type NotificationItem,
} from "./notifications.utils";

type NotificationsResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  async function loadUnreadCount() {
    try {
      const response = await api.get("/notifications/unread-count");
      setUnreadCount(response.data?.unreadCount ?? 0);
    } catch {
      // keep navbar stable if polling fails
    }
  }

  async function loadNotifications() {
    try {
      setLoading(true);
      const response = await api.get<NotificationsResponse>("/notifications", {
        params: { page: 1, limit: 6 },
      });
      setItems(response.data.notifications ?? []);
      setUnreadCount(response.data.unreadCount ?? 0);
    } catch (error) {
      toast.error(getNotificationErrorMessage(error, "Failed to load notifications"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUnreadCount();
  }, []);

  useEffect(() => {
    if (!open) return;
    loadNotifications();
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function markOneAsRead(notification: NotificationItem) {
    if (notification.isRead) return;

    setBusyId(notification.id);

    try {
      await api.patch(`/notifications/${notification.id}/read`);
      setItems((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      toast.error(getNotificationErrorMessage(error, "Failed to update notification"));
    } finally {
      setBusyId(null);
    }
  }

  async function markAllAsRead() {
    try {
      await api.patch("/notifications/read-all");
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(getNotificationErrorMessage(error, "Failed to mark notifications as read"));
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="relative h-11 w-11 rounded-2xl border-gray-200 bg-white"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open notifications"
      >
        <Bell className="h-4 w-4 text-[var(--tifawin-neutral-700)]" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#E11D48] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(92vw,24rem)] overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/96 shadow-[var(--shadow-card-hover)] backdrop-blur">
          <div className="border-b border-gray-200/80 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-[var(--tifawin-neutral-900)]">Notifications</div>
                <div className="mt-1 text-xs text-[var(--tifawin-neutral-700)]">
                  Stay on top of new activity across your Tifawin workspace.
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-xl px-2.5 text-[var(--tifawin-primary)] hover:bg-[var(--tifawin-neutral-50)]"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Mark all</span>
              </Button>
            </div>
          </div>

          <div className="max-h-[24rem] overflow-y-auto p-3">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-2xl bg-[var(--tifawin-neutral-50)] p-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-3 h-4 w-full" />
                    <Skeleton className="mt-2 h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[var(--tifawin-neutral-50)] px-5 py-8 text-center">
                <div className="text-base font-semibold text-[var(--tifawin-neutral-900)]">No notifications yet</div>
                <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
                  When something important happens, you will see it here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border px-4 py-4 transition-all ${
                      item.isRead
                        ? "border-transparent bg-[var(--tifawin-neutral-50)]"
                        : "border-[var(--tifawin-primary)]/10 bg-[linear-gradient(135deg,rgba(10,102,194,0.06),rgba(255,255,255,0.95))]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm font-semibold text-[var(--tifawin-neutral-900)]">
                            {item.title}
                          </div>
                          {!item.isRead && (
                            <Badge className="border-0 bg-[#0066CC]/10 text-[#0066CC]">New</Badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--tifawin-neutral-700)]">
                          {item.message}
                        </p>
                        <div className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--tifawin-neutral-700)]">
                          {formatRelativeTime(item.createdAt)}
                        </div>
                      </div>

                      {!item.isRead && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="shrink-0 rounded-xl px-2 text-[var(--tifawin-primary)] hover:bg-white"
                          onClick={() => markOneAsRead(item)}
                          disabled={busyId === item.id}
                        >
                          Read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200/80 px-4 py-3">
            <Link
              to="/notifications"
              className="block rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-3 text-center text-sm font-semibold text-[var(--tifawin-primary)] transition-colors hover:bg-white"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
