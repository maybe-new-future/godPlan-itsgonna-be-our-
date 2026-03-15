import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { Building2, FileText, FolderOpen, BriefcaseBusiness, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "./admin.utils";

type AdminStats = {
  totalUsers: number;
  totalCompanies: number;
  totalJobs: number;
  totalApplications: number;
  activeUsers: number;
  openJobs: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const response = await api.get("/admin/stats");
        setStats(response.data);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to load admin dashboard"));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const cards = useMemo(
    () => [
      { label: "Total users", value: stats?.totalUsers ?? 0, icon: Users, tone: "bg-[#0066CC]/10 text-[#0066CC]" },
      { label: "Companies", value: stats?.totalCompanies ?? 0, icon: Building2, tone: "bg-[#009E49]/10 text-[#009E49]" },
      { label: "Total jobs", value: stats?.totalJobs ?? 0, icon: BriefcaseBusiness, tone: "bg-[#FFD100]/30 text-[#8A6A00]" },
      { label: "Applications", value: stats?.totalApplications ?? 0, icon: FileText, tone: "bg-[#E11D48]/10 text-[#E11D48]" },
      { label: "Active users", value: stats?.activeUsers ?? 0, icon: UserCheck, tone: "bg-[var(--tifawin-neutral-100)] text-[var(--tifawin-neutral-900)]" },
      { label: "Open jobs", value: stats?.openJobs ?? 0, icon: FolderOpen, tone: "bg-[#009E49]/12 text-[#046338]" },
    ],
    [stats]
  );

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white px-6 py-6 shadow-[var(--shadow-card)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,102,204,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,209,0,0.14),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(0,158,73,0.08),transparent_26%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--tifawin-primary)]/10 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--tifawin-primary)]">
              <span className="h-2 w-2 rounded-full bg-[var(--tifawin-primary)]" />
              Operations overview
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--tifawin-neutral-900)] sm:text-3xl">
              Administrative dashboard
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--tifawin-neutral-700)] sm:text-base">
              Monitor marketplace health, user activity, and job flow from a single operational workspace.
            </p>
          </div>
          <div className="amazigh-dots amazigh-dots--section" aria-hidden>
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      {loading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-5">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="mt-5 h-10 w-20" />
              <Skeleton className="mt-3 h-4 w-40" />
            </Card>
          ))}
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.label} className="tifawin-stat-card border-white/90 bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.tone}`}>
                      {item.label}
                    </div>
                    <div className="rounded-2xl bg-[var(--tifawin-neutral-50)] p-2.5 text-[var(--tifawin-neutral-700)]">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-3xl font-bold tracking-tight text-[var(--tifawin-neutral-900)]">
                    {item.value.toLocaleString()}
                  </CardTitle>
                  <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
                    Live snapshot from the admin backend.
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
