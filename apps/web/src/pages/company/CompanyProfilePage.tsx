import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import UserAvatar from "../../components/shared/UserAvatar";
import VerifiedBadge from "../../components/trust/VerifiedBadge";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";

type CompanyProfile = {
  logoUrl?: string | null;
  companyName?: string | null;
  city?: string | null;
  sector?: string | null;
  description?: string | null;
  website?: string | null;
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

export default function CompanyProfilePage() {
  const [logoUrl, setLogoUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [sector, setSector] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [profileStrength, setProfileStrength] = useState<CompanyProfileStrength | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);

      const [profileResponse, profileStrengthResponse] = await Promise.all([
        api.get("/me"),
        api.get("/me/profile-strength"),
      ]);

      const profile: CompanyProfile | null = profileResponse?.data?.user?.companyProfile ?? null;

      if (profile) {
        setLogoUrl(profile.logoUrl ?? "");
        setCompanyName(profile.companyName ?? "");
        setCity(profile.city ?? "");
        setSector(profile.sector ?? "");
        setDescription(profile.description ?? "");
        setWebsite(profile.website ?? "");
      }

      setProfileStrength(profileStrengthResponse.data ?? null);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load company profile";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const cleanCompanyName = companyName.trim();
    const cleanCity = city.trim();
    const cleanSector = sector.trim();
    const cleanDescription = description.trim();
    const cleanWebsite = website.trim();

    if (!cleanCompanyName) {
      toast.error("Company name is required.");
      return;
    }

    if (!cleanCity) {
      toast.error("City is required.");
      return;
    }

    if (cleanWebsite) {
      try {
        new URL(cleanWebsite);
      } catch {
        toast.error("Website must be a valid URL.");
        return;
      }
    }

    try {
      setSaving(true);

      await api.put("/me/company-profile", {
        companyName: cleanCompanyName,
        city: cleanCity,
        sector: cleanSector || undefined,
        description: cleanDescription || undefined,
        website: cleanWebsite || undefined,
      });

      const [profileResponse, profileStrengthResponse] = await Promise.all([
        api.get("/me"),
        api.get("/me/profile-strength"),
      ]);

      const updatedProfile: CompanyProfile | null = profileResponse?.data?.user?.companyProfile ?? null;
      if (updatedProfile) {
        setLogoUrl(updatedProfile.logoUrl ?? "");
      }
      setProfileStrength(profileStrengthResponse.data ?? null);

      toast.success("Company profile saved");
    } catch (e: any) {
      const data = e?.response?.data;
      const msg = data?.message || data?.error || e?.message || "Failed to save company profile";
      toast.error(String(msg));
    } finally {
      setSaving(false);
    }
  }

  const completionChecks = useMemo(
    () => [
      ["Logo", !!logoUrl.trim()],
      ["Company name", !!companyName.trim()],
      ["City", !!city.trim()],
      ["Description", !!description.trim()],
      ["Website", !!website.trim()],
      ["Verification", !!profileStrength?.verification?.isVerified],
    ],
    [logoUrl, companyName, city, description, website, profileStrength]
  );

  const completion =
    profileStrength?.completion ??
    Math.round((completionChecks.filter((item) => item[1]).length / completionChecks.length) * 100);

  if (loading) {
    return (
      <div className="page-container">
        <Card className="p-6">Loading company profile...</Card>
      </div>
    );
  }

  return (
    <div className="page-container space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[1.9rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card-hover)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <UserAvatar
                imageUrl={logoUrl}
                label={companyName.trim() || "Company profile"}
                sizeClassName="h-16 w-16"
                textClassName="text-lg"
              />
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-[var(--tifawin-neutral-900)]">
                    {companyName.trim() || "My company profile"}
                  </h1>
                  <VerifiedBadge
                    isVerified={!!profileStrength?.verification?.isVerified}
                    verifiedAt={profileStrength?.verification?.verifiedAt}
                  />
                </div>
                <p className="mt-2 max-w-xl text-[15px] leading-7 text-[var(--tifawin-neutral-700)]">
                  Present your company clearly so candidates can trust your brand and understand what makes your team worth joining.
                </p>
              </div>
            </div>
            <div className="amazigh-dots amazigh-dots--section" aria-hidden><span /><span /><span /><span /></div>
          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-[var(--tifawin-neutral-100)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#0066CC_0%,#009E49_35%,#FFD100_70%,#E11D48_100%)] transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="font-semibold text-[var(--tifawin-neutral-900)]">{completion}% complete</span>
            <span className="text-[var(--tifawin-neutral-700)]">A complete company profile builds trust</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {completionChecks.map(([label, ok]) => (
              <div key={String(label)} className="flex items-center justify-between rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-3">
                <span className="text-sm text-[var(--tifawin-neutral-700)]">{label}</span>
                <Badge className={ok ? "border-0 bg-[#009E49]/12 text-[#009E49]" : "border-0 bg-[#E11D48]/10 text-[#E11D48]"}>
                  {ok ? "Done" : "Missing"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[1.9rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
          <h2 className="text-xl font-bold text-[var(--tifawin-neutral-900)]">Trust and visibility</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--tifawin-neutral-700)]">
            Candidates respond more confidently when your company profile looks complete, credible, and easy to verify.
          </p>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-4">
              <div className="text-sm font-semibold text-[var(--tifawin-neutral-900)]">Verification status</div>
              <div className="mt-3">
                <VerifiedBadge
                  isVerified={!!profileStrength?.verification?.isVerified}
                  verifiedAt={profileStrength?.verification?.verifiedAt}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-4">
              <div className="text-sm font-semibold text-[var(--tifawin-neutral-900)]">Website presence</div>
              <div className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
                {website.trim()
                  ? "Your website gives candidates another trusted way to learn about your company."
                  : "Add your website to make your company easier to verify and explore."}
              </div>
            </div>

            {profileStrength?.missingFields?.length ? (
              <div className="rounded-2xl bg-[#FFD100]/16 px-4 py-4">
                <div className="text-sm font-semibold text-[var(--tifawin-neutral-900)]">Next trust steps</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profileStrength.missingFields.map((field) => (
                    <Badge key={field} className="border-0 bg-white/80 text-[#8A6A00]">
                      Add {formatFieldLabel(field)}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#009E49]/10 px-4 py-4 text-sm font-medium text-[#0b7a40]">
                Your trust profile is in a strong place for candidate review.
              </div>
            )}
          </div>
        </Card>
      </section>

      <Card className="rounded-[1.9rem] border-white/80 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-1">
            <label className="text-sm font-medium">Company name *</label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Tifawin Tech"
              required
            />
          </div>

          <div className="space-y-1 sm:col-span-1">
            <label className="text-sm font-medium">City *</label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Tunis"
              required
            />
          </div>

          <div className="space-y-1 sm:col-span-1">
            <label className="text-sm font-medium">Sector</label>
            <Input
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="Technology / Marketing / Industry"
            />
          </div>

          <div className="space-y-1 sm:col-span-1">
            <label className="text-sm font-medium">Website</label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://your-company.com"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell candidates about your company, how you work, and what makes your team distinctive."
              rows={6}
            />
          </div>

          <div className="sm:col-span-2 flex gap-3 pt-2">
            <Button
              type="submit"
              className="rounded-full bg-[var(--tifawin-primary)] px-5 text-white shadow-sm hover:bg-[var(--tifawin-primary-hover)]"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save company profile"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
