import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import UserAvatar from "../../components/shared/UserAvatar";
import VerifiedBadge from "../../components/trust/VerifiedBadge";
import { toast } from "sonner";
import { getRoleFromToken, isLoggedIn } from "../../auth/auth";

type CompanyProfile = {
  companyName?: string | null;
  city?: string | null;
  sector?: string | null;
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
};

type CompanyTrust = {
  id: string;
  companyName?: string | null;
  city?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  isVerified: boolean;
  verifiedAt?: string | null;
  metrics: {
    openJobs: number;
    totalJobs: number;
  };
};

type SavedJobItem = {
  id: string;
  job: {
    id: string;
  };
};

type Job = {
  id: string;
  title: string;
  city?: string | null;
  contractType?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  description?: string | null;
  createdAt?: string;
  status?: "OPEN" | "CLOSED";
  company?: {
    id: string;
    companyProfile?: CompanyProfile | null;
  } | null;
};

function buildHighlights(job: Job | null) {
  return [
    {
      label: "Salary",
      value:
        job?.salaryMin != null || job?.salaryMax != null
          ? `${job?.salaryMin ?? "—"} – ${job?.salaryMax ?? "—"} TND`
          : "Not specified",
    },
    { label: "City", value: job?.city ?? "—" },
    { label: "Contract", value: job?.contractType ?? "Not specified" },
    { label: "Status", value: job?.status ?? "OPEN" },
  ];
}

