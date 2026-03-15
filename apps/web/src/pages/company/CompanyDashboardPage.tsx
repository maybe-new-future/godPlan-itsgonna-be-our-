import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import VerifiedBadge from "../../components/trust/VerifiedBadge";
import { toast } from "sonner";
import { BriefcaseBusiness, FileText, FolderKanban, PlusCircle, Users } from "lucide-react";

type ApplicantStatus = "SUBMITTED" | "SEEN" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";

type DashboardData = {
  stats: {
    activeJobs: number;
    closedJobs: number;
    totalApplicants: number;
  };
  recentApplicants: Array<{
    id: string;
    status: ApplicantStatus;
    createdAt: string;
    job: {
      id: string;
      title: string;
    };
    candidate: {
      id: string;
      email: string;
      candidateProfile: {
        fullName?: string | null;
        city?: string | null;
      } | null;
    };
  }>;
  recentJobs: Array<{
    id: string;
    title: string;
    status: "OPEN" | "CLOSED";
    createdAt: string;
    applicationsCount: number;
  }>;
};

type CompanyProfileStrength = {
  role: "COMPANY";
  completion: number;
  completedFields: number;
  totalFields: number;
  missingFields: string[];
  checks: Record<string, boolean>;
  verification?: {
    isVerified: boolean;
    verifiedAt?: string | null;
  };
};

function formatFieldLabel(field: string) {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (value) => value.toUpperCase())
    .trim();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function applicantStatusClass(status: ApplicantStatus) {
  switch (status) {
    case "ACCEPTED":
      return "border-0 bg-[#009E49]/12 text-[#009E49]";
    case "REJECTED":
      return "border-0 bg-[#E11D48]/10 text-[#E11D48]";
    case "SEEN":
      return "border-0 bg-[#FFD100]/30 text-[#8A6A00]";
    case "WITHDRAWN":
      return "border-0 bg-[var(--tifawin-neutral-100)] text-[var(--tifawin-neutral-700)]";
    case "SUBMITTED":
    default:
      return "border-0 bg-[#0066CC]/10 text-[#0066CC]";
  }
}

