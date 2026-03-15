import { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { getRoleFromToken, isLoggedIn } from "../../auth/auth";

type Job = {
  id: string;
  title: string;
  city?: string | null;
  contractType?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  description?: string | null;
};

export default function EditJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const loggedIn = isLoggedIn();
  const role = getRoleFromToken();
  const allowed = loggedIn && role === "COMPANY";

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [contractType, setContractType] = useState("CDI");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadJob() {
    if (!id) return;

    try {
      setLoading(true);
      const res = await api.get(`/jobs/${id}`);
      const job: Job = res.data.job;

      setTitle(job.title ?? "");
      setCity(job.city ?? "");
      setContractType(job.contractType ?? "CDI");
      setSalaryMin(job.salaryMin != null ? String(job.salaryMin) : "");
      setSalaryMax(job.salaryMax != null ? String(job.salaryMax) : "");
      setDescription(job.description ?? "");
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to load job"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJob();
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!allowed) {
      toast.error("Only COMPANY accounts can edit jobs.");
      return;
    }

    const cleanTitle = title.trim();
    const cleanCity = city.trim();
    const cleanContractType = contractType.trim();
    const cleanDescription = description.trim();

    const min = salaryMin.trim() === "" ? null : Number(salaryMin);
    const max = salaryMax.trim() === "" ? null : Number(salaryMax);

    if (!cleanTitle) {
      toast.error("Title is required.");
      return;
    }

    if (!cleanCity) {
      toast.error("City is required.");
      return;
    }

    if (!cleanDescription) {
      toast.error("Description is required.");
      return;
    }

    if (min !== null && Number.isNaN(min)) {
      toast.error("Salary min must be a valid number.");
      return;
    }

    if (max !== null && Number.isNaN(max)) {
      toast.error("Salary max must be a valid number.");
      return;
    }

    if (min !== null && min < 0) {
      toast.error("Salary min cannot be negative.");
      return;
    }

    if (max !== null && max < 0) {
      toast.error("Salary max cannot be negative.");
      return;
    }

    if (min !== null && max !== null && min > max) {
      toast.error("Salary min cannot be greater than salary max.");
      return;
    }

    try {
      setSaving(true);

      await api.put(`/jobs/${id}`, {
        title: cleanTitle,
        city: cleanCity,
        contractType: cleanContractType || null,
        salaryMin: min,
        salaryMax: max,
        description: cleanDescription,
      });

      toast.success("Job updated ✅");
      navigate("/company/jobs");
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;

      const msg =
        data?.message ||
        data?.error ||
        (Array.isArray(data?.errors) ? data.errors.join(", ") : null) ||
        e?.message ||
        "Update job failed";

      if (status === 401) toast.error("Please login first.");
      else if (status === 403) toast.error("Only COMPANY accounts can edit jobs.");
      else toast.error(String(msg));
    } finally {
      setSaving(false);
    }
  }

  if (!allowed) {
    return (
      <div className="max-w-xl mx-auto p-4">
        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Edit job</h1>
            <Badge className="bg-[#FFD100] text-black">Company only</Badge>
          </div>

          {!loggedIn ? (
            <>
              <div className="text-sm text-gray-600">
                You must login with a COMPANY account to edit jobs.
              </div>
              <Button asChild className="bg-[#0066CC] hover:bg-[#005bb8] text-white">
                <Link to="/login">Go to login</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="text-sm text-gray-600">
                Your account role is <b>{role ?? "UNKNOWN"}</b>. Only <b>COMPANY</b> can edit jobs.
              </div>
              <Button asChild className="bg-[#0066CC] hover:bg-[#005bb8] text-white">
                <Link to="/jobs">Back to jobs</Link>
              </Button>
            </>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Edit job</h1>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#E11D48]" />
          <span className="h-2 w-2 rounded-full bg-[#FFD100]" />
          <span className="h-2 w-2 rounded-full bg-[#009E49]" />
          <span className="h-2 w-2 rounded-full bg-[#0066CC]" />
        </div>
      </div>

      <Card className="p-6 space-y-4">
        {loading ? (
          <div className="text-sm">Loading job...</div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Frontend Developer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm">City *</label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Tunis"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm">Contract type</label>
              <Input
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                placeholder="CDI / CDD / Freelance"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm">Salary min</label>
                <Input
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="1200"
                  min="0"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm">Salary max</label>
                <Input
                  type="number"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  placeholder="2000"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm">Description *</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write job details..."
                rows={6}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="bg-[#009E49] hover:bg-[#008a40] text-white"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>

              <Button
                type="button"
                className="bg-[#0066CC] hover:bg-[#005bb8] text-white"
                onClick={() => navigate("/company/jobs")}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}