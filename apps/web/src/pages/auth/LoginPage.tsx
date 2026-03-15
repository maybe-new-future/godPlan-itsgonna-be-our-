import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const token = res.data.accessToken;

      localStorage.setItem("accessToken", token);

      toast.success("Welcome back 👋");
      navigate("/jobs");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container flex flex-col items-center">
      <Card className="w-full max-w-md p-6 sm:p-8 bg-white border border-gray-200/80 shadow-[var(--shadow-card)] rounded-xl space-y-5">
        <h1 className="text-2xl font-bold text-[var(--tifawin-neutral-900)]">
          Sign in
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--tifawin-neutral-900)]">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--tifawin-neutral-900)]">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-full bg-[var(--tifawin-primary)] hover:bg-[var(--tifawin-primary-hover)] text-white font-semibold py-2.5"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}