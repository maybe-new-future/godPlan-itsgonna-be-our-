import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import AdminLayout from "./layouts/AdminLayout";

import JobsPage from "./pages/jobs/JobsPage";
import JobDetailsPage from "./pages/jobs/JobDetailsPage";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

import CreateJobPage from "./pages/company/CreateJobPage";
import EditJobPage from "./pages/company/EditJobPage";
import MyJobsPage from "./pages/company/MyJobsPage";
import ApplicantsPage from "./pages/company/ApplicantsPage";
import CompanyProfilePage from "./pages/company/CompanyProfilePage";
import CompanyDashboardPage from "./pages/company/CompanyDashboardPage";

import CandidateProfilePage from "./pages/candidate/CandidateProfilePage";
import CandidateApplicationsPage from "./pages/candidate/CandidateApplicationsPage";
import SavedJobsPage from "./pages/candidate/SavedJobsPage";
import CandidateDashboardPage from "./pages/candidate/CandidateDashboardPage";
import CandidateOnboardingPage from "./pages/onboarding/CandidateOnboardingPage";
import CompanyOnboardingPage from "./pages/onboarding/CompanyOnboardingPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminJobsPage from "./pages/admin/AdminJobsPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import MessagesPage from "./pages/messages/MessagesPage";

import { getRoleFromToken, isLoggedIn } from "./auth/auth";
import { OnboardingGate, RequireOnboardingPage } from "./routes/OnboardingGate";
import RequireAdmin from "./routes/RequireAdmin";

function RequireCompany({ children }: { children: React.ReactElement }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (getRoleFromToken() !== "COMPANY") return <Navigate to="/jobs" replace />;
  return children;
}

function RequireCandidate({ children }: { children: React.ReactElement }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (getRoleFromToken() !== "CANDIDATE") return <Navigate to="/jobs" replace />;
  return children;
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return children;
}

function RequireMessaging({ children }: { children: React.ReactElement }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (getRoleFromToken() === "ADMIN") return <Navigate to="/jobs" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <OnboardingGate>
              <AppLayout />
            </OnboardingGate>
          }
        >
          <Route path="/" element={<Navigate to="/jobs" replace />} />

          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/onboarding/candidate"
            element={
              <RequireOnboardingPage role="CANDIDATE">
                <CandidateOnboardingPage />
              </RequireOnboardingPage>
            }
          />
          <Route
            path="/onboarding/company"
            element={
              <RequireOnboardingPage role="COMPANY">
                <CompanyOnboardingPage />
              </RequireOnboardingPage>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequireAuth>
                <NotificationsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/messages"
            element={
              <RequireMessaging>
                <MessagesPage />
              </RequireMessaging>
            }
          />

          <Route
            path="/candidate/dashboard"
            element={
              <RequireCandidate>
                <CandidateDashboardPage />
              </RequireCandidate>
            }
          />

          <Route
            path="/candidate/profile"
            element={
              <RequireCandidate>
                <CandidateProfilePage />
              </RequireCandidate>
            }
          />

          <Route
            path="/candidate/applications"
            element={
              <RequireCandidate>
                <CandidateApplicationsPage />
              </RequireCandidate>
            }
          />

          <Route
            path="/candidate/saved-jobs"
            element={
              <RequireCandidate>
                <SavedJobsPage />
              </RequireCandidate>
            }
          />

          <Route
            path="/company/dashboard"
            element={
              <RequireCompany>
                <CompanyDashboardPage />
              </RequireCompany>
            }
          />

          <Route
            path="/company/profile"
            element={
              <RequireCompany>
                <CompanyProfilePage />
              </RequireCompany>
            }
          />

          <Route
            path="/company/jobs"
            element={
              <RequireCompany>
                <MyJobsPage />
              </RequireCompany>
            }
          />

          <Route
            path="/company/jobs/new"
            element={
              <RequireCompany>
                <CreateJobPage />
              </RequireCompany>
            }
          />

          <Route
            path="/company/jobs/:id/edit"
            element={
              <RequireCompany>
                <EditJobPage />
              </RequireCompany>
            }
          />

          <Route
            path="/company/jobs/:id/applicants"
            element={
              <RequireCompany>
                <ApplicantsPage />
              </RequireCompany>
            }
          />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="jobs" element={<AdminJobsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/jobs" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
