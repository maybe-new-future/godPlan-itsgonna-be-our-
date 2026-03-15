import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { SectionHeader } from "../../components/ui/section-header";
import { toast } from "sonner";

type SavedJobItem = {
  id: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    city?: string | null;
    contractType?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    status?: "OPEN" | "CLOSED";
    createdAt?: string;
  };
};

function SavedJobsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="p-6 space-y-4">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingJobId, setRemovingJobId] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/me/saved-jobs");
      setSavedJobs(res.data.savedJobs ?? []);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load saved jobs"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsave(jobId: string) {
    try {
      setRemovingJobId(jobId);
      await api.delete(`/jobs/${jobId}/save`);
      setSavedJobs((current) => current.filter((item) => item.job.id !== jobId));
      toast.success("Job removed from saved jobs");
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to remove saved job"
      );
    } finally {
      setRemovingJobId(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page-container space-y-8">
      <SectionHeader
        title="Saved jobs"
        description="Keep track of roles you want to revisit before applying."
      />

      {loading ? <SavedJobsSkeleton /> : null}

      {!loading && savedJobs.length === 0 && (
        <Card className="p-6 text-center sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#009E49]/10 text-xl text-[#009E49]">
            ★
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[var(--tifawin-neutral-900)]">No saved jobs yet</h3>
          <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
            Save interesting opportunities from the jobs page and review them later.
          </p>
          <div className="mt-5">
            <Button asChild className="rounded-full bg-[var(--tifawin-primary)] text-white hover:bg-[var(--tifawin-primary-hover)]">
              <Link to="/jobs">Explore jobs</Link>
            </Button>
          </div>
        </Card>
      )}

      {!loading && savedJobs.length > 0 && (
        <ul className="space-y-3">
          {savedJobs.map((item) => (
            <li key={item.id}>
              <Card className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-semibold text-[var(--tifawin-neutral-900)]">{item.job.title}</h3>
                    <p className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                      {item.job.city ?? "—"}
                      {item.job.contractType ? ` · ${item.job.contractType}` : ""}
                      {item.job.salaryMin != null || item.job.salaryMax != null
                        ? ` · ${item.job.salaryMin ?? "—"} – ${item.job.salaryMax ?? "—"} TND`
                        : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.job.contractType ? <Badge className="border-0 bg-[var(--tifawin-primary)]/10 text-[var(--tifawin-primary)]">{item.job.contractType}</Badge> : null}
                      <Badge className={item.job.status === "CLOSED" ? "border-0 bg-red-100 text-red-700" : "border-0 bg-[var(--tifawin-success)]/10 text-[var(--tifawin-success)]"}>
                        {item.job.status ?? "OPEN"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-[var(--tifawin-neutral-700)]">Saved {new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row lg:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full rounded-full border-gray-300 sm:w-auto"
                      onClick={() => handleUnsave(item.job.id)}
                      disabled={removingJobId === item.job.id}
                    >
                      {removingJobId === item.job.id ? "Working..." : "Unsave"}
                    </Button>
                    <Button
                      asChild
                      size="default"
                      className="w-full rounded-full bg-[var(--tifawin-primary)] text-white hover:bg-[var(--tifawin-primary-hover)] sm:w-auto"
                    >
                      <Link to={`/jobs/${item.job.id}`}>View job</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
