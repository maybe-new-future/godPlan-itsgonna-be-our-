import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, MapPin, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../api/client";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { formatDate, getApiErrorMessage } from "./admin.utils";

type AdminJob = {
  id: string;
  title: string;
  city: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  company: {
    id: string;
    email: string;
    companyProfile: {
      companyName?: string | null;
      city?: string | null;
      sector?: string | null;
    } | null;
  };
  _count: {
    applications: number;
    savedBy: number;
  };
};

type JobsResponse = {
  jobs: AdminJob[];
  page: number;
  totalPages: number;
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [city, setCity] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);

  async function loadJobs(nextPage = page) {
    try {
      setLoading(true);
      const response = await api.get<JobsResponse>("/admin/jobs", {
        params: {
          page: nextPage,
          limit: 12,
          search: search || undefined,
          status: status || undefined,
          city: city || undefined,
        },
      });

      setJobs(response.data.jobs ?? []);
      setPage(response.data.page ?? nextPage);
      setTotalPages(Math.max(1, response.data.totalPages ?? 1));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load jobs"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs(page);
  }, [city, page, search, status]);

  const summary = useMemo(
    () => ({
      visible: jobs.length,
      open: jobs.filter((job) => job.status === "OPEN").length,
      closed: jobs.filter((job) => job.status === "CLOSED").length,
      applications: jobs.reduce((sum, job) => sum + job._count.applications, 0),
    }),
    [jobs]
  );

  function submitFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
    setCity(cityInput.trim());
  }

  async function toggleStatus(job: AdminJob) {
    setActiveAction(`status-${job.id}`);

    try {
      await api.patch(`/admin/jobs/${job.id}/status`, {
        status: job.status === "OPEN" ? "CLOSED" : "OPEN",
      });
      toast.success(job.status === "OPEN" ? "Job closed" : "Job reopened");
      loadJobs(page);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update job status"));
    } finally {
      setActiveAction(null);
    }
  }

  async function deleteJob(job: AdminJob) {
    if (!window.confirm(`Delete "${job.title}"? This action cannot be undone.`)) return;

    setActiveAction(`delete-${job.id}`);

    try {
      await api.delete(`/admin/jobs/${job.id}`);
      toast.success("Job deleted");
      loadJobs(page);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete job"));
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--tifawin-neutral-900)]">
            Manage jobs
          </h2>
          <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)] sm:text-base">
            Oversee publishing status, job activity, and current application volume across the platform.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Visible", summary.visible],
            ["Open", summary.open],
            ["Closed", summary.closed],
            ["Applications", summary.applications],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/80 bg-white px-4 py-3 shadow-[var(--shadow-card)]">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tifawin-neutral-700)]">
                {label}
              </div>
              <div className="mt-2 text-2xl font-bold text-[var(--tifawin-neutral-900)]">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <Card className="rounded-[1.5rem] border-white/80 bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
        <form className="grid gap-3 md:grid-cols-[minmax(0,1.6fr)_180px_180px_auto]" onSubmit={submitFilters}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--tifawin-neutral-700)]" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by job title or company"
              className="h-11 rounded-2xl border-gray-200 bg-[var(--tifawin-neutral-50)] pl-10"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            className="h-11 rounded-2xl border border-gray-200 bg-[var(--tifawin-neutral-50)] px-3 text-sm text-[var(--tifawin-neutral-900)] outline-none"
          >
            <option value="">All status</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>

          <Input
            value={cityInput}
            onChange={(event) => setCityInput(event.target.value)}
            placeholder="Filter by city"
            className="h-11 rounded-2xl border-gray-200 bg-[var(--tifawin-neutral-50)]"
          />

          <Button
            type="submit"
            className="h-11 rounded-2xl bg-[var(--tifawin-primary)] text-white hover:bg-[var(--tifawin-primary-hover)]"
          >
            Apply filters
          </Button>
        </form>
      </Card>

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-5">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-4 h-4 w-52" />
              <Skeleton className="mt-5 h-20 w-full" />
            </Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="rounded-[1.5rem] border-white/80 bg-white p-8 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--tifawin-neutral-50)]">
            <BriefcaseBusiness className="h-6 w-6 text-[var(--tifawin-neutral-700)]" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[var(--tifawin-neutral-900)]">No jobs found</h3>
          <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
            No listings match the current admin filters.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {jobs.map((job) => {
            const companyName = job.company.companyProfile?.companyName || job.company.email;
            const busy = activeAction?.includes(job.id);

            return (
              <Card key={job.id} className="rounded-[1.5rem] border-white/80 bg-white p-5 shadow-[var(--shadow-card)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-[var(--tifawin-neutral-900)]">
                        {job.title}
                      </h3>
                      <Badge
                        className={
                          job.status === "OPEN"
                            ? "border-0 bg-[#009E49]/12 text-[#009E49]"
                            : "border-0 bg-[var(--tifawin-neutral-100)] text-[var(--tifawin-neutral-700)]"
                        }
                      >
                        {job.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">{companyName}</p>
                  </div>

                  <div className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-3 py-2 text-right">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tifawin-neutral-700)]">
                      Applicants
                    </div>
                    <div className="mt-1 text-xl font-bold text-[var(--tifawin-neutral-900)]">
                      {job._count.applications}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tifawin-neutral-700)]">
                      City
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-[var(--tifawin-neutral-900)]">
                      <MapPin className="h-4 w-4 text-[var(--tifawin-neutral-700)]" />
                      {job.city}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tifawin-neutral-700)]">
                      Saved
                    </div>
                    <div className="mt-2 text-xl font-bold text-[var(--tifawin-neutral-900)]">{job._count.savedBy}</div>
                  </div>
                  <div className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tifawin-neutral-700)]">
                      Created
                    </div>
                    <div className="mt-2 text-sm font-medium text-[var(--tifawin-neutral-900)]">
                      {formatDate(job.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    className="rounded-2xl border-gray-200 bg-white text-[var(--tifawin-neutral-900)] hover:bg-[var(--tifawin-neutral-100)]"
                    onClick={() => toggleStatus(job)}
                    disabled={busy}
                  >
                    {job.status === "OPEN" ? "Close job" : "Reopen job"}
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-2xl"
                    onClick={() => deleteJob(job)}
                    disabled={busy}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete job
                  </Button>
                </div>
              </Card>
            );
          })}
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