export default function CompanyDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [profileStrength, setProfileStrength] = useState<CompanyProfileStrength | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [dashboardResponse, profileStrengthResponse] = await Promise.all([
          api.get("/company/dashboard"),
          api.get("/me/profile-strength"),
        ]);
        setDashboard(dashboardResponse.data);
        setProfileStrength(profileStrengthResponse.data ?? null);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || error?.message || "Failed to load company dashboard"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Active jobs",
        value: dashboard?.stats.activeJobs ?? 0,
        hint: "Currently visible to candidates",
        icon: FolderKanban,
        tone: "bg-[#009E49]/12 text-[#009E49]",
      },
      {
        label: "Closed jobs",
        value: dashboard?.stats.closedJobs ?? 0,
        hint: "Archived or paused openings",
        icon: BriefcaseBusiness,
        tone: "bg-[var(--tifawin-neutral-100)] text-[var(--tifawin-neutral-900)]",
      },
      {
        label: "Total applicants",
        value: dashboard?.stats.totalApplicants ?? 0,
        hint: "Applicants across your jobs",
        icon: Users,
        tone: "bg-[#0066CC]/10 text-[#0066CC]",
      },
    ],
    [dashboard]
  );

  return (
    <div className="page-container space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white px-6 py-7 shadow-[var(--shadow-card-hover)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,102,204,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,209,0,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(0,158,73,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(225,29,72,0.10),transparent_24%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--tifawin-primary)]/10 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--tifawin-primary)]">
              <span className="h-2 w-2 rounded-full bg-[var(--tifawin-primary)] animate-pulse" />
              Company workspace
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--tifawin-neutral-900)] sm:text-4xl">
                Hiring dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[var(--tifawin-neutral-700)] sm:text-base">
                Track job activity, recent applicants, and the next actions your hiring team should take.
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
      </section>

      {loading ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="p-5">
                <Skeleton className="h-7 w-28" />
                <Skeleton className="mt-5 h-10 w-20" />
                <Skeleton className="mt-3 h-4 w-36" />
              </Card>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="p-6">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="mt-5 h-24 w-full" />
              <Skeleton className="mt-4 h-24 w-full" />
            </Card>
            <Card className="p-6">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="mt-5 h-20 w-full" />
              <Skeleton className="mt-4 h-20 w-full" />
            </Card>
          </section>
        </>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {stats.map((item) => {
              const Icon = item.icon;

              return (
                <Card key={item.label} className="tifawin-stat-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.tone}`}>
                      {item.label}
                    </div>
                    <div className="rounded-2xl bg-[var(--tifawin-neutral-50)] p-2.5 text-[var(--tifawin-neutral-700)]">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4 text-3xl font-bold text-[var(--tifawin-neutral-900)]">
                    {item.value.toLocaleString()}
                  </div>
                  <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">{item.hint}</p>
                </Card>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="rounded-[1.75rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--tifawin-neutral-900)]">
                    Recent applicants
                  </h2>
                  <p className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                    The latest candidate activity across your job listings.
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-gray-300 text-[var(--tifawin-neutral-700)] hover:bg-[var(--tifawin-neutral-100)]"
                >
                  <Link to="/company/jobs">View my jobs</Link>
                </Button>
              </div>

              <div className="mt-5 space-y-3">
                {dashboard?.recentApplicants.length ? (
                  dashboard.recentApplicants.map((application) => {
                    const displayName =
                      application.candidate.candidateProfile?.fullName?.trim() || "Unnamed candidate";

                    return (
                      <div
                        key={application.id}
                        className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-4 transition-all duration-300 hover:bg-white hover:shadow-[var(--shadow-card)]"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-semibold text-[var(--tifawin-neutral-900)]">
                                {displayName}
                              </h3>
                              <Badge className={applicantStatusClass(application.status)}>
                                {application.status}
                              </Badge>
                            </div>
                            <p className="mt-1 break-all text-sm text-[var(--tifawin-neutral-700)]">
                              {application.candidate.email}
                            </p>
                            <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
                              Applied to <span className="font-medium text-[var(--tifawin-neutral-900)]">{application.job.title}</span>
                            </p>
                          </div>

                          <div className="shrink-0 text-sm text-[var(--tifawin-neutral-700)]">
                            <div>{formatDate(application.createdAt)}</div>
                            {application.candidate.candidateProfile?.city && (
                              <div className="mt-1">{application.candidate.candidateProfile.city}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-[var(--tifawin-neutral-50)] px-5 py-8 text-center">
                    <div className="text-base font-semibold text-[var(--tifawin-neutral-900)]">
                      No recent applicants
                    </div>
                    <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
                      Candidate activity will appear here once people start applying to your jobs.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-[1.75rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--tifawin-neutral-900)]">
                      Trust profile
                    </h2>
                    <p className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                      Complete your company profile to build stronger credibility with candidates.
                    </p>
                  </div>
                  <VerifiedBadge
                    isVerified={!!profileStrength?.verification?.isVerified}
                    verifiedAt={profileStrength?.verification?.verifiedAt}
                  />
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--tifawin-neutral-100)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#0066CC_0%,#009E49_35%,#FFD100_70%,#E11D48_100%)] transition-all duration-500"
                    style={{ width: `${profileStrength?.completion ?? 0}%` }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-[var(--tifawin-neutral-900)]">
                    {profileStrength?.completion ?? 0}% complete
                  </span>
                  <span className="text-[var(--tifawin-neutral-700)]">
                    {profileStrength
                      ? `${profileStrength.completedFields}/${profileStrength.totalFields} trust signals completed`
                      : "Trust signals loading"}
                  </span>
                </div>

                {profileStrength?.missingFields?.length ? (
                  <>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {profileStrength.missingFields.map((field) => (
                        <Badge
                          key={field}
                          className="border-0 bg-[#FFD100]/30 px-3 py-1 text-xs font-semibold text-[#8A6A00]"
                        >
                          Add {formatFieldLabel(field)}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[var(--tifawin-neutral-700)]">
                      Fill in the missing details so candidates can trust your brand faster and understand your company at a glance.
                    </p>
                  </>
                ) : (
                  <p className="mt-5 rounded-2xl bg-[#009E49]/10 px-4 py-4 text-sm font-medium text-[#0b7a40]">
                    Your company profile is complete and ready for candidate review.
                  </p>
                )}

                <Button
                  asChild
                  variant="outline"
                  className="mt-5 rounded-full border-gray-300 text-[var(--tifawin-neutral-700)] hover:bg-[var(--tifawin-neutral-100)]"
                >
                  <Link to="/company/profile">Improve company profile</Link>
                </Button>
              </Card>

              <Card className="rounded-[1.75rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card)]">
                <h2 className="text-xl font-bold text-[var(--tifawin-neutral-900)]">Quick actions</h2>
                <p className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                  Jump directly into the actions you need most often.
                </p>

                <div className="mt-5 grid gap-3">
                  <Link
                    to="/company/jobs/new"
                    className="group rounded-2xl border border-gray-200/80 bg-[var(--tifawin-neutral-50)] px-4 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--tifawin-primary)]/25 hover:bg-white hover:shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[var(--tifawin-neutral-900)] group-hover:text-[var(--tifawin-primary)]">
                          Post a Job
                        </div>
                        <p className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                          Publish a new role and reach candidates faster.
                        </p>
                      </div>
                      <PlusCircle className="h-5 w-5 text-[var(--tifawin-primary)]" />
                    </div>
                  </Link>

                  <Link
                    to="/company/jobs"
                    className="group rounded-2xl border border-gray-200/80 bg-[var(--tifawin-neutral-50)] px-4 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--tifawin-primary)]/25 hover:bg-white hover:shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[var(--tifawin-neutral-900)] group-hover:text-[var(--tifawin-primary)]">
                          View My Jobs
                        </div>
                        <p className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                          Review your listings, edit details, or close openings.
                        </p>
                      </div>
                      <BriefcaseBusiness className="h-5 w-5 text-[var(--tifawin-primary)]" />
                    </div>
                  </Link>

                  <div className="rounded-2xl border border-gray-200/80 bg-[var(--tifawin-neutral-50)] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[var(--tifawin-neutral-900)]">
                          View Applicants
                        </div>
                        <p className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                          Open any job from “My Jobs” to review and manage applicants.
                        </p>
                      </div>
                      <FileText className="h-5 w-5 text-[var(--tifawin-primary)]" />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="rounded-[1.75rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--tifawin-neutral-900)]">
                      Recent jobs
                    </h2>
                    <p className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                      Your latest listings and current response volume.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {dashboard?.recentJobs.length ? (
                    dashboard.recentJobs.map((job) => (
                      <div
                        key={job.id}
                        className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-4 transition-all duration-300 hover:bg-white hover:shadow-[var(--shadow-card)]"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-semibold text-[var(--tifawin-neutral-900)]">
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
                            <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
                              {job.applicationsCount} applications
                            </p>
                          </div>

                          <div className="shrink-0 text-sm text-[var(--tifawin-neutral-700)]">
                            {formatDate(job.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-[var(--tifawin-neutral-50)] px-5 py-8 text-center">
                      <div className="text-base font-semibold text-[var(--tifawin-neutral-900)]">
                        No recent jobs
                      </div>
                      <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
                        Post your first job to start building your hiring pipeline.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
