import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, BriefcaseBusiness, LayoutDashboard, Menu, Users, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";

type AdminNavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
};

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = useMemo<AdminNavItem[]>(
    () => [
      { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/jobs", label: "Jobs", icon: BriefcaseBusiness },
    ],
    []
  );

  function signOut() {
    localStorage.removeItem("accessToken");
    navigate("/jobs", { replace: true });
  }

  function renderNavLink(item: AdminNavItem) {
    const active = location.pathname === item.to;
    const Icon = item.icon;

    return (
      <Link
        key={item.to}
        to={item.to}
        className={cn(
          "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
          active
            ? "bg-[linear-gradient(135deg,rgba(10,102,194,0.10),rgba(0,158,73,0.10),rgba(255,209,0,0.14))] text-[var(--tifawin-neutral-900)] shadow-[var(--shadow-card)] ring-1 ring-[var(--tifawin-primary)]/10"
            : "text-[var(--tifawin-neutral-700)] hover:bg-white hover:text-[var(--tifawin-neutral-900)]"
        )}
      >
        <Icon className={cn("h-4 w-4", active ? "text-[var(--tifawin-primary)]" : "text-[var(--tifawin-neutral-700)]")} />
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#edf3f6_0%,#f7fafb_36%,#f3f6f8_100%)]">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,248,250,0.92))] lg:flex lg:flex-col">
          <div className="flex items-center gap-3 border-b border-gray-200/80 px-6 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(0,102,204,0.12),rgba(0,158,73,0.16),rgba(255,209,0,0.22),rgba(225,29,72,0.14))] shadow-sm ring-1 ring-black/5">
              <BarChart3 className="h-5 w-5 text-[var(--tifawin-primary)]" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--tifawin-neutral-700)]">
                Admin
              </div>
              <div className="truncate text-lg font-bold text-[var(--tifawin-neutral-900)]">
                Tifawin Ops
              </div>
            </div>
          </div>

          <div className="flex-1 px-4 py-5">
            <div className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--tifawin-neutral-700)]">
              Operations
            </div>
            <nav className="space-y-2">{navItems.map(renderNavLink)}</nav>
          </div>

          <div className="border-t border-gray-200/80 px-4 py-4">
            <div className="mb-3 rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-4 text-sm text-[var(--tifawin-neutral-700)]">
              Administrative control for users, jobs, and platform health.
            </div>
            <Button
              variant="outline"
              className="w-full rounded-2xl border-gray-200 bg-white text-[var(--tifawin-neutral-900)] hover:bg-[var(--tifawin-neutral-100)]"
              onClick={signOut}
            >
              Sign out
            </Button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-white/80 bg-white/92 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--tifawin-neutral-700)]">
                  Tifawin Admin
                </div>
                <h1 className="text-xl font-bold tracking-tight text-[var(--tifawin-neutral-900)]">
                  Platform operations
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-[var(--tifawin-primary)]/10 bg-[var(--tifawin-neutral-50)] px-3 py-1.5 text-xs font-medium text-[var(--tifawin-neutral-700)] sm:flex">
                  <span className="h-2 w-2 rounded-full bg-[var(--tifawin-success)]" />
                  Admin session
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-2xl border-gray-200 bg-white lg:hidden"
                  onClick={() => setMobileOpen((value) => !value)}
                  aria-label={mobileOpen ? "Close admin menu" : "Open admin menu"}
                >
                  {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="amazigh-strip h-1 w-full" aria-hidden />
          </header>

          {mobileOpen && (
            <div className="border-b border-white/70 bg-white/96 px-4 py-4 backdrop-blur lg:hidden">
              <nav className="space-y-2">{navItems.map(renderNavLink)}</nav>
              <Button
                variant="outline"
                className="mt-3 w-full rounded-2xl border-gray-200 bg-white text-[var(--tifawin-neutral-900)] hover:bg-[var(--tifawin-neutral-100)]"
                onClick={signOut}
              >
                Sign out
              </Button>
            </div>
          )}

          <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
