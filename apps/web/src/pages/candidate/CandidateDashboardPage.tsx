import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";

type CandidateProfile = {
  fullName?: string | null;
  city?: string | null;
  skills?: string | null;
  experienceLevel?: string | null;
  cvUrl?: string | null;
  bio?: string | null;
};

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
  };
};

type SavedJobItem = {
  id: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    city?: string | null;
    contractType?: string | null;
    status?: "OPEN" | "CLOSED";
  };
};

function getStatusBadgeClass(status: ApplicationStatus) {
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

type ProfileStrength = {
  role: "CANDIDATE";
  completion: number;
  completedFields: number;
  totalFields: number;
  missingFields: string[];
  checks: Record<string, boolean>;
};

function formatFieldLabel(field: string) {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (value) => value.toUpperCase())
    .trim();
}

export default function CandidateDashboardPage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [profileStrength, setProfileStrength] = useState<ProfileStrength | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [meRes, strengthRes, appsRes, savedRes] = await Promise.all([
          api.get("/me"),
          api.get("/me/profile-strength"),
          api.get("/me/applications"),
          api.get("/me/saved-jobs"),
        ]);

        setProfile(meRes.data?.user?.candidateProfile ?? null);
        setProfileStrength(strengthRes.data ?? null);
        setApplications(appsRes.data?.applications ?? []);
        setSavedJobs(savedRes.data?.savedJobs ?? []);
      } catch (e: any) {
        toast.error(
          e?.response?.data?.message || e?.message || "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const stats = useMemo(() => {
    return {
      applications: applications.length,
      activeApplications: applications.filter((item) =>
        ["SUBMITTED", "SEEN"].includes(item.status)
      ).length,
      saved: savedJobs.length,
      accepted: applications.filter((item) => item.status === "ACCEPTED").length,
    };
  }, [applications, savedJobs]);

  const recentApplications = applications.slice(0, 4);
  const recentSavedJobs = savedJobs.slice(0, 4);
  const profilePercent = profileStrength?.completion ?? 0;
  const missingFields = profileStrength?.missingFields ?? [];

  return (
    <div className="page-container space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white px-6 py-7 shadow-[var(--shadow-card-hover)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,102,204,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,209,0,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(0,158,73,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(225,29,72,0.10),transparent_24%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--tifawin-primary)]/10 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--tifawin-primary)]">
              <span className="h-2 w-2 rounded-full bg-[var(--tifawin-primary)] animate-pulse" />
              Candidate dashboard
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--tifawin-neutral-900)] sm:text-4xl">
                Welcome back
                {profile?.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""}
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[var(--tifawin-neutral-700)] sm:text-base">
                Track your applications, monitor saved jobs, and strengthen your
                profile with a cleaner startup-grade workspace.
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
        <div className="py-12 text-center text-sm text-[var(--tifawin-neutral-700)]">
          Loading dashboard…
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Applications",
                value: String(stats.applications),
                hint: "All submitted jobs",
                badgeClass: "bg-[#0066CC]/12 text-[#0066CC]",
              },
              {
                label: "Active",
                value: String(stats.activeApplications),
                hint: "Awaiting company response",
                badgeClass: "bg-[#FFD100]/30 text-[#8A6A00]",
              },
              {
                label: "Saved",
                value: String(stats.saved),
                hint: "Jobs saved for later",
                badgeClass: "bg-[#009E49]/12 text-[#009E49]",
              },
              {
                label: "Accepted",
                value: String(stats.accepted),
                hint: "Positive outcomes",
                badgeClass: "bg-[#E11D48]/10 text-[#E11D48]",
              },
            ].map((item) => (
              <Card
                key={item.label}
                className="tifawin-stat-card p-5"
              >
                <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.badgeClass}`}>
                  {item.label}
                </div>
                <div className="mt-4 text-3xl font-bold text-[var(--tifawin-neutral-900)]">
                  {item.value}
                </div>
                <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
                  {item.hint}
                </p>
              </Card>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="rounded-[1.75rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--tifawin-neutral-900)]">
                    Profile completion
                  </h2>
                  <p className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                    A stronger profile helps companies trust your application faster.
                  </p>
                </div>
                <div className="amazigh-dots amazigh-dots--card" aria-hidden>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--tifawin-neutral-100)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#0066CC_0%,#009E49_35%,#FFD100_70%,#E11D48_100%)] transition-all duration-500"
                  style={{ width: `${profilePercent}%` }}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-[var(--tifawin-neutral-900)]">
                  {profilePercent}% complete
                </span>
                <span className="text-[var(--tifawin-neutral-700)]">
                  {profileStrength
                    ? `${profileStrength.completedFields}/${profileStrength.totalFields} trust signals completed`
                    : "Trust signals loading"}
                </span>
                <Link
                  to="/candidate/profile"
                  className="font-medium text-[var(--tifawin-primary)] hover:underline"
                >
                  Improve profile
                </Link>
              </div>

              {missingFields.length > 0 ? (
                <>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {missingFields.map((field) => (
                      <Badge
                        key={field}
                        className="border-0 bg-[#E11D48]/10 px-3 py-1 text-xs font-semibold text-[#E11D48]"
                      >
                        Missing: {formatFieldLabel(field)}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl bg-[linear-gradient(135deg,rgba(0,102,204,0.06),rgba(255,209,0,0.12))] px-4 py-4 text-sm leading-6 text-[var(--tifawin-neutral-700)]">
                    Complete the remaining fields to make your profile easier to trust and faster for companies to review.
                  </div>
                </>
              ) : (
                <div className="mt-5 rounded-2xl bg-[#009E49]/10 px-4 py-4 text-sm font-medium text-[#0b7a40]">
                  Your profile is complete and ready to make a strong first impression.
                </div>
              )}
            </Card>

            <Card className="rounded-[1.75rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-xl font-bold text-[var(--tifawin-neutral-900)]">
                Quick actions
              </h2>
              <p className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                Jump directly to the parts you use the most.
              </p>

              <div className="mt-5 grid gap-3">
                {[
                  ["Edit profile", "/candidate/profile", "Keep your CV, skills, and experience current."],
                  ["My applications", "/candidate/applications", "Track statuses and recent activity."],
                  ["Saved jobs", "/candidate/saved-jobs", "Revisit opportunities you bookmarked."],
                  ["Browse jobs", "/jobs", "Discover more roles across Tunisia."],
                ].map(([title, href, desc]) => (
                  <Link
                    key={title}
                    to={href}
                    className="group rounded-2xl border border-gray-200/80 bg-[var(--tifawin-neutral-50)] px-4 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--tifawin-primary)]/25 hover:bg-white hover:shadow-[var(--shadow-card)]"
                  >
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <div className="font-semibold text-[var(--tifawin-neutral-900)] group-hover:text-[var(--tifawin-primary)]">
                          {title}
                        </div>
                        <p className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                          {desc}
                        </p>
                      </div>
                      <span className="text-lg text-[var(--tifawin-primary)]">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-[1.75rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <h2 className="text-xl font-bold text-[var(--tifawin-neutral-900)]">
                  Recent applications
                </h2>
                <Link
                  to="/candidate/applications"
                  className="text-sm font-medium text-[var(--tifawin-primary)] hover:underline"
                >
                  See all
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {recentApplications.length === 0 ? (
                  <p className="text-sm text-[var(--tifawin-neutral-700)]">
                    You have not applied yet.
                  </p>
                ) : (
                  recentApplications.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-4 transition-all duration-300 hover:bg-white hover:shadow-[var(--shadow-card)]"
                    >
                      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <div className="font-semibold text-[var(--tifawin-neutral-900)]">
                            {item.job.title}
                          </div>
                          <div className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                            {item.job.city ?? "Tunisia"}
                            {item.job.contractType ? ` • ${item.job.contractType}` : ""}
                          </div>
                        </div>
                        <Badge className={getStatusBadgeClass(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="rounded-[1.75rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-[var(--tifawin-neutral-900)]">
                  Saved jobs preview
                </h2>
                <Link
                  to="/candidate/saved-jobs"
                  className="text-sm font-medium text-[var(--tifawin-primary)] hover:underline"
                >
                  See all
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {recentSavedJobs.length === 0 ? (
                  <p className="text-sm text-[var(--tifawin-neutral-700)]">
                    You have not saved any jobs yet.
                  </p>
                ) : (
                  recentSavedJobs.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-4 transition-all duration-300 hover:bg-white hover:shadow-[var(--shadow-card)]"
                    >
                      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <div className="font-semibold text-[var(--tifawin-neutral-900)]">
                            {item.job.title}
                          </div>
                          <div className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                            {item.job.city ?? "Tunisia"}
                            {item.job.contractType ? ` • ${item.job.contractType}` : ""}
                          </div>
                        </div>
                        <Badge
                          className={
                            item.job.status === "CLOSED"
                              ? "border-0 bg-[#E11D48]/10 text-[#E11D48]"
                              : "border-0 bg-[#009E49]/12 text-[#009E49]"
                          }
                        >
                          {item.job.status ?? "OPEN"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
