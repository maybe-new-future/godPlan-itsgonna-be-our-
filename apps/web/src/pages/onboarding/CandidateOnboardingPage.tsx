import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../api/client";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { resolveMediaUrl } from "../../lib/media";

type CandidateProfile = {
  avatarUrl?: string | null;
  fullName?: string | null;
  city?: string | null;
  headline?: string | null;
  bio?: string | null;
  skills?: string | null;
  experienceLevel?: string | null;
};

export default function CandidateOnboardingPage() {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const response = await api.get("/me");
        const profile: CandidateProfile | null = response.data?.user?.candidateProfile ?? null;

        if (profile) {
          setAvatarUrl(profile.avatarUrl ?? "");
          setFullName(profile.fullName ?? "");
          setCity(profile.city ?? "");
          setHeadline(profile.headline ?? "");
          setBio(profile.bio ?? "");
          setSkills(profile.skills ?? "");
          setExperienceLevel(profile.experienceLevel ?? "");
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || error?.message || "Failed to load onboarding");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const previewUrl = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }

    return resolveMediaUrl(avatarUrl);
  }, [avatarFile, avatarUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl && avatarFile) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, avatarFile]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    const cleanFullName = fullName.trim();
    const cleanCity = city.trim();
    const cleanHeadline = headline.trim();
    const cleanBio = bio.trim();
    const cleanSkills = skills.trim();
    const cleanExperienceLevel = experienceLevel.trim();

    if (!avatarUrl && !avatarFile) return toast.error("Upload an avatar to continue.");
    if (!cleanFullName) return toast.error("Full name is required.");
    if (!cleanCity) return toast.error("City is required.");
    if (!cleanHeadline) return toast.error("Headline is required.");
    if (!cleanBio) return toast.error("Bio is required.");
    if (!cleanSkills) return toast.error("Skills are required.");
    if (!cleanExperienceLevel) return toast.error("Experience level is required.");

    try {
      setSaving(true);

      await api.put("/me/candidate-profile", {
        fullName: cleanFullName,
        city: cleanCity,
        headline: cleanHeadline,
        bio: cleanBio,
        skills: cleanSkills,
        experienceLevel: cleanExperienceLevel,
      });

      let nextAvatarUrl = avatarUrl;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const uploadResponse = await api.post("/me/avatar", formData);
        nextAvatarUrl = uploadResponse.data?.avatarUrl ?? uploadResponse.data?.profile?.avatarUrl ?? "";
        setAvatarUrl(nextAvatarUrl);
      }

      const statusResponse = await api.get("/me/onboarding-status");
      if (!statusResponse.data?.isComplete) {
        const missingFields = Array.isArray(statusResponse.data?.missingFields)
          ? statusResponse.data.missingFields.join(", ")
          : "required fields";
        throw new Error(`Please complete: ${missingFields}`);
      }

      toast.success("Your profile is ready");
      navigate("/candidate/dashboard", { replace: true });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to complete onboarding");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container flex min-h-[60vh] items-center justify-center">
        <Card className="rounded-[1.75rem] p-6 text-sm text-[var(--tifawin-neutral-700)]">
          Loading onboarding...
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container py-8">
      <div className="mx-auto grid max-w-5xl gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="relative overflow-hidden rounded-[2rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card-hover)] sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,102,204,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,209,0,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(0,158,73,0.14),transparent_26%)]" />
          <div className="relative space-y-5">
            <Badge className="w-fit rounded-full border-0 bg-[var(--tifawin-primary)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tifawin-primary)]">
              Candidate onboarding
            </Badge>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--tifawin-neutral-900)]">
                Complete your profile
              </h1>
              <p className="mt-3 text-[15px] leading-7 text-[var(--tifawin-neutral-700)]">
                Your profile helps companies discover you and understand your skills.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/85 p-5 shadow-sm ring-1 ring-black/5">
              <div className="text-sm font-semibold text-[var(--tifawin-neutral-900)]">Required to continue</div>
              <div className="mt-4 grid gap-2">
                {["Avatar", "Full name", "City", "Headline", "Bio", "Skills", "Experience level"].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-3 text-sm"
                  >
                    <span className="text-[var(--tifawin-neutral-700)]">{item}</span>
                    <span className="font-semibold text-[var(--tifawin-primary)]">Required</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
          <form onSubmit={submit} className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.75rem] bg-[var(--tifawin-neutral-100)] text-sm font-semibold text-[var(--tifawin-neutral-700)] ring-1 ring-black/5">
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                ) : (
                  "Preview"
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-[var(--tifawin-neutral-900)]">Avatar *</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-[var(--tifawin-neutral-700)]">
                  Profiles with photos receive more attention from employers.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Full name *</label>
                <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">City *</label>
                <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Tunis" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Headline *</label>
              <Input
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                placeholder="experiences"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Skills *</label>
              <Input
                value={skills}
                onChange={(event) => setSkills(event.target.value)}
                placeholder=""
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Experience level *</label>
              <Input
                value={experienceLevel}
                onChange={(event) => setExperienceLevel(event.target.value)}
                placeholder="Junior, Mid, Senior"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Bio *</label>
              <Textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Share your background, strengths, and the kind of roles you want."
                rows={6}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--tifawin-neutral-700)]">
                You can edit everything later from your normal profile page.
              </p>
              <Button
                type="submit"
                className="rounded-full bg-[var(--tifawin-primary)] px-6 text-white hover:bg-[var(--tifawin-primary-hover)]"
                disabled={saving}
              >
                {saving ? "Finishing setup..." : "Complete profile"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
