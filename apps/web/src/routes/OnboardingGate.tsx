import { ReactElement, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../api/client";
import { getRoleFromToken, isLoggedIn, type Role } from "../auth/auth";

type OnboardingStatus = {
  role: Role;
  isComplete: boolean;
  missingFields: string[];
};

function dashboardPathForRole(role: Role | null) {
  if (role === "CANDIDATE") return "/candidate/dashboard";
  if (role === "COMPANY") return "/company/dashboard";
  if (role === "ADMIN") return "/admin/dashboard";
  return "/jobs";
}

function onboardingPathForRole(role: Role | null) {
  if (role === "CANDIDATE") return "/onboarding/candidate";
  if (role === "COMPANY") return "/onboarding/company";
  return null;
}

function LoadingScreen() {
  return (
    <div className="page-container flex min-h-[55vh] items-center justify-center">
      <div className="rounded-[1.75rem] border border-white/80 bg-white px-6 py-5 text-sm text-[var(--tifawin-neutral-700)] shadow-[var(--shadow-card)]">
        Preparing your workspace...
      </div>
    </div>
  );
}

export function OnboardingGate({ children }: { children: ReactElement }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const loggedIn = isLoggedIn();
  const role = loggedIn ? getRoleFromToken() : null;
  const onboardingPath = onboardingPathForRole(role);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      if (!loggedIn || role === "ADMIN") {
        setStatus(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get<OnboardingStatus>("/me/onboarding-status");
        if (!cancelled) {
          setStatus(response.data);
        }
      } catch {
        if (!cancelled) {
          setStatus(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [loggedIn, role, location.pathname]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (loggedIn && role !== "ADMIN" && status && !status.isComplete && onboardingPath && location.pathname !== onboardingPath) {
    return <Navigate to={onboardingPath} replace />;
  }

  if (loggedIn && role !== "ADMIN" && status?.isComplete && onboardingPath && location.pathname === onboardingPath) {
    return <Navigate to={dashboardPathForRole(role)} replace />;
  }

  return children;
}

export function RequireOnboardingPage({
  children,
  role,
}: {
  children: ReactElement;
  role: Exclude<Role, "ADMIN">;
}) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const loggedIn = isLoggedIn();
  const tokenRole = loggedIn ? getRoleFromToken() : null;

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      if (!loggedIn || tokenRole !== role) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get<OnboardingStatus>("/me/onboarding-status");
        if (!cancelled) {
          setStatus(response.data);
        }
      } catch {
        if (!cancelled) {
          setStatus(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [loggedIn, tokenRole, role]);

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (tokenRole !== role) {
    return <Navigate to="/jobs" replace />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (status?.isComplete) {
    return <Navigate to={dashboardPathForRole(role)} replace />;
  }

  return children;
}
