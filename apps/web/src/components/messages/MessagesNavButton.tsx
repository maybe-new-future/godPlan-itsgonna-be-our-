import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { api } from "../../api/client";

export default function MessagesNavButton() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await api.get("/messages/unread-count");
        if (!cancelled) {
          setUnreadCount(response.data?.unreadCount ?? 0);
        }
      } catch {
        if (!cancelled) {
          setUnreadCount(0);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      to="/messages"
      className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white transition-colors hover:bg-[var(--tifawin-neutral-100)]"
      aria-label="Open messages"
    >
      <MessageSquare className="h-4 w-4 text-[var(--tifawin-neutral-700)]" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#E11D48] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
