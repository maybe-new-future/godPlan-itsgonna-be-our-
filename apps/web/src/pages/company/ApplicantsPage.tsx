import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { resolveApiUrl } from "../../lib/api";
import { toast } from "sonner";

type CandidateProfile = {
  fullName?: string | null;
  city?: string | null;
  bio?: string | null;
  skills?: string | null;
  experienceLevel?: string | null;
  cvUrl?: string | null;
};

type ApplicationStatus = "SUBMITTED" | "SEEN" | "ACCEPTED" | "REJECTED";

type Applicant = {
  id: string;
  createdAt: string;
  status: ApplicationStatus;
  candidate: {
    id: string;
    email: string;
    candidateProfile?: CandidateProfile | null;
  };
};

function statusBadgeClass(status: ApplicationStatus) {
  switch (status) {
    case "ACCEPTED":
      return "rounded-full border-0 bg-[#009E49]/12 text-[#009E49] px-3 py-1 text-xs font-semibold";
    case "REJECTED":
      return "rounded-full border-0 bg-[#E11D48]/10 text-[#E11D48] px-3 py-1 text-xs font-semibold";
    case "SEEN":
      return "rounded-full border-0 bg-[#FFD100]/30 text-[#8A6A00] px-3 py-1 text-xs font-semibold";
    case "SUBMITTED":
    default:
      return "rounded-full border-0 bg-[#0066CC]/10 text-[#0066CC] px-3 py-1 text-xs font-semibold";
  }
}

