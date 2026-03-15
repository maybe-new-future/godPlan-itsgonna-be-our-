import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../api/client";
import { getRoleFromToken, isLoggedIn } from "../../auth/auth";
import UserAvatar from "../../components/shared/UserAvatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";

type Job = {
  id: string;
  title: string;
  city?: string | null;
  contractType?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  createdAt?: string;
  company?: {
    id: string;
    companyProfile?: {
      companyName?: string | null;
      logoUrl?: string | null;
    } | null;
  } | null;
};

type SavedJobItem = {
  id: string;
  job: {
    id: string;
  };
};

function formatSalary(job: Job) {
  if (job.salaryMin == null && job.salaryMax == null) return "Salary not specified";
  return `${job.salaryMin ?? "-"} - ${job.salaryMax ?? "-"} TND`;
}

function formatPostedDate(createdAt?: string) {
  if (!createdAt) return "Recently posted";
  const date = new Date(createdAt);
  const diff = Date.now() - date.getTime();
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  if (days < 7) return `Posted ${days} days ago`;
  return `Posted ${date.toLocaleDateString()}`;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [contractType, setContractType] = useState("");

  const [appliedQ, setAppliedQ] = useState("");
  const [appliedCity, setAppliedCity] = useState("");
  const [appliedContractType, setAppliedContractType] = useState("");

  const loggedIn = isLoggedIn();
  const role = getRoleFromToken();
  const canSave = loggedIn && role === "CANDIDATE";

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/jobs", {
        params: {
          page,
          limit: 10,
          q: appliedQ || undefined,
          city: appliedCity || undefined,
          contractType: appliedContractType || undefined,
        },
      });

      setJobs(res.data.jobs ?? []);
      setTotalPages(res.data.totalPages ?? 1);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load jobs. Check backend + CORS.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function loadSavedJobs() {
    if (!canSave) {
      setSavedJobIds([]);
      return;
    }

    try {
      const res = await api.get("/me/saved-jobs");
      const ids = (res.data.savedJobs ?? []).map((item: SavedJobItem) => item.job.id);
      setSavedJobIds(ids);
    } catch {
      setSavedJobIds([]);
    }
  }

  async function handleSave(jobId: string) {
    try {
      setSavingJobId(jobId);
      await api.post(`/jobs/${jobId}/save`);
      setSavedJobIds((current) => [...current, jobId]);
      toast.success("Job saved");
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || "Failed to save job";

      if (status === 409) {
        setSavedJobIds((current) =>
          current.includes(jobId) ? current : [...current, jobId]
        );
        toast.info("Job already saved");
        return;
      }

      toast.error(msg);
    } finally {
      setSavingJobId(null);
    }
  }

  async function handleUnsave(jobId: string) {
    try {
      setSavingJobId(jobId);
      await api.delete(`/jobs/${jobId}/save`);
      setSavedJobIds((current) => current.filter((id) => id !== jobId));
      toast.success("Job removed from saved jobs");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to remove saved job";
      toast.error(msg);
    } finally {
      setSavingJobId(null);
    }
  }

  function applyFilters() {
    setPage(1);
    setAppliedQ(q.trim());
    setAppliedCity(city.trim());
    setAppliedContractType(contractType.trim());
  }

  function clearFilters() {
    setQ("");
    setCity("");
    setContractType("");

    setAppliedQ("");
    setAppliedCity("");
    setAppliedContractType("");
    setPage(1);
  }

  useEffect(() => {
    load();
  }, [page, appliedQ, appliedCity, appliedContractType]);

  useEffect(() => {
    loadSavedJobs();
  }, [canSave]);

  return (
    <div className="page-container space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 px-5 py-6 shadow-[var(--shadow-card-hover)] backdrop-blur sm:px-7 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,102,204,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(255,209,0,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(0,158,73,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(225,29,72,0.12),transparent_24%)]" />

        <div className="relative space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--tifawin-primary)]/15 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--tifawin-primary)] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[var(--tifawin-primary)] animate-pulse" />
                Tifawin opportunities
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[var(--tifawin-neutral-900)] sm:text-4xl">
                  Find your next opportunity
                </h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-[var(--tifawin-neutral-700)] sm:text-lg">
                  Discover jobs across Tunisia with a modern search experience rooted in the Amazigh spirit of Tifawin.
                </p>
              </div>
            </div>

            <div className="amazigh-dots amazigh-dots--section self-start lg:self-auto" aria-hidden>
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/80 bg-white/88 p-3 shadow-[var(--shadow-card)] backdrop-blur-sm sm:p-4">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.5fr_1fr_1fr_auto] xl:items-center">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Job title, keyword, skill..."
                className="h-12 rounded-2xl border-gray-200 bg-[var(--tifawin-neutral-50)] px-4 text-[15px] transition-all focus:border-[var(--tifawin-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--tifawin-primary)]/10"
              />
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="h-12 rounded-2xl border-gray-200 bg-[var(--tifawin-neutral-50)] px-4 text-[15px] transition-all focus:border-[var(--tifawin-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--tifawin-primary)]/10"
              />
              <Input
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                placeholder="Contract type"
                className="h-12 rounded-2xl border-gray-200 bg-[var(--tifawin-neutral-50)] px-4 text-[15px] transition-all focus:border-[var(--tifawin-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--tifawin-primary)]/10"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:justify-end">
                <Button
                  className="h-12 w-full rounded-2xl bg-[var(--tifawin-primary)] px-6 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--tifawin-primary-hover)] hover:shadow-md"
                  onClick={applyFilters}
                  disabled={loading}
                >
                  Search jobs
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-2xl border-gray-300 px-5 text-[var(--tifawin-neutral-700)] transition-all hover:border-[var(--tifawin-primary)]/25 hover:bg-white"
                  onClick={clearFilters}
                  disabled={loading}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading && (
        <div className="py-12 text-center text-sm text-[var(--tifawin-neutral-700)]">
          Loading...
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50/50 p-5">
          <div className="font-semibold text-red-700">Something went wrong</div>
          <div className="mt-1 text-sm text-red-600">{error}</div>
          <Button
            variant="outline"
            className="mt-4 rounded-full border-red-300 text-red-700 hover:bg-red-100"
            onClick={load}
          >
            Try again
          </Button>
        </Card>
      )}

      {!loading && !error && jobs.length === 0 && (
        <Card className="rounded-[1.6rem] border-gray-200 bg-white p-8 text-center shadow-[var(--shadow-card)]">
          <div className="font-semibold text-[var(--tifawin-neutral-900)]">No jobs found</div>
          <div className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
            Try adjusting your filters or search for another profession.
          </div>
        </Card>
      )}

      {!loading && !error && jobs.length > 0 && (
        <>
          <section className="space-y-4">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-[var(--tifawin-neutral-700)]">
                {jobs.length} job{jobs.length !== 1 ? "s" : ""} on this page
              </p>
              <div className="amazigh-dots amazigh-dots--section" aria-hidden>
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>

            <ul className="space-y-4">
              {jobs.map((job) => {
                const isSaved = savedJobIds.includes(job.id);
                const salary = formatSalary(job);
                const posted = formatPostedDate(job.createdAt);
                const companyName =
                  job.company?.companyProfile?.companyName?.trim() || "Tifawin partner company";
                const companyLogoUrl = job.company?.companyProfile?.logoUrl ?? null;

                return (
                  <li key={job.id}>
                    <Card className="group overflow-hidden rounded-[1.7rem] border border-white/80 bg-white/95 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-card-hover)]">
                      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_250px]">
                        <div className="p-5 sm:p-6">
                          <div className="flex items-start gap-4">
                            <UserAvatar
                              imageUrl={companyLogoUrl}
                              label={companyName}
                              sizeClassName="h-14 w-14"
                              textClassName="text-base"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="truncate text-xl font-bold tracking-tight text-[var(--tifawin-neutral-900)] transition-colors duration-200 group-hover:text-[var(--tifawin-primary)] sm:text-[1.35rem]">
                                    {job.title}
                                  </h3>
                                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--tifawin-neutral-700)]">
                                    <span className="font-medium text-[var(--tifawin-neutral-800)]">{companyName}</span>
                                    <span className="text-[var(--tifawin-neutral-400)]">•</span>
                                    <span>{job.city ?? "Tunisia"}</span>
                                    <span className="text-[var(--tifawin-neutral-400)]">•</span>
                                    <span>{posted}</span>
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-[var(--tifawin-primary)]/10 bg-[var(--tifawin-neutral-50)] px-4 py-3 text-right shadow-sm">
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--tifawin-neutral-700)]">
                                    Salary range
                                  </div>
                                  <div className="mt-1 text-sm font-bold text-[var(--tifawin-neutral-900)] sm:text-base">
                                    {salary}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                <Badge className="rounded-full border-0 bg-[#0066CC]/10 px-3 py-1 text-xs font-semibold text-[#0066CC]">
                                  {job.contractType ?? "Open role"}
                                </Badge>
                                <Badge className="rounded-full border-0 bg-[#FFD100]/30 px-3 py-1 text-xs font-semibold text-[#8a6a00]">
                                  Tunisia
                                </Badge>
                                <Badge className="rounded-full border-0 bg-[#009E49]/12 px-3 py-1 text-xs font-semibold text-[#009E49]">
                                  Functional MVP
                                </Badge>
                                {isSaved && (
                                  <Badge className="rounded-full border-0 bg-[#E11D48]/10 px-3 py-1 text-xs font-semibold text-[#E11D48]">
                                    Saved
                                  </Badge>
                                )}
                              </div>

                              <div className="mt-5 flex flex-col items-start gap-3 text-sm text-[var(--tifawin-neutral-700)] sm:flex-row sm:flex-wrap sm:items-center">
                                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--tifawin-neutral-50)] px-3 py-1.5">
                                  <span className="h-2 w-2 rounded-full bg-[var(--tifawin-primary)]" />
                                  Modern hiring flow
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--tifawin-neutral-50)] px-3 py-1.5">
                                  <span className="h-2 w-2 rounded-full bg-[var(--tifawin-success)]" />
                                  Fast application process
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between gap-4 border-t border-dashed border-[var(--tifawin-primary)]/10 bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,0.98))] p-5 lg:border-l lg:border-t-0">
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--tifawin-neutral-700)]">
                              Quick actions
                            </div>
                            <p className="mt-2 text-sm leading-6 text-[var(--tifawin-neutral-700)]">
                              Review the role details, keep it in your saved list, and come back anytime.
                            </p>
                          </div>

                          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                            <Button
                              asChild
                              className="h-11 rounded-2xl bg-[var(--tifawin-primary)] text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--tifawin-primary-hover)]"
                            >
                              <Link to={`/jobs/${job.id}`}>View details</Link>
                            </Button>

                            {canSave && (
                              <Button
                                type="button"
                                variant="outline"
                                className="h-11 rounded-2xl border-gray-300 text-[var(--tifawin-neutral-700)] transition-all hover:border-[var(--tifawin-success)]/30 hover:bg-[var(--tifawin-success)]/5"
                                onClick={() => (isSaved ? handleUnsave(job.id) : handleSave(job.id))}
                                disabled={savingJobId === job.id}
                              >
                                {savingJobId === job.id
                                  ? "Saving..."
                                  : isSaved
                                  ? "Remove from saved"
                                  : "Save for later"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>

          {totalPages > 1 && (
            <section className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <p className="text-sm text-[var(--tifawin-neutral-700)]">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-full border-gray-300 text-[var(--tifawin-neutral-700)]"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-gray-300 text-[var(--tifawin-neutral-700)]"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
