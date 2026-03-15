import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { SectionHeader } from "../../components/ui/section-header";
import { toast } from "sonner";

type ApplicationStatus =
  | "SUBMITTED"
  | "SEEN"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

type ApplicationItem = {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  job: {
    id: string;
    title: string;
    city?: string | null;
    contractType?: string | null;
    companyUserId: string;
    createdAt: string;
  };
};

function statusBadgeClass(status: ApplicationStatus) {
  switch (status) {
    case "ACCEPTED":
      return "bg-[var(--tifawin-success)]/10 text-[var(--tifawin-success)] border-0";
    case "REJECTED":
      return "bg-red-100 text-red-700 border-0";
    case "SEEN":
      return "bg-[var(--tifawin-primary)]/10 text-[var(--tifawin-primary)] border-0";
    case "WITHDRAWN":
      return "bg-[var(--tifawin-neutral-100)] text-[var(--tifawin-neutral-700)] border-0";
    case "SUBMITTED":
    default:
      return "bg-[var(--tifawin-neutral-100)] text-[var(--tifawin-neutral-700)] border-0";
  }
}

function ApplicationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
          <div className="flex flex-wrap gap-2">
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

export default function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/me/applications");
      setApplications(res.data.applications ?? []);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load applications"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw(applicationId: string) {
    try {
      setWithdrawingId(applicationId);
      const res = await api.patch(`/applications/${applicationId}/withdraw`);
      const updated = res.data.application;
      setApplications((current) =>
        current.map((app) =>
          app.id === applicationId ? { ...app, status: updated.status } : app
        )
      );
      toast.success(res.data.message || "Application withdrawn");
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to withdraw application"
      );
    } finally {
      setWithdrawingId(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page-container space-y-8">
      <SectionHeader
        title="My applications"
        description="Track your submitted jobs and manage active applications."
      />

      {loading ? <ApplicationsSkeleton /> : null}

      {!loading && applications.length === 0 && (
        <Card className="p-6 text-center sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--tifawin-primary)]/10 text-xl text-[var(--tifawin-primary)]">
            ⵣ
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[var(--tifawin-neutral-900)]">
            No applications yet
          </h3>
          <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
            Start applying to jobs across Tunisia and they will appear here.
          </p>
          <div className="mt-5">
            <Button asChild className="rounded-full bg-[var(--tifawin-primary)] text-white hover:bg-[var(--tifawin-primary-hover)]">
              <Link to="/jobs">Browse jobs</Link>
            </Button>
          </div>
        </Card>
      )}

      {!loading && applications.length > 0 && (
        <ul className="space-y-3">
          {applications.map((app) => {
            const canWithdraw = app.status === "SUBMITTED" || app.status === "SEEN";
            return (
              <li key={app.id}>
                <Card className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-semibold text-[var(--tifawin-neutral-900)]">{app.job.title}</h3>
                      <p className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                        {app.job.city ?? "—"}
                        {app.job.contractType ? ` · ${app.job.contractType}` : ""}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {app.job.contractType ? <Badge className="border-0 bg-[var(--tifawin-primary)]/10 text-[var(--tifawin-primary)]">{app.job.contractType}</Badge> : null}
                        <Badge className={statusBadgeClass(app.status)}>{app.status}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-[var(--tifawin-neutral-700)]">
                        Applied {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row lg:justify-end">
                      {canWithdraw ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full rounded-full border-gray-300 sm:w-auto"
                          onClick={() => handleWithdraw(app.id)}
                          disabled={withdrawingId === app.id}
                        >
                          {withdrawingId === app.id ? "Working..." : "Withdraw"}
                        </Button>
                      ) : null}
                      <Button
                        asChild
                        size="default"
                        className="w-full rounded-full bg-[var(--tifawin-primary)] text-white hover:bg-[var(--tifawin-primary-hover)] sm:w-auto"
                      >
                        <Link to={`/jobs/${app.job.id}`}>View job</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
