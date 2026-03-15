import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";

type Job = {
  id: string;
  title: string;
  city?: string | null;
  contractType?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  status?: "OPEN" | "CLOSED";
};

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/me/jobs");
      setJobs(res.data.jobs ?? res.data ?? []);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to load jobs"
      );
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this job?")) return;

    try {
      await api.delete(`/jobs/${id}`);
      toast.success("Job deleted");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Delete failed");
    }
  }

  async function closeJob(id: string) {
    if (!confirm("Close this job? Candidates won’t be able to apply.")) return;

    try {
      await api.post(`/jobs/${id}/close`);
      toast.success("Job closed ✅");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Close failed");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page-container space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <section>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--tifawin-neutral-900)] tracking-tight">
            My jobs
          </h1>
          <p className="mt-1 text-[var(--tifawin-neutral-700)]">
            Manage your job postings
          </p>
        </section>
        <Button asChild className="rounded-full bg-[var(--tifawin-primary)] hover:bg-[var(--tifawin-primary-hover)] text-white font-semibold px-5 shadow-sm">
          <Link to="/company/jobs/new">Post a job</Link>
        </Button>
      </div>

      {loading && (
        <div className="py-12 text-center text-sm text-[var(--tifawin-neutral-700)]">
          Loading…
        </div>
      )}

      {jobs.length === 0 && !loading && (
        <Card className="p-8 border-gray-200 bg-white shadow-[var(--shadow-card)] rounded-xl">
          <div className="font-semibold text-[var(--tifawin-neutral-900)]">No jobs yet</div>
          <div className="text-sm text-[var(--tifawin-neutral-700)] mt-1">
            You haven’t created any jobs yet. Post your first job to get started.
          </div>
        </Card>
      )}

      {jobs.length > 0 && !loading && (
        <ul className="space-y-3">
          {jobs.map((j) => (
            <li key={j.id}>
              <Card className="p-4 sm:p-5 bg-white border border-gray-200/80 shadow-[var(--shadow-card)] rounded-xl hover:shadow-[var(--shadow-card-hover)] transition-shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[var(--tifawin-neutral-900)] truncate">{j.title}</h3>
                  <p className="text-sm text-[var(--tifawin-neutral-700)] mt-1">
                    {j.city ?? "—"}
                    {j.contractType ? ` · ${j.contractType}` : ""}
                    {j.salaryMin != null || j.salaryMax != null
                      ? ` · ${j.salaryMin ?? "—"} – ${j.salaryMax ?? "—"} TND`
                      : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {j.contractType && (
                      <Badge className="rounded-full bg-[var(--tifawin-primary)]/10 text-[var(--tifawin-primary)] border-0 font-medium px-2.5 py-0.5 text-xs">
                        {j.contractType}
                      </Badge>
                    )}
                    <Badge
                      className={
                        j.status === "CLOSED"
                          ? "rounded-full bg-red-100 text-red-700 border-0 font-medium px-2.5 py-0.5 text-xs"
                          : "rounded-full bg-[var(--tifawin-success)]/10 text-[var(--tifawin-success)] border-0 font-medium px-2.5 py-0.5 text-xs"
                      }
                    >
                      {j.status ?? "OPEN"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button asChild variant="outline" className="rounded-full border-gray-300 text-[var(--tifawin-neutral-700)] hover:bg-[var(--tifawin-neutral-100)]">
                    <Link to={`/jobs/${j.id}`}>View</Link>
                  </Button>
                  <Button asChild className="rounded-full bg-[var(--tifawin-primary)] hover:bg-[var(--tifawin-primary-hover)] text-white font-medium text-sm">
                    <Link to={`/company/jobs/${j.id}/edit`}>Edit</Link>
                  </Button>
                  <Button asChild className="rounded-full bg-[var(--tifawin-success)] hover:bg-[var(--tifawin-success-hover)] text-white font-medium text-sm">
                    <Link to={`/company/jobs/${j.id}/applicants`}>Applicants</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full border-gray-300 text-[var(--tifawin-neutral-700)] hover:bg-[var(--tifawin-neutral-100)] disabled:opacity-60"
                    disabled={j.status === "CLOSED"}
                    onClick={() => closeJob(j.id)}
                  >
                    {j.status === "CLOSED" ? "Closed" : "Close"}
                  </Button>
                  <Button
                    className="rounded-full bg-red-600 hover:bg-red-700 text-white font-medium text-sm"
                    onClick={() => remove(j.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}