import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../api/client";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";

type Role = "CANDIDATE" | "COMPANY";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CANDIDATE");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);

      await api.post("/auth/register", {
        email,
        password,
        role,
      });

      toast.success("Account created ✅ Please login.");
      navigate("/login");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Register failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container flex flex-col items-center">
      <Card className="w-full max-w-md p-6 sm:p-8 bg-white border border-gray-200/80 shadow-[var(--shadow-card)] rounded-xl space-y-5">
        <h1 className="text-2xl font-bold text-[var(--tifawin-neutral-900)]">
          Create your Tifawin account
        </h1>
        <p className="text-sm leading-6 text-[var(--tifawin-neutral-700)]">
          Join Tifawin to find jobs, hire candidates, and grow your career in Tunisia.
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--tifawin-neutral-900)]">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-lg border-gray-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--tifawin-neutral-900)]">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="rounded-lg border-gray-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--tifawin-neutral-900)]">I want to use Tifawin to</label>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setRole("CANDIDATE")}
                className={
                  role === "CANDIDATE"
                    ? "rounded-2xl border border-[var(--tifawin-primary)]/20 bg-[linear-gradient(135deg,rgba(0,102,204,0.08),rgba(255,255,255,0.98))] px-4 py-4 text-left shadow-sm"
                    : "rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left hover:bg-[var(--tifawin-neutral-50)]"
                }
              >
                <div className="font-semibold text-[var(--tifawin-neutral-900)]">I&apos;m looking for work</div>
                <div className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                  Find jobs and opportunities across Tunisia.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole("COMPANY")}
                className={
                  role === "COMPANY"
                    ? "rounded-2xl border border-[var(--tifawin-primary)]/20 bg-[linear-gradient(135deg,rgba(0,102,204,0.08),rgba(255,255,255,0.98))] px-4 py-4 text-left shadow-sm"
                    : "rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left hover:bg-[var(--tifawin-neutral-50)]"
                }
              >
                <div className="font-semibold text-[var(--tifawin-neutral-900)]">I&apos;m hiring</div>
                <div className="mt-1 text-sm text-[var(--tifawin-neutral-700)]">
                  Post jobs and hire candidates.
                </div>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full bg-[var(--tifawin-primary)] hover:bg-[var(--tifawin-primary-hover)] text-white font-semibold py-2.5"
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : role === "CANDIDATE"
              ? "Continue as Candidate"
              : "Continue as Company"}
          </Button>
        </form>

        <p className="text-sm text-[var(--tifawin-neutral-700)]">
          Already have an account?{" "}
          <Link className="font-medium text-[var(--tifawin-primary)] hover:underline" to="/login">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
