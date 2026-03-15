import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import UserAvatar from "../../components/shared/UserAvatar";
import { resolveApiUrl } from "../../lib/api";
import { toast } from "sonner";

type CandidateProfile = {
  avatarUrl?: string | null;
  fullName: string;
  city: string;
  bio?: string | null;
  skills?: string | null;
  experienceLevel?: string | null;
  cvUrl?: string | null;
};

export default function CandidateProfilePage() {
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const res = await api.get("/me");
      const profile: CandidateProfile | null = res?.data?.user?.candidateProfile ?? null;
      if (profile) {
        setAvatarUrl(profile.avatarUrl ?? "");
        setFullName(profile.fullName ?? "");
        setCity(profile.city ?? "");
        setBio(profile.bio ?? "");
        setSkills(profile.skills ?? "");
        setExperienceLevel(profile.experienceLevel ?? "");
        setCvUrl(profile.cvUrl ?? "");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load candidate profile");
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanFullName = fullName.trim();
    const cleanCity = city.trim();
    const cleanBio = bio.trim();
    const cleanSkills = skills.trim();
    const cleanExperienceLevel = experienceLevel.trim();
    const cleanCvUrl = cvUrl.trim();
    if (!cleanFullName) return toast.error("Full name is required.");
    if (!cleanCity) return toast.error("City is required.");
    if (cleanCvUrl) {
      try {
        new URL(cleanCvUrl);
      } catch {
        if (!cleanCvUrl.startsWith("/")) return toast.error("CV URL must be a valid link.");
      }
    }
    try {
      setSaving(true);
      await api.put("/me/candidate-profile", {
        fullName: cleanFullName,
        city: cleanCity,
        bio: cleanBio || undefined,
        skills: cleanSkills || undefined,
        experienceLevel: cleanExperienceLevel || undefined,
        cvUrl: cleanCvUrl || undefined,
      });
      toast.success("Profile saved ✅");
    } catch (e: any) {
      toast.error(String(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to save profile"));
    } finally {
      setSaving(false);
    }
  }

  async function handleCvUpload() {
    if (!cvFile) return toast.error("Choose a PDF file first.");
    try {
      setUploadingCv(true);
      const formData = new FormData();
      formData.append("cv", cvFile);
      const res = await api.post("/me/cv", formData);
      const url = res.data?.cvUrl ?? res.data?.profile?.cvUrl ?? "";
      setCvUrl(url);
      setCvFile(null);
      toast.success("CV uploaded ✅");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to upload CV");
    } finally {
      setUploadingCv(false);
    }
  }

  const cvDownloadUrl = resolveApiUrl(cvUrl);

  const completionChecks = useMemo(
    () => [
      ["Full name", !!fullName.trim()],
      ["City", !!city.trim()],
      ["Skills", !!skills.trim()],
      ["Experience", !!experienceLevel.trim()],
      ["CV", !!cvUrl.trim()],
      ["Bio", !!bio.trim()],
    ],
    [fullName, city, skills, experienceLevel, cvUrl, bio]
  );
  const completion = Math.round((completionChecks.filter((item) => item[1]).length / completionChecks.length) * 100);

  if (loading) {
    return <div className="page-container"><Card className="p-6">Loading profile...</Card></div>;
  }

  return (
    <div className="page-container space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[1.9rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card-hover)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <UserAvatar
                imageUrl={avatarUrl}
                label={fullName.trim() || "Candidate profile"}
                sizeClassName="h-16 w-16"
                textClassName="text-lg"
              />
              <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--tifawin-neutral-900)]">My profile</h1>
              <p className="mt-2 max-w-xl text-[15px] leading-7 text-[var(--tifawin-neutral-700)]">Complete your profile so companies can understand your strengths quickly.</p>
              </div>
            </div>
            <div className="amazigh-dots amazigh-dots--section" aria-hidden><span /><span /><span /><span /></div>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-[var(--tifawin-neutral-100)]">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#0066CC_0%,#009E49_35%,#FFD100_70%,#E11D48_100%)] transition-all duration-500" style={{ width: `${completion}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="font-semibold text-[var(--tifawin-neutral-900)]">{completion}% complete</span>
            <span className="text-[var(--tifawin-neutral-700)]">A complete profile builds trust</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {completionChecks.map(([label, ok]) => (
              <div key={String(label)} className="flex items-center justify-between rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-3">
                <span className="text-sm text-[var(--tifawin-neutral-700)]">{label}</span>
                <Badge className={ok ? "border-0 bg-[#009E49]/12 text-[#009E49]" : "border-0 bg-[#E11D48]/10 text-[#E11D48]"}>{ok ? "Done" : "Missing"}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[1.9rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
          <h2 className="text-xl font-bold text-[var(--tifawin-neutral-900)]">CV and visibility</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--tifawin-neutral-700)]">Upload your CV and keep your profile current so recruiters can review your application faster.</p>
          <div className="mt-5 space-y-4">
            {cvDownloadUrl ? (
              <a href={cvDownloadUrl} target="_blank" rel="noreferrer" className="inline-flex font-medium text-[var(--tifawin-primary)] hover:underline">Download current CV</a>
            ) : (
              <div className="text-sm text-[var(--tifawin-neutral-700)]">No CV uploaded yet.</div>
            )}
            <Input type="file" accept=".pdf,application/pdf" onChange={(e) => setCvFile(e.target.files?.[0] ?? null)} className="max-w-sm" />
            <Button type="button" variant="outline" className="rounded-full border-gray-300 text-[var(--tifawin-neutral-700)] hover:bg-[var(--tifawin-neutral-100)]" onClick={handleCvUpload} disabled={!cvFile || uploadingCv}>
              {uploadingCv ? "Uploading…" : "Upload PDF"}
            </Button>
            <div className="text-xs text-[var(--tifawin-neutral-700)]">You can also keep a public CV link below if you prefer.</div>
          </div>
        </Card>
      </section>

      <Card className="rounded-[1.9rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-1">
            <label className="text-sm font-medium">Full name *</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ahmed Ben Ali" required />
          </div>
          <div className="space-y-1 sm:col-span-1">
            <label className="text-sm font-medium">City *</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Tunis" required />
          </div>
          <div className="space-y-1 sm:col-span-1">
            <label className="text-sm font-medium">Skills</label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, Node.js" />
          </div>
          <div className="space-y-1 sm:col-span-1">
            <label className="text-sm font-medium">Experience level</label>
            <Input value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} placeholder="Junior / Mid / Senior" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">CV URL</label>
            <Input value={cvUrl} onChange={(e) => setCvUrl(e.target.value)} placeholder="https://... or leave empty" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell companies about yourself..." rows={6} />
          </div>
          <div className="sm:col-span-2 flex gap-3 pt-2">
            <Button type="submit" className="rounded-full bg-[var(--tifawin-primary)] px-5 text-white shadow-sm hover:bg-[var(--tifawin-primary-hover)]" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