export default function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startingConversation, setStartingConversation] = useState(false);
  const [companyTrust, setCompanyTrust] = useState<CompanyTrust | null>(null);
  const [loadingCompanyTrust, setLoadingCompanyTrust] = useState(false);

  const loggedIn = isLoggedIn();
  const role = getRoleFromToken();
  const canApply = loggedIn && role === "CANDIDATE";
  const canSave = loggedIn && role === "CANDIDATE";

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/jobs/${id}`);
      const nextJob = res.data.job;
      setJob(nextJob);

      const companyId = nextJob?.company?.id;
      if (companyId) {
        try {
          setLoadingCompanyTrust(true);
          const trustRes = await api.get(`/companies/${companyId}/trust`);
          setCompanyTrust(trustRes.data ?? null);
        } catch {
          setCompanyTrust(null);
        } finally {
          setLoadingCompanyTrust(false);
        }
      } else {
        setCompanyTrust(null);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load job.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSavedState() {
    if (!canSave || !id) {
      setSaved(false);
      return;
    }
    try {
      const res = await api.get("/me/saved-jobs");
      const ids = (res.data.savedJobs ?? []).map((item: SavedJobItem) => item.job.id);
      setSaved(ids.includes(id));
    } catch {
      setSaved(false);
    }
  }

  async function apply() {
    if (job?.status === "CLOSED") {
      toast.error("This job is closed.");
      return;
    }
    try {
      setApplying(true);
      await api.post(`/jobs/${id}/apply`);
      toast.success("Application sent ✅");
      setAlreadyApplied(true);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || "Failed to apply.";
      if (status === 409) {
        setAlreadyApplied(true);
        toast.info("You already applied to this job.");
        return;
      }
      if (status === 401) toast.error("Please login first.");
      else if (status === 403) toast.error("Only candidates can apply.");
      else toast.error(msg);
    } finally {
      setApplying(false);
    }
  }

  async function handleSave() {
    if (!id) return;
    try {
      setSaving(true);
      await api.post(`/jobs/${id}/save`);
      setSaved(true);
      toast.success("Job saved");
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || "Failed to save job";
      if (status === 409) {
        setSaved(true);
        toast.info("Job already saved");
        return;
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleUnsave() {
    if (!id) return;
    try {
      setSaving(true);
      await api.delete(`/jobs/${id}/save`);
      setSaved(false);
      toast.success("Job removed from saved jobs");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to remove saved job");
    } finally {
      setSaving(false);
    }
  }

  async function handleMessageCompany() {
    const companyUserId = job?.company?.id;
    if (!companyUserId) {
      toast.error("Company information is unavailable for this job.");
      return;
    }

    try {
      setStartingConversation(true);
      const response = await api.post("/messages/conversations", {
        companyUserId,
        content: "Hello, I am interested in this opportunity.",
      });

      const conversationId =
        response.data?.conversation?.id ??
        response.data?.conversationId ??
        response.data?.id;

      toast.success("Conversation started");
      navigate(
        conversationId ? `/messages?conversation=${conversationId}` : "/messages"
      );
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to start conversation"
      );
    } finally {
      setStartingConversation(false);
    }
  }

  useEffect(() => {
    if (id) {
      load();
      loadSavedState();
    }
  }, [id, canSave]);

  const isClosed = job?.status === "CLOSED";
  const companyProfile = job?.company?.companyProfile;
  const companyName =
    companyTrust?.companyName?.trim() ||
    companyProfile?.companyName?.trim() ||
    "Company information not available";
  const companyCity = companyTrust?.city?.trim() || companyProfile?.city?.trim() || null;
  const companyDescription =
    companyTrust?.description?.trim() || companyProfile?.description?.trim() || "";
  const companyWebsite = companyTrust?.website?.trim() || companyProfile?.website?.trim() || "";
  const companyLogoUrl = companyTrust?.logoUrl?.trim() || companyProfile?.logoUrl?.trim() || "";
  const details = useMemo(() => buildHighlights(job), [job]);

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/jobs" className="text-sm font-medium text-[var(--tifawin-primary)] hover:underline">
          ← Back to jobs
        </Link>
        <div className="amazigh-dots amazigh-dots--card" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      {loading && (
        <div className="py-12 text-center text-sm text-[var(--tifawin-neutral-700)]">Loading…</div>
      )}

      {error && (
        <Card className="rounded-[1.5rem] border-red-200 bg-red-50/60 p-5">
          <div className="font-semibold text-red-700">Something went wrong</div>
          <div className="mt-1 text-sm text-red-600">{error}</div>
          <Button variant="outline" className="mt-4 rounded-full border-red-300 text-red-700 hover:bg-red-100" onClick={load}>
            Try again
          </Button>
        </Card>
      )}

      {!loading && !error && job && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.42fr)_360px]">
          <div className="space-y-6">
            <Card className="relative overflow-hidden rounded-[2rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card-hover)] sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,102,204,0.08),transparent_26%),radial-gradient(circle_at_top_right,rgba(255,209,0,0.12),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(0,158,73,0.1),transparent_28%)]" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <UserAvatar
                    imageUrl={companyLogoUrl}
                    label={companyName}
                    sizeClassName="h-16 w-16 rounded-[1.35rem]"
                    textClassName="text-xl"
                  />

                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--tifawin-primary)]/10 bg-[var(--tifawin-neutral-50)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--tifawin-primary)]">
                      <span className="h-2 w-2 rounded-full bg-[var(--tifawin-primary)] animate-pulse" />
                      Opportunity
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight text-[var(--tifawin-neutral-900)] sm:text-[2.4rem]">
                        {job.title}
                      </h1>
                      <p className="mt-2 text-[15px] text-[var(--tifawin-neutral-700)] sm:text-base">
                        {companyName} • {job.city ?? "—"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {job.contractType && (
                        <Badge className="rounded-full border-0 bg-[#0066CC]/10 px-3 py-1 text-xs font-semibold text-[#0066CC]">
                          {job.contractType}
                        </Badge>
                      )}
                      <Badge className="rounded-full border-0 bg-[#FFD100]/30 px-3 py-1 text-xs font-semibold text-[#8a6a00]">
                        Tunisia
                      </Badge>
                      <Badge
                        className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${
                          isClosed ? "bg-[#E11D48]/10 text-[#E11D48]" : "bg-[#009E49]/12 text-[#009E49]"
                        }`}
                      >
                        {job.status ?? "OPEN"}
                      </Badge>
                      {saved && (
                        <Badge className="rounded-full border-0 bg-[#E11D48]/10 px-3 py-1 text-xs font-semibold text-[#E11D48]">
                          Saved
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.4rem] border border-[var(--tifawin-primary)]/10 bg-white/85 p-4 shadow-sm lg:max-w-[220px]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--tifawin-neutral-700)]">
                    Quick summary
                  </div>
                  <div className="mt-3 space-y-3 text-sm text-[var(--tifawin-neutral-700)]">
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-[var(--tifawin-neutral-600)]">Salary</div>
                      <div className="mt-1 font-semibold text-[var(--tifawin-neutral-900)]">{details[0].value}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-[var(--tifawin-neutral-600)]">Posted</div>
                      <div className="mt-1 font-semibold text-[var(--tifawin-neutral-900)]">
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "Recently"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-[1.75rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[var(--tifawin-neutral-900)]">Role overview</h2>
                  <p className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                    A clear summary of the opportunity and what the company is looking for.
                  </p>
                </div>
                <div className="amazigh-dots amazigh-dots--card" aria-hidden>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.35rem] bg-[var(--tifawin-neutral-50)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tifawin-neutral-700)]">What stands out</div>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--tifawin-neutral-700)]">
                    <li>• Clear hiring flow with candidate actions already integrated.</li>
                    <li>• Simple experience for browsing, saving, and applying.</li>
                    <li>• Built for Tunisia-first discovery with Tifawin identity.</li>
                  </ul>
                </div>
                <div className="rounded-[1.35rem] bg-[linear-gradient(135deg,rgba(0,102,204,0.08),rgba(255,209,0,0.12))] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tifawin-neutral-700)]">At a glance</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {details.map((item) => (
                      <Badge key={item.label} className="rounded-full border-0 bg-white/85 px-3 py-1 text-xs font-semibold text-[var(--tifawin-neutral-800)] shadow-sm">
                        {item.label}: {item.value}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-[1.75rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
              <h2 className="text-xl font-bold text-[var(--tifawin-neutral-900)]">Job description</h2>
              <div className="mt-4 whitespace-pre-wrap leading-8 text-[15px] text-[var(--tifawin-neutral-700)]">
                {job.description?.trim() ? job.description : "No description yet."}
              </div>
            </Card>

            <Card className="rounded-[1.75rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[var(--tifawin-neutral-900)]">About the company</h2>
                  <p className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">Know who is behind this job before you apply.</p>
                </div>
                <div className="amazigh-dots amazigh-dots--card" aria-hidden>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <UserAvatar
                      imageUrl={companyLogoUrl}
                      label={companyName}
                      sizeClassName="h-14 w-14 rounded-[1.1rem]"
                      textClassName="text-base"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-lg font-semibold text-[var(--tifawin-neutral-900)]">{companyName}</div>
                        {companyTrust ? (
                          <VerifiedBadge
                            isVerified={companyTrust.isVerified}
                            verifiedAt={companyTrust.verifiedAt}
                          />
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {companyCity && (
                          <Badge className="rounded-full border-0 bg-[#FFD100]/30 px-3 py-1 text-xs font-semibold text-[#8a6a00]">
                            {companyCity}
                          </Badge>
                        )}
                        {companyProfile?.sector && (
                          <Badge className="rounded-full border-0 bg-[#0066CC]/10 px-3 py-1 text-xs font-semibold text-[#0066CC]">
                            {companyProfile.sector}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="leading-7 text-[15px] text-[var(--tifawin-neutral-700)]">
                    {companyDescription
                      ? companyDescription
                      : "No company description yet."}
                  </div>
                  {loadingCompanyTrust ? (
                    <div className="text-sm text-[var(--tifawin-neutral-700)]">
                      Loading trust signals…
                    </div>
                  ) : companyTrust ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tifawin-neutral-700)]">
                          Open jobs
                        </div>
                        <div className="mt-1 font-semibold text-[var(--tifawin-neutral-900)]">
                          {companyTrust.metrics.openJobs}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tifawin-neutral-700)]">
                          Total jobs
                        </div>
                        <div className="mt-1 font-semibold text-[var(--tifawin-neutral-900)]">
                          {companyTrust.metrics.totalJobs}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[1.4rem] bg-[var(--tifawin-neutral-50)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tifawin-neutral-700)]">Company trust</div>
                  <div className="mt-3 space-y-3 text-sm text-[var(--tifawin-neutral-700)]">
                    <div>
                      {companyWebsite ? (
                        <a
                          href={companyWebsite}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex font-medium text-[var(--tifawin-primary)] hover:underline"
                        >
                          Visit company website
                        </a>
                      ) : (
                        <span>No website shared yet.</span>
                      )}
                    </div>
                    <div className="rounded-2xl bg-white/80 px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tifawin-neutral-700)]">
                        Verification status
                      </div>
                      {loadingCompanyTrust ? (
                        <div className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
                          Loading trust signals…
                        </div>
                      ) : companyTrust ? (
                        <div className="mt-2">
                          <VerifiedBadge
                            isVerified={companyTrust.isVerified}
                            verifiedAt={companyTrust.verifiedAt}
                          />
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
                          Public trust details are not available yet.
                        </div>
                      )}
                    </div>
                    {companyCity ? (
                      <div className="rounded-2xl bg-white/80 px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tifawin-neutral-700)]">
                          City
                        </div>
                        <div className="mt-1 font-medium text-[var(--tifawin-neutral-900)]">
                          {companyCity}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <Card className="rounded-[1.75rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card-hover)]">
              <div className="text-sm font-medium uppercase tracking-[0.22em] text-[var(--tifawin-neutral-700)]">Apply now</div>
              <div className="mt-2 text-sm leading-6 text-[var(--tifawin-neutral-700)]">
                Keep this role close, review the details, and apply when you are ready.
              </div>
              <div className="mt-5 grid gap-3">
                {!loggedIn && (
                  <Button asChild className="h-12 rounded-2xl bg-[var(--tifawin-primary)] text-white hover:bg-[var(--tifawin-primary-hover)]">
                    <Link to="/login">Sign in to apply</Link>
                  </Button>
                )}
                {loggedIn && role !== "CANDIDATE" && (
                  <Button disabled className="h-12 rounded-2xl bg-gray-300 text-gray-600">
                    Only candidates can apply
                  </Button>
                )}
                {canApply && isClosed && (
                  <Button disabled className="h-12 rounded-2xl bg-gray-300 text-gray-600">
                    Job closed
                  </Button>
                )}
                {canApply && !isClosed && (
                  <Button
                    className="h-12 rounded-2xl bg-[var(--tifawin-success)] text-white hover:bg-[var(--tifawin-success-hover)]"
                    onClick={apply}
                    disabled={alreadyApplied || applying}
                  >
                    {alreadyApplied ? "Applied ✅" : applying ? "Applying..." : "Apply now"}
                  </Button>
                )}
                {canSave && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-2xl border-gray-300"
                    onClick={saved ? handleUnsave : handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : saved ? "Remove from saved" : "Save this job"}
                  </Button>
                )}
                {canApply && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-2xl border-gray-300"
                    onClick={handleMessageCompany}
                    disabled={startingConversation || !job?.company?.id}
                  >
                    {startingConversation ? "Opening chat..." : "Message Company"}
                  </Button>
                )}
              </div>
            </Card>

            <Card className="rounded-[1.75rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-bold text-[var(--tifawin-neutral-900)]">Job snapshot</h2>
              <div className="mt-5 space-y-3">
                {details.map((item) => (
                  <div key={item.label} className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tifawin-neutral-700)]">
                      {item.label}
                    </div>
                    <div className="mt-1 font-semibold text-[var(--tifawin-neutral-900)]">{item.value}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[1.75rem] border-white/80 bg-[linear-gradient(135deg,rgba(0,102,204,0.08),rgba(255,209,0,0.12),rgba(0,158,73,0.08))] p-6 shadow-[var(--shadow-card)]">
              <div className="text-sm font-medium uppercase tracking-[0.22em] text-[var(--tifawin-neutral-700)]">Why apply here</div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--tifawin-neutral-700)]">
                <li>• Save the role for later and track your opportunities in one place.</li>
                <li>• Apply through a simple candidate-first experience.</li>
                <li>• Explore company information before making your move.</li>
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