function getInitials(name?: string | null) {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getCvHref(cvUrl?: string | null) {
  if (!cvUrl?.trim()) return null;
  return resolveApiUrl(cvUrl);
}

export default function ApplicantsPage() {
  const { id: jobId } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [messagingCandidateId, setMessagingCandidateId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);

  const title = useMemo(() => "Applicants", []);
  const stats = useMemo(
    () => ({
      total: applicants.length,
      submitted: applicants.filter((item) => item.status === "SUBMITTED").length,
      seen: applicants.filter((item) => item.status === "SEEN").length,
      accepted: applicants.filter((item) => item.status === "ACCEPTED").length,
    }),
    [applicants]
  );

  async function load() {
    if (!jobId) return;

    try {
      setLoading(true);
      const res = await api.get(`/jobs/${jobId}/applications`);
      setApplicants(res.data.applicants ?? []);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to load applicants"
      );
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(
    applicationId: string,
    status: "SEEN" | "ACCEPTED" | "REJECTED"
  ) {
    try {
      setUpdatingId(applicationId);
      await api.patch(`/applications/${applicationId}/status`, { status });
      setApplicants((prev) =>
        prev.map((item) => (item.id === applicationId ? { ...item, status } : item))
      );
      toast.success(`Application marked as ${status} ✅`);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to update status"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleMessageCandidate(candidateUserId: string) {
    try {
      setMessagingCandidateId(candidateUserId);
      const response = await api.post("/messages/conversations", {
        candidateUserId,
        content: "Hello, we would like to discuss your application.",
      });

      const conversationId =
        response.data?.conversation?.id ??
        response.data?.conversationId ??
        response.data?.id;

      toast.success("Conversation started");
      nav(conversationId ? `/messages?conversation=${conversationId}` : "/messages");
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to start conversation"
      );
    } finally {
      setMessagingCandidateId(null);
    }
  }

  useEffect(() => {
    load();
  }, [jobId]);

  return (
    <div className="page-container space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white px-6 py-7 shadow-[var(--shadow-card-hover)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,102,204,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,209,0,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(0,158,73,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(225,29,72,0.10),transparent_24%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--tifawin-primary)]/10 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--tifawin-primary)]">
              <span className="h-2 w-2 rounded-full bg-[var(--tifawin-primary)] animate-pulse" />
              Recruiter workspace
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--tifawin-neutral-900)] sm:text-4xl">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[var(--tifawin-neutral-700)] sm:text-base">
                Review candidates, access CVs faster, and move applications through
                your hiring pipeline with a cleaner workflow.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-between gap-3 self-start lg:w-auto lg:self-auto">
            <div className="amazigh-dots amazigh-dots--section" aria-hidden>
              <span />
              <span />
              <span />
              <span />
            </div>
            <Button
              variant="outline"
              className="rounded-full border-gray-300 text-[var(--tifawin-neutral-700)] hover:bg-[var(--tifawin-neutral-100)]"
              onClick={() => nav(-1)}
            >
              ← Back
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="py-12 text-center text-sm text-[var(--tifawin-neutral-700)]">
          Loading applicants…
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total applicants",
                value: String(stats.total),
                hint: "All candidates for this role",
                badgeClass: "bg-[#0066CC]/12 text-[#0066CC]",
              },
              {
                label: "New",
                value: String(stats.submitted),
                hint: "Recently submitted",
                badgeClass: "bg-[#FFD100]/30 text-[#8A6A00]",
              },
              {
                label: "Reviewed",
                value: String(stats.seen),
                hint: "Seen by your team",
                badgeClass: "bg-[#009E49]/12 text-[#009E49]",
              },
              {
                label: "Accepted",
                value: String(stats.accepted),
                hint: "Advanced applicants",
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

          {applicants.length === 0 ? (
            <Card className="rounded-[1.75rem] border-gray-200/80 bg-white p-8 shadow-[var(--shadow-card)]">
              <div className="font-semibold text-[var(--tifawin-neutral-900)]">
                No applicants yet
              </div>
              <div className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                When candidates apply to your job postings, they will appear here.
              </div>
            </Card>
          ) : (
            <ul className="space-y-4">
              {applicants.map((applicant, index) => {
                const profile = applicant.candidate.candidateProfile;
                const displayName = profile?.fullName?.trim() || "Unnamed candidate";
                const appliedAt = new Date(applicant.createdAt).toLocaleString();
                const isUpdating = updatingId === applicant.id;
                const isMessaging = messagingCandidateId === applicant.candidate.id;
                const cvHref = getCvHref(profile?.cvUrl);

                return (
                  <li key={applicant.id}>
                    <Card className="overflow-hidden rounded-[1.75rem] border border-gray-200/80 bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]">
                      <div className="h-1 w-full bg-[linear-gradient(90deg,#0066CC_0%,#009E49_33%,#FFD100_67%,#E11D48_100%)]" />
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-4">
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0066CC]/10 text-base font-bold text-[#0066CC] ring-1 ring-[#0066CC]/10">
                                {getInitials(displayName)}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`h-2.5 w-2.5 rounded-full ${[
                                      "bg-[#0066CC]",
                                      "bg-[#009E49]",
                                      "bg-[#FFD100]",
                                      "bg-[#E11D48]",
                                    ][index % 4]}`}
                                  />
                                  <h2 className="truncate text-lg font-bold text-[var(--tifawin-neutral-900)]">
                                    {displayName}
                                  </h2>
                                  <Badge className={statusBadgeClass(applicant.status)}>
                                    {applicant.status}
                                  </Badge>
                                </div>

                                <p className="mt-1 break-all text-sm text-[var(--tifawin-neutral-700)]">
                                  {applicant.candidate.email}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  {profile?.city && (
                                    <Badge className="rounded-full border-0 bg-[var(--tifawin-neutral-100)] px-3 py-1 text-xs font-medium text-[var(--tifawin-neutral-700)]">
                                      {profile.city}
                                    </Badge>
                                  )}
                                  {profile?.experienceLevel && (
                                    <Badge className="rounded-full border-0 bg-[#0066CC]/10 px-3 py-1 text-xs font-medium text-[#0066CC]">
                                      {profile.experienceLevel}
                                    </Badge>
                                  )}
                                  <Badge className="rounded-full border-0 bg-[var(--tifawin-neutral-100)] px-3 py-1 text-xs font-medium text-[var(--tifawin-neutral-700)]">
                                    Applied {appliedAt}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                              <div className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-4">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tifawin-primary)]">
                                  Profile overview
                                </div>
                                {profile?.bio?.trim() ? (
                                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--tifawin-neutral-700)]">
                                    {profile.bio}
                                  </p>
                                ) : (
                                  <p className="mt-3 text-sm text-[var(--tifawin-neutral-700)]">
                                    No bio added yet.
                                  </p>
                                )}
                              </div>

                              <div className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-4">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tifawin-primary)]">
                                  Skills
                                </div>
                                <p className="mt-3 text-sm leading-6 text-[var(--tifawin-neutral-700)]">
                                  {profile?.skills?.trim() || "No skills listed yet."}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="xl:w-[270px] xl:shrink-0">
                            <div className="rounded-[1.5rem] bg-[var(--tifawin-neutral-50)] p-4">
                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tifawin-primary)]">
                                Actions
                              </div>

                              <div className="mt-4 grid gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full rounded-full border-gray-300 text-[var(--tifawin-neutral-700)] hover:bg-white"
                                  disabled={isMessaging}
                                  onClick={() => handleMessageCandidate(applicant.candidate.id)}
                                >
                                  {isMessaging ? "Opening chat..." : "Message candidate"}
                                </Button>

                                <Button
                                  className="w-full rounded-full bg-[var(--tifawin-primary)] text-white hover:bg-[var(--tifawin-primary-hover)]"
                                  asChild
                                >
                                  <a href={`mailto:${applicant.candidate.email}`}>Email candidate</a>
                                </Button>

                                {cvHref ? (
                                  <Button
                                    variant="outline"
                                    className="w-full rounded-full border-gray-300 text-[var(--tifawin-neutral-700)] hover:bg-white"
                                    asChild
                                  >
                                    <a href={cvHref} target="_blank" rel="noreferrer">
                                      View CV
                                    </a>
                                  </Button>
                                ) : (
                                  <div className="rounded-full border border-dashed border-gray-300 px-4 py-2 text-center text-sm text-[var(--tifawin-neutral-700)]">
                                    No CV uploaded
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                                <Button
                                  variant="outline"
                                  className="w-full rounded-full border-[#FFD100]/50 text-[#8A6A00] hover:bg-[#FFD100]/15 disabled:opacity-60"
                                  disabled={isUpdating || applicant.status === "SEEN"}
                                  onClick={() => changeStatus(applicant.id, "SEEN")}
                                >
                                  {isUpdating && updatingId === applicant.id ? "Updating…" : "Mark seen"}
                                </Button>
                                <Button
                                  className="w-full rounded-full bg-[var(--tifawin-success)] text-white hover:bg-[var(--tifawin-success-hover)] disabled:opacity-60"
                                  disabled={isUpdating || applicant.status === "ACCEPTED"}
                                  onClick={() => changeStatus(applicant.id, "ACCEPTED")}
                                >
                                  Accept
                                </Button>
                                <Button
                                  className="w-full rounded-full bg-[#E11D48] text-white hover:bg-[#be123c] disabled:opacity-60"
                                  disabled={isUpdating || applicant.status === "REJECTED"}
                                  onClick={() => changeStatus(applicant.id, "REJECTED")}
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
