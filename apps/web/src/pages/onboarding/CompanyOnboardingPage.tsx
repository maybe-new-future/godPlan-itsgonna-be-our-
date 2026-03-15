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

type CompanyProfile = {
  logoUrl?: string | null;
  companyName?: string | null;
  city?: string | null;
  description?: string | null;
  website?: string | null;
};

export default function CompanyOnboardingPage() {
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const response = await api.get("/me");
        const profile: CompanyProfile | null = response.data?.user?.companyProfile ?? null;

        if (profile) {
          setLogoUrl(profile.logoUrl ?? "");
          setCompanyName(profile.companyName ?? "");
          setCity(profile.city ?? "");
          setDescription(profile.description ?? "");
          setWebsite(profile.website ?? "");
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
    if (logoFile) {
      return URL.createObjectURL(logoFile);
    }

    return resolveMediaUrl(logoUrl);
  }, [logoFile, logoUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl && logoFile) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, logoFile]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    const cleanCompanyName = companyName.trim();
    const cleanCity = city.trim();
    const cleanDescription = description.trim();
    const cleanWebsite = website.trim();

    if (!logoUrl && !logoFile) return toast.error("Upload a company logo to continue.");
    if (!cleanCompanyName) return toast.error("Company name is required.");
    if (!cleanCity) return toast.error("City is required.");
    if (!cleanDescription) return toast.error("Description is required.");

    if (cleanWebsite) {
      try {
        new URL(cleanWebsite);
      } catch {
        return toast.error("Website must be a valid URL.");
      }
    }

    try {
      setSaving(true);

      await api.put("/me/company-profile", {
        companyName: cleanCompanyName,
        city: cleanCity,
        description: cleanDescription,
        website: cleanWebsite || undefined,
      });

      let nextLogoUrl = logoUrl;

      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);
        const uploadResponse = await api.post("/me/company-logo", formData);
        nextLogoUrl = uploadResponse.data?.logoUrl ?? uploadResponse.data?.profile?.logoUrl ?? "";
        setLogoUrl(nextLogoUrl);
      }

      const statusResponse = await api.get("/me/onboarding-status");
      if (!statusResponse.data?.isComplete) {
        const missingFields = Array.isArray(statusResponse.data?.missingFields)
          ? statusResponse.data.missingFields.join(", ")
          : "required fields";
        throw new Error(`Please complete: ${missingFields}`);
      }

      toast.success("Company setup complete");
      navigate("/company/dashboard", { replace: true });
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
              Company onboarding
            </Badge>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--tifawin-neutral-900)]">
                Complete your company profile
              </h1>
              <p className="mt-3 text-[15px] leading-7 text-[var(--tifawin-neutral-700)]">
                Help candidates learn more about your company and attract the right applicants.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/85 p-5 shadow-sm ring-1 ring-black/5">
              <div className="text-sm font-semibold text-[var(--tifawin-neutral-900)]">Required to continue</div>
              <div className="mt-4 grid gap-2">
                {["Company logo", "Company name", "City", "Description"].map((item) => (
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
                  <img src={previewUrl} alt="Company logo preview" className="h-full w-full object-cover" />
                ) : (
                  "Preview"
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-[var(--tifawin-neutral-900)]">Company logo *</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-[var(--tifawin-neutral-700)]">
                  Companies with logos build more trust with candidates.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Company name *</label>
                <Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Tifawin Tech" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">City *</label>
                <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Tunis" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Tell candidates what your company builds, how you work, and what matters to your team."
                rows={6}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Website</label>
              <Input
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                placeholder="https://your-company.com"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--tifawin-neutral-700)]">
                You can refine these details later from your normal company profile.
              </p>
              <Button
                type="submit"
                className="rounded-full bg-[var(--tifawin-primary)] px-6 text-white hover:bg-[var(--tifawin-primary-hover)]"
                disabled={saving}
              >
                {saving ? "Finishing setup..." : "Complete company profile"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
