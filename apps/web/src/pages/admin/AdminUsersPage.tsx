import { useEffect, useMemo, useState } from "react";
import { Search, Trash2, UserRound, Building2, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../api/client";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { formatDate, getApiErrorMessage } from "./admin.utils";

type UserRole = "CANDIDATE" | "COMPANY" | "ADMIN";

type AdminUser = {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  candidateProfile: {
    fullName?: string | null;
    city?: string | null;
    experienceLevel?: string | null;
  } | null;
  companyProfile: {
    companyName?: string | null;
    city?: string | null;
    sector?: string | null;
  } | null;
  _count: {
    jobs: number;
    applications: number;
    savedJobs: number;
  };
};

type UsersResponse = {
  users: AdminUser[];
  page: number;
  totalPages: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);

  async function loadUsers(nextPage = page) {
    try {
      setLoading(true);
      const response = await api.get<UsersResponse>("/admin/users", {
        params: {
          page: nextPage,
          limit: 12,
          search: search || undefined,
          role: role || undefined,
          isActive: status || undefined,
        },
      });

      setUsers(response.data.users ?? []);
      setPage(response.data.page ?? nextPage);
      setTotalPages(Math.max(1, response.data.totalPages ?? 1));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers(page);
  }, [page, role, search, status]);

  const summary = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.isActive).length,
      candidates: users.filter((user) => user.role === "CANDIDATE").length,
      companies: users.filter((user) => user.role === "COMPANY").length,
    }),
    [users]
  );

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function toggleStatus(user: AdminUser) {
    setActiveAction(`status-${user.id}`);

    try {
      await api.patch(`/admin/users/${user.id}/status`, { isActive: !user.isActive });
      toast.success(user.isActive ? "User deactivated" : "User reactivated");
      loadUsers(page);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update user status"));
    } finally {
      setActiveAction(null);
    }
  }

  async function deleteUser(user: AdminUser) {
    const label = user.candidateProfile?.fullName || user.companyProfile?.companyName || user.email;
    if (!window.confirm(`Delete ${label}? This action cannot be undone.`)) return;

    setActiveAction(`delete-${user.id}`);

    try {
      await api.delete(`/admin/users/${user.id}`);
      toast.success("User deleted");
      loadUsers(page);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete user"));
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--tifawin-neutral-900)]">
            Manage users
          </h2>
          <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)] sm:text-base">
            Review role distribution, activity state, and account ownership context.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Visible", summary.total],
            ["Active", summary.active],
            ["Candidates", summary.candidates],
            ["Companies", summary.companies],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/80 bg-white px-4 py-3 shadow-[var(--shadow-card)]">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tifawin-neutral-700)]">
                {label}
              </div>
              <div className="mt-2 text-2xl font-bold text-[var(--tifawin-neutral-900)]">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <Card className="rounded-[1.5rem] border-white/80 bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
        <form className="grid gap-3 md:grid-cols-[minmax(0,1.8fr)_180px_180px_auto]" onSubmit={submitSearch}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--tifawin-neutral-700)]" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by email, candidate, or company"
              className="h-11 rounded-2xl border-gray-200 bg-[var(--tifawin-neutral-50)] pl-10"
            />
          </div>

          <select
            value={role}
            onChange={(event) => {
              setPage(1);
              setRole(event.target.value);
            }}
            className="h-11 rounded-2xl border border-gray-200 bg-[var(--tifawin-neutral-50)] px-3 text-sm text-[var(--tifawin-neutral-900)] outline-none"
          >
            <option value="">All roles</option>
            <option value="CANDIDATE">Candidate</option>
            <option value="COMPANY">Company</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            className="h-11 rounded-2xl border border-gray-200 bg-[var(--tifawin-neutral-50)] px-3 text-sm text-[var(--tifawin-neutral-900)] outline-none"
          >
            <option value="">All status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <Button
            type="submit"
            className="h-11 rounded-2xl bg-[var(--tifawin-primary)] text-white hover:bg-[var(--tifawin-primary-hover)]"
          >
            Apply filters
          </Button>
        </form>
      </Card>

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-4 h-4 w-52" />
              <Skeleton className="mt-5 h-20 w-full" />
            </Card>
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="rounded-[1.5rem] border-white/80 bg-white p-8 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--tifawin-neutral-50)]">
            <Users className="h-6 w-6 text-[var(--tifawin-neutral-700)]" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[var(--tifawin-neutral-900)]">No users found</h3>
          <p className="mt-2 text-sm text-[var(--tifawin-neutral-700)]">
            Try adjusting your search or filters to surface matching accounts.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {users.map((user) => {
            const previewName = user.candidateProfile?.fullName || user.companyProfile?.companyName || "No profile preview";
            const busy = activeAction?.includes(user.id);

            return (
              <Card key={user.id} className="rounded-[1.5rem] border-white/80 bg-white p-5 shadow-[var(--shadow-card)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-[var(--tifawin-neutral-900)]">
                        {previewName}
                      </h3>
                      <Badge
                        className={
                          user.role === "ADMIN"
                            ? "border-0 bg-[#E11D48]/10 text-[#E11D48]"
                            : user.role === "COMPANY"
                              ? "border-0 bg-[#009E49]/12 text-[#009E49]"
                              : "border-0 bg-[#0066CC]/10 text-[#0066CC]"
                        }
                      >
                        {user.role}
                      </Badge>
                      <Badge
                        className={
                          user.isActive
                            ? "border-0 bg-[#009E49]/12 text-[#009E49]"
                            : "border-0 bg-[var(--tifawin-neutral-100)] text-[var(--tifawin-neutral-700)]"
                        }
                      >
                        {user.isActive ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </div>
                    <p className="mt-2 break-all text-sm text-[var(--tifawin-neutral-700)]">{user.email}</p>
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    {user.candidateProfile ? (
                      <div className="rounded-2xl bg-[#0066CC]/8 p-2.5 text-[#0066CC]">
                        <UserRound className="h-4 w-4" />
                      </div>
                    ) : user.companyProfile ? (
                      <div className="rounded-2xl bg-[#009E49]/10 p-2.5 text-[#009E49]">
                        <Building2 className="h-4 w-4" />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tifawin-neutral-700)]">
                      Jobs
                    </div>
                    <div className="mt-2 text-xl font-bold text-[var(--tifawin-neutral-900)]">{user._count.jobs}</div>
                  </div>
                  <div className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tifawin-neutral-700)]">
                      Applications
                    </div>
                    <div className="mt-2 text-xl font-bold text-[var(--tifawin-neutral-900)]">{user._count.applications}</div>
                  </div>
                  <div className="rounded-2xl bg-[var(--tifawin-neutral-50)] px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tifawin-neutral-700)]">
                      Saved
                    </div>
                    <div className="mt-2 text-xl font-bold text-[var(--tifawin-neutral-900)]">{user._count.savedJobs}</div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-[var(--tifawin-neutral-700)]">
                  <span>Joined {formatDate(user.createdAt)}</span>
                  {user.candidateProfile?.city && <span>• {user.candidateProfile.city}</span>}
                  {user.companyProfile?.city && <span>• {user.companyProfile.city}</span>}
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    className="rounded-2xl border-gray-200 bg-white text-[var(--tifawin-neutral-900)] hover:bg-[var(--tifawin-neutral-100)]"
                    onClick={() => toggleStatus(user)}
                    disabled={busy}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {user.isActive ? "Deactivate" : "Reactivate"}
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-2xl"
                    onClick={() => deleteUser(user)}
                    disabled={busy}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete user
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/80 bg-white p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[var(--tifawin-neutral-700)]">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-2xl border-gray-200 bg-white"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl border-gray-200 bg-white"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
