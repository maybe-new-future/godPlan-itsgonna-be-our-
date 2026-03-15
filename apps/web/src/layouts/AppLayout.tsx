import { Link, Outlet, useLocation } from "react-router-dom";
import { getRoleFromToken } from "../auth/auth";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import MessagesNavButton from "../components/messages/MessagesNavButton";
import NotificationsBell from "../components/notifications/NotificationsBell";

type NavItem = {
  to?: string;
  label: string;
  mobileOnly?: boolean;
  desktopOnly?: boolean;
  accent?: "primary";
  onClick?: () => void;
};

export default function AppLayout() {
  const location = useLocation();
  const [token, setToken] = useState<string | null>(localStorage.getItem("accessToken"));
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("accessToken"));
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const loggedIn = !!token;
  const role = loggedIn ? getRoleFromToken() : null;

  function signOut() {
    localStorage.removeItem("accessToken");
    setToken(null);
    window.location.href = "/jobs";
  }

  const navItems = useMemo<NavItem[]>(() => {
    const common: NavItem[] = [{ to: "/jobs", label: "Jobs" }];

    if (!loggedIn) {
      return [
        ...common,
        { to: "/login", label: "Sign in" },
        { to: "/register", label: "Join now", accent: "primary" },
      ];
    }

    if (role === "CANDIDATE") {
      return [
        ...common,
        { to: "/candidate/dashboard", label: "Dashboard" },
        { to: "/candidate/profile", label: "Profile" },
        { to: "/candidate/applications", label: "Applications" },
        { to: "/candidate/saved-jobs", label: "Saved" },
        { to: "/messages", label: "Messages", mobileOnly: true },
        { to: "/notifications", label: "Notifications", mobileOnly: true },
        { label: "Sign out", onClick: signOut },
      ];
    }

    if (role === "COMPANY") {
      return [
        ...common,
        { to: "/company/dashboard", label: "Dashboard" },
        { to: "/company/profile", label: "Company" },
        { to: "/company/jobs", label: "My Jobs" },
        { to: "/company/jobs/new", label: "Post a job", accent: "primary" },
        { to: "/messages", label: "Messages", mobileOnly: true },
        { to: "/notifications", label: "Notifications", mobileOnly: true },
        { label: "Sign out", onClick: signOut },
      ];
    }

    if (role === "ADMIN") {
      return [
        ...common,
        { to: "/admin/dashboard", label: "Admin" },
        { to: "/notifications", label: "Notifications", mobileOnly: true },
        { label: "Sign out", onClick: signOut },
      ];
    }

    return [...common, { label: "Sign out", onClick: signOut }];
  }, [loggedIn, role]);

  function renderNavItem(item: NavItem, mobile = false) {
    const sharedClass = cn(
      "transition-all duration-200",
      mobile
        ? "flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold"
        : "rounded-full px-3 py-2 text-sm font-medium",
      item.accent === "primary"
        ? "bg-[var(--tifawin-primary)] text-white shadow-sm hover:-translate-y-0.5 hover:bg-[var(--tifawin-primary-hover)] hover:shadow-md"
        : "text-[var(--tifawin-neutral-700)] hover:bg-[var(--tifawin-neutral-100)] hover:text-[var(--tifawin-primary)]"
    );

    if (item.onClick) {
      return (
        <button
          key={`${item.label}-${mobile ? "mobile" : "desktop"}`}
          type="button"
          className={sharedClass}
          onClick={() => {
            item.onClick?.();
            setMobileOpen(false);
          }}
        >
          {item.label}
        </button>
      );
    }

    return (
      <Link
        key={`${item.label}-${mobile ? "mobile" : "desktop"}`}
        to={item.to ?? "/jobs"}
        className={sharedClass}
        onClick={() => setMobileOpen(false)}
      >
        {item.label}
      </Link>
    );
  }

  const desktopItems = navItems.filter((item) => !item.mobileOnly);
  const mobileItems = navItems.filter((item) => !item.desktopOnly);

  return (
    <div className="min-h-screen bg-[var(--tifawin-neutral-50)] flex flex-col">
      <header
        className={`sticky top-0 z-50 bg-white/95 backdrop-blur transition-all duration-300 ${
          scrolled
            ? "border-b border-gray-200/80 shadow-[var(--shadow-card-hover)]"
            : "border-b border-gray-200/70 shadow-[var(--shadow-card)]"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex min-h-16 items-center justify-between gap-3 py-2">
            <Link
              to="/jobs"
              className="flex min-w-0 items-center gap-3 text-[var(--tifawin-neutral-900)] transition-transform duration-200 hover:scale-[1.01]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(0,102,204,0.12),rgba(0,158,73,0.16),rgba(255,209,0,0.22),rgba(225,29,72,0.14))] shadow-sm ring-1 ring-black/5">
                <span className="text-lg font-black text-[var(--tifawin-primary)]">ⵣ</span>
              </div>
              <div className="min-w-0">
                <div className="truncate text-base font-bold tracking-tight sm:text-lg">Tifawin</div>
                <div className="truncate text-[10px] uppercase tracking-[0.22em] text-[var(--tifawin-neutral-700)] sm:text-[11px]">
                  Tunisia jobs
                </div>
              </div>
            </Link>

            <div className="hidden items-center gap-1.5 lg:flex lg:flex-wrap lg:justify-end">
              {loggedIn && role !== "ADMIN" && <MessagesNavButton />}
              {loggedIn && <NotificationsBell />}
              {desktopItems.map((item) => renderNavItem(item))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-2xl border-gray-200 bg-white lg:hidden"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              <span className="text-lg leading-none">{mobileOpen ? "✕" : "☰"}</span>
            </Button>
          </nav>

          {mobileOpen && (
            <div className="pb-4 lg:hidden">
              <div className="grid gap-2 rounded-[1.5rem] border border-white/80 bg-white/92 p-3 shadow-[var(--shadow-card-hover)] backdrop-blur">
                {mobileItems.map((item) => renderNavItem(item, true))}
              </div>
            </div>
          )}
        </div>
        <div className="amazigh-strip h-1 w-full" aria-hidden />
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
