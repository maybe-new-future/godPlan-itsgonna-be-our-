import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../api/client";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import {
  formatRelativeTime,
  getNotificationErrorMessage,
  type NotificationItem,
} from "../../components/notifications/notifications.utils";

type NotificationsResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
  page: number;
  totalPages: number;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(nextPage = page) {
    try {
      setLoading(true);
      const response = await api.get<NotificationsResponse>("/notifications", {
        params: { page: nextPage, limit: 12 },
      });
      setItems(response.data.notifications ?? []);
      setUnreadCount(response.data.unreadCount ?? 0);
      setPage(response.data.page ?? nextPage);
      setTotalPages(Math.max(1, response.data.totalPages ?? 1));
    } catch (error) {
      toast.error(getNotificationErrorMessage(error, "Failed to load notifications"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page);
  }, [page]);

  async function markOneAsRead(notification: NotificationItem) {
    if (notification.isRead) return;
    setBusyId(notification.id);

    try {
      await api.patch(`/notifications/${notification.id}/read`);
      setItems((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((current) => Math.max(0, current - 1));
      toast.success("Notification marked as read");
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
    <div className="page-container space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white px-6 py-7 shadow-[var(--shadow-card-hover)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,102,204,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,209,0,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(0,158,73,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(225,29,72,0.10),transparent_24%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--tifawin-primary)]/10 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--tifawin-primary)]">
              <span className="h-2 w-2 rounded-full bg-[var(--tifawin-primary)] animate-pulse" />
              Activity stream
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--tifawin-neutral-900)] sm:text-4xl">
                Notifications
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[var(--tifawin-neutral-700)] sm:text-base">
                Review the latest platform activity and keep your Tifawin workspace up to date.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="rounded-full border-gray-300 text-[var(--tifawin-neutral-700)] hover:bg-[var(--tifawin-neutral-100)]"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="tifawin-stat-card p-5">
          <div className="inline-flex rounded-full bg-[#0066CC]/10 px-3 py-1 text-xs font-semibold text-[#0066CC]">
            Unread
          </div>
          <div className="mt-4 text-3xl font-bold text-[var(--tifawin-neutral-900)]">
            {unreadCount.toLocaleString()}
          </div>
          <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">Notifications needing your attention.</p>
        </Card>
      </section>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="p-5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-28" />
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="rounded-[1.75rem] border-white/80 bg-white p-10 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--tifawin-neutral-50)]">
            <Bell className="h-7 w-7 text-[var(--tifawin-neutral-700)]" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-[var(--tifawin-neutral-900)]">No notifications yet</h2>
          <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
            When something important happens, you will see it here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`rounded-[1.5rem] p-5 ${
                item.isRead
                  ? "border-white/80 bg-white"
                  : "border-[var(--tifawin-primary)]/10 bg-[linear-gradient(135deg,rgba(10,102,194,0.05),rgba(255,255,255,0.96))]"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-[var(--tifawin-neutral-900)]">{item.title}</h2>
                    {!item.isRead && (
                      <Badge className="border-0 bg-[#0066CC]/10 text-[#0066CC]">Unread</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--tifawin-neutral-700)]">{item.message}</p>
                  <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tifawin-neutral-700)]">
                    {formatRelativeTime(item.createdAt)}
                  </div>
                </div>

                {!item.isRead && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-gray-300 text-[var(--tifawin-neutral-700)] hover:bg-white"
                    onClick={() => markOneAsRead(item)}
                    disabled={busyId === item.id}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/80 bg-white p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[var(--tifawin-neutral-700)]">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-2xl border-gray-200 bg-white"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl border-gray-200 bg-white"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
