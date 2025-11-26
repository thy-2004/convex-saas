import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { api } from "@cvx/_generated/api";
import { Id, Doc } from "@cvx/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import {
  Users,
  Shield,
  Server,
  Globe2,
  Activity,
  CalendarClock,
  AlertTriangle,
  Trash2,
  Plus,
  Edit3,
  BarChart3,
  Key,
  Eye,
  EyeOff,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  X,
  Settings,
  FileDown,
  ArrowUpDown,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  Zap,
  ExternalLink,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { RegionSelect } from "@/ui/region-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/ui/dialog";
import { generateKey } from "@/utils/generateKey";

export const Route = createFileRoute(
  "/_app/_auth/dashboard/apps/$appId/"
)({
  component: AppOverviewPage,
  loader: async ({ params }) => {
    // Ensure we have the appId
    if (!params.appId) {
      throw new Error("App ID is required");
    }
    return { appId: params.appId };
  },
});

type TabKey = "overview" | "users" | "roles" | "deployments" | "analytics" | "env-vars" | "settings" | "api-keys";

function AppOverviewPage() {
  const { appId } = Route.useParams();
  const navigate = useNavigate();
  const typedAppId = appId as Id<"apps">;

  const app = useQuery(api.apps.getApp, { appId: typedAppId });
  const [tab, setTab] = useState<TabKey>("overview");

  const users = useQuery(api.appUsers.listUsers, { appId: typedAppId }) ?? [];
  const roles = useQuery(api.roles.listRoles, { appId: typedAppId }) ?? [];
  const deployments =
    useQuery(api.deployments.listDeployments, { appId: typedAppId }) ?? [];

  const handleBackToDashboard = () => {
    navigate({
      to: "/dashboard",
    });
  };

  if (!app) {
    return (
      <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-black/60 via-slate-950 to-black/90 p-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
        <p className="text-sm text-emerald-200/70">Loading app…</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-black/60 via-slate-950 to-black/90 p-6 shadow-[0_0_40px_rgba(16,185,129,0.3)] space-y-8">
      {/* HEADER WITH BACK BUTTON */}
      <div className="flex items-center justify-between">
        <Button
          onClick={handleBackToDashboard}
          variant="ghost"
          className="flex items-center gap-2 text-emerald-200/70 hover:text-emerald-100 hover:bg-emerald-500/10 border border-emerald-500/20"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Trở về Dashboard</span>
        </Button>
        <span className="hidden text-xs font-medium text-emerald-300/70 md:inline">
          App ID: <span className="font-mono">{String(app._id)}</span>
        </span>
      </div>

      {/* TABS */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 rounded-full border border-emerald-500/20 bg-black/40 px-1 py-1 backdrop-blur">
          <TabButton
            label="Overview"
            tab="overview"
            current={tab}
            setTab={setTab}
          />
          <TabButton
            label="Users"
            tab="users"
            current={tab}
            setTab={setTab}
            icon={<Users className="h-4 w-4" />}
          />
          <TabButton
            label="Roles"
            tab="roles"
            current={tab}
            setTab={setTab}
            icon={<Shield className="h-4 w-4" />}
          />
          <TabButton
            label="Deployments"
            tab="deployments"
            current={tab}
            setTab={setTab}
            icon={<Server className="h-4 w-4" />}
          />
          <TabButton
            label="Analytics"
            tab="analytics"
            current={tab}
            setTab={setTab}
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <TabButton
            label="Env Vars"
            tab="env-vars"
            current={tab}
            setTab={setTab}
            icon={<Key className="h-4 w-4" />}
          />
          <TabButton
            label="Settings"
            tab="settings"
            current={tab}
            setTab={setTab}
            icon={<Settings className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* CONTENT */}
      {tab === "overview" && (
        <OverviewTab app={app} deployments={deployments} />
      )}
      {tab === "users" && (
        <UsersTab appId={typedAppId} users={users} roles={roles} />
      )}
      {tab === "roles" && (
        <RolesTab appId={typedAppId} roles={roles} />
      )}
      {tab === "deployments" && (
        <DeploymentsTab appId={typedAppId} deployments={deployments} />
      )}
      {tab === "analytics" && <AnalyticsTab appId={typedAppId} />}
      {tab === "env-vars" && <EnvironmentVariablesTab appId={typedAppId} />}
      {tab === "settings" && <SettingsTab app={app} />}
      {tab === "api-keys" && <ApiKeysTab appId={typedAppId} />}

    </div>
  );
}

/* ---------------- OVERVIEW ---------------- */

function OverviewTab({
  app,
  deployments,
}: {
  app: Doc<"apps">;
  deployments: Doc<"deployments">[];
}) {
  const deleteAppMutation = useMutation(api.apps.deleteApp);
  
  // Get additional data for overview
  const users = useQuery(api.appUsers.listUsers, { appId: app._id }) ?? [];
  const roles = useQuery(api.roles.listRoles, { appId: app._id }) ?? [];
  const envVars = useQuery(api.environmentVariables.list, { appId: app._id }) ?? [];
  const apiKeys = useQuery(api.apiKeys.list, { appId: app._id }) ?? [];
  const summary = useQuery(api.analytics.getSummary, { appId: app._id, days: 7 });
  const recentEvents = useQuery(api.analytics.getEvents, { appId: app._id, limit: 5 });

  const activeDeployments = deployments.filter((d) => d.status === "active").length;

  return (
    <div className="space-y-6">
      {/* QUICK STATS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<Globe2 className="h-5 w-5 text-emerald-300" />}
          label="Region"
          value={app.region}
        />
        <Stat
          icon={<CalendarClock className="h-5 w-5 text-emerald-300" />}
          label="Created"
          value={new Date(app.createdAt).toLocaleDateString()}
        />
        <Stat
          icon={<Activity className="h-5 w-5 text-emerald-400" />}
          label="Status"
          value="Active"
          badge
        />
        <Stat
          icon={<Server className="h-5 w-5 text-blue-300" />}
          label="Deployments"
          value={`${activeDeployments}/${deployments.length}`}
        />
      </div>

      {/* ADDITIONAL STATS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<Users className="h-5 w-5 text-purple-300" />}
          label="Users"
          value={users.length.toString()}
        />
        <Stat
          icon={<Shield className="h-5 w-5 text-yellow-300" />}
          label="Roles"
          value={roles.length.toString()}
        />
        <Stat
          icon={<Key className="h-5 w-5 text-cyan-300" />}
          label="API Keys"
          value={apiKeys.length.toString()}
        />
        <Stat
          icon={<Key className="h-5 w-5 text-orange-300" />}
          label="Env Variables"
          value={envVars.length.toString()}
        />
      </div>

      {/* MAIN INFO GRID */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* APPLICATION DETAILS */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-6 shadow-[0_0_32px_rgba(16,185,129,0.25)] space-y-4">
          <h2 className="text-lg font-semibold text-emerald-100 flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-emerald-300" /> Application Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoRow label="Name" value={app.name ?? "Untitled app"} />
          <InfoRow label="Region" value={app.region} />
          <InfoRow label="Environment" value="Production" />
          <InfoRow
            label="Deployments"
              value={`${activeDeployments} active / ${deployments.length} total`}
          />
            {app.description && (
              <div className="col-span-2">
                <InfoRow label="Description" value={app.description} />
        </div>
            )}
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-6 shadow-[0_0_32px_rgba(16,185,129,0.25)] space-y-4">
          <h2 className="text-lg font-semibold text-emerald-100 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-300" /> Quick Stats (7 days)
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-200/70">API Calls</span>
              <span className="text-sm font-semibold text-emerald-50">
                {summary?.totalApiCalls?.toLocaleString() ?? "0"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-200/70">Errors</span>
              <span className="text-sm font-semibold text-red-300">
                {summary?.totalErrors?.toLocaleString() ?? "0"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-200/70">Error Rate</span>
              <span className="text-sm font-semibold text-emerald-50">
                {summary?.errorRate?.toFixed(2) ?? "0.00"}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-200/70">Active Users</span>
              <span className="text-sm font-semibold text-emerald-50">
                {summary?.activeUsers?.toLocaleString() ?? "0"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      {recentEvents && recentEvents.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-6 shadow-[0_0_32px_rgba(16,185,129,0.25)]">
          <h2 className="text-lg font-semibold text-emerald-100 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-300" /> Recent Activity
          </h2>
          <div className="space-y-2">
            {recentEvents.slice(0, 5).map((event) => (
              <div
                key={event._id}
                className="flex items-center justify-between p-3 rounded-lg bg-black/40 hover:bg-emerald-500/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-emerald-50">
                      {event.eventType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-emerald-200/60">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                {event.metadata && (
                  <span className="text-xs text-emerald-200/50 max-w-[200px] truncate">
                    {JSON.stringify(event.metadata).slice(0, 30)}...
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div className="grid gap-4 md:grid-cols-3">
        <button
          onClick={() => {
            const usersTab = document.querySelector('[data-tab="users"]') as HTMLElement;
            usersTab?.click();
          }}
          className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_32px_rgba(16,185,129,0.25)] hover:border-emerald-500/40 transition-all group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-500/20 p-2 group-hover:bg-emerald-500/30 transition-colors">
              <Users className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-100">Manage Users</p>
              <p className="text-xs text-emerald-200/60">{users.length} users</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            const deploymentsTab = document.querySelector('[data-tab="deployments"]') as HTMLElement;
            deploymentsTab?.click();
          }}
          className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_32px_rgba(16,185,129,0.25)] hover:border-emerald-500/40 transition-all group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-500/20 p-2 group-hover:bg-blue-500/30 transition-colors">
              <Server className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-100">Deployments</p>
              <p className="text-xs text-emerald-200/60">{deployments.length} deployments</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            const analyticsTab = document.querySelector('[data-tab="analytics"]') as HTMLElement;
            analyticsTab?.click();
          }}
          className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_32px_rgba(16,185,129,0.25)] hover:border-emerald-500/40 transition-all group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-500/20 p-2 group-hover:bg-purple-500/30 transition-colors">
              <BarChart3 className="h-5 w-5 text-purple-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-100">View Analytics</p>
              <p className="text-xs text-emerald-200/60">See detailed metrics</p>
            </div>
          </div>
        </button>
      </div>

      {/* DANGER ZONE */}
      <div className="rounded-2xl border border-red-500/40 bg-gradient-to-br from-red-950/90 via-red-950/40 to-transparent p-5 space-y-3 shadow-[0_0_30px_rgba(248,113,113,0.35)]">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <h2 className="text-base font-semibold text-red-200">
            Danger zone
          </h2>
        </div>
        <p className="text-sm text-red-200/80">
          Deleting this app is permanent and cannot be undone. All data and
          configuration associated with this app will be removed.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={async () => {
            if (!confirm("Are you sure you want to delete this app? This action cannot be undone.")) return;

            try {
            await deleteAppMutation({ appId: app._id });
            window.location.href = "/_app/_auth/dashboard/apps";
            } catch (error: any) {
              alert(error.message || "Failed to delete app");
            }
          }}
          className="bg-red-600/80 text-red-50 shadow-[0_0_20px_rgba(255,0,0,0.5)] hover:bg-red-500"
        >
          Delete this app
        </Button>
      </div>
    </div>
  );
}

/* ---------------- USERS ---------------- */

function UsersTab({
  appId,
  users,
  roles,
}: {
  appId: Id<"apps">;
  users: Doc<"appUsers">[];
  roles: Doc<"roles">[];
}) {
  const createUser = useMutation(api.appUsers.createUser);
  const updateUser = useMutation(api.appUsers.updateUser);
  const deleteUser = useMutation(api.appUsers.deleteUser);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<Id<"appUsers">>>(new Set());
  const [sortBy, setSortBy] = useState<"email" | "name" | "created">("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const name = String(form.get("name") || "").trim();
    const roleId = String(form.get("roleId") || "");

    if (!email) return;

    try {
    await createUser({
      appId,
      email,
      name: name || undefined,
      roleId: roleId ? (roleId as Id<"roles">) : undefined,
    });
    e.currentTarget.reset();
    } catch (error: any) {
      alert(error.message || "Failed to create user");
    }
  };

  const handleUpdateRole = async (userId: Id<"appUsers">, roleId: string) => {
    try {
    await updateUser({
      userId,
      roleId: roleId ? (roleId as Id<"roles">) : undefined,
    });
    } catch (error: any) {
      alert(error.message || "Failed to update user");
    }
  };

  const handleDelete = async (userId: Id<"appUsers">) => {
    if (!confirm("Delete this user?")) return;
    try {
    await deleteUser({ userId });
    } catch (error: any) {
      alert(error.message || "Failed to delete user");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    if (!confirm(`Delete ${selectedUsers.size} selected user(s)?`)) return;
    try {
      await Promise.all(Array.from(selectedUsers).map((id) => deleteUser({ userId: id })));
      setSelectedUsers(new Set());
    } catch (error: any) {
      alert(error.message || "Failed to delete users");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Email", "Name", "Role", "Created"];
    const rows = filteredUsers.map((u) => [
      u.email,
      u.name || "",
      roleName(u.roleId),
      new Date(u.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.[0].toUpperCase() || "?";
  };

  const roleName = (roleId?: Id<"roles">) =>
    roles.find((r) => r._id === roleId)?.name ?? "No role";

  // Filter and sort users
  let filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole =
      filterRole === "all" ||
      (filterRole === "no-role" && !u.roleId) ||
      (filterRole !== "no-role" && u.roleId === filterRole);

    return matchesSearch && matchesRole;
  });

  // Sort users
  filteredUsers = [...filteredUsers].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "email") {
      comparison = a.email.localeCompare(b.email);
    } else if (sortBy === "name") {
      comparison = (a.name || "").localeCompare(b.name || "");
    } else if (sortBy === "created") {
      comparison = a.createdAt - b.createdAt;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const toggleSelectUser = (userId: Id<"appUsers">) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u._id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* SEARCH & FILTER */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-200/50" />
          <Input
            placeholder="Search users by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-black/60 border-emerald-500/30 text-sm placeholder:text-emerald-200/40 focus-visible:ring-emerald-400/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-200/50 hover:text-emerald-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-emerald-200/70" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="h-9 rounded-xl border border-emerald-500/25 bg-black/70 px-3 text-xs text-emerald-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="all">All Roles</option>
            <option value="no-role">No Role</option>
            {roles.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-emerald-200/60">
          {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* FORM CREATE USER */}
      <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-5 shadow-[0_0_30px_rgba(16,185,129,0.25)] space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2 text-emerald-100">
          <Users className="h-4 w-4 text-emerald-300" /> Invite user
        </h2>
        <form
          onSubmit={handleCreate}
          className="grid gap-3 md:grid-cols-[2fr,1.5fr,1.2fr,auto]"
        >
          <Input
            name="email"
            type="email"
            placeholder="user@example.com"
            className="bg-black/60 border-emerald-500/30 text-sm placeholder:text-emerald-200/40 focus-visible:ring-emerald-400/60"
            required
          />
          <Input
            name="name"
            placeholder="Name (optional)"
            className="bg-black/60 border-emerald-500/20 text-sm placeholder:text-emerald-200/35 focus-visible:ring-emerald-400/60"
          />
          <select
            name="roleId"
            className="h-9 rounded-xl border border-emerald-500/25 bg-black/70 px-3 text-xs text-emerald-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="">No role</option>
            {roles.map((r) => (
              <option key={r._id} value={String(r._id)}>
                {r.name}
              </option>
            ))}
          </select>
          <Button
            type="submit"
            size="sm"
            className="rounded-xl bg-emerald-500/90 text-black shadow-[0_0_18px_rgba(16,185,129,0.7)] hover:bg-emerald-400"
          >
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </form>
      </div>

      {/* BULK ACTIONS & EXPORT */}
      {(selectedUsers.size > 0 || filteredUsers.length > 0) && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {selectedUsers.size > 0 && (
              <>
                <span className="text-sm text-emerald-200/80">
                  {selectedUsers.size} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Delete Selected
                </Button>
              </>
            )}
          </div>
          {filteredUsers.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportCSV}
              className="text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10"
            >
              <FileDown className="mr-1 h-4 w-4" /> Export CSV
            </Button>
          )}
        </div>
      )}

      {/* TABLE USERS */}
      <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-black/60 shadow-[0_0_32px_rgba(15,118,110,0.4)]">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-emerald-500/15 via-transparent to-emerald-500/10 border-b border-emerald-500/30 text-emerald-100/80">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-emerald-500/50 bg-black/40"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th 
                className="px-4 py-3 text-left font-medium cursor-pointer hover:text-emerald-100 transition-colors"
                onClick={() => {
                  if (sortBy === "email") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("email");
                    setSortOrder("asc");
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  Email
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th 
                className="px-4 py-3 text-left font-medium cursor-pointer hover:text-emerald-100 transition-colors"
                onClick={() => {
                  if (sortBy === "created") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("created");
                    setSortOrder("desc");
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  Created
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr
                key={u._id}
                className="border-t border-emerald-500/10 bg-black/40 transition-colors hover:bg-emerald-500/5"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(u._id)}
                    onChange={() => toggleSelectUser(u._id)}
                    className="rounded border-emerald-500/50 bg-black/40"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 text-xs font-semibold text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                      {getInitials(u.name, u.email)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-emerald-50">
                  {u.name || "—"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-emerald-200/50" />
                    <span className="font-mono text-xs text-emerald-50">
                      {u.email}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <select
                      defaultValue={u.roleId ? String(u.roleId) : ""}
                      onChange={(e) =>
                        handleUpdateRole(u._id, e.currentTarget.value)
                      }
                      className="h-8 rounded-xl border border-emerald-500/30 bg-black/70 px-3 text-xs text-emerald-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
                    >
                      <option value="">No role</option>
                      {roles.map((r) => (
                        <option key={r._id} value={String(r._id)}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <span className="inline-flex w-fit items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                      {roleName(u.roleId)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-200/60">
                    <Clock className="h-3 w-3" />
                    {new Date(u.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-blue-500/10"
                      onClick={() => {
                        const email = `mailto:${u.email}`;
                        window.location.href = email;
                      }}
                      title="Send email"
                    >
                      <Mail className="h-4 w-4 text-blue-400" />
                    </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-red-500/10"
                    onClick={() => handleDelete(u._id)}
                      title="Delete user"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-emerald-200/70"
                >
                  {searchQuery || filterRole !== "all"
                    ? "No users match your filters"
                    : "No users yet. Invite someone above ✨"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- ROLES ---------------- */

function RolesTab({
  appId,
  roles,
}: {
  appId: Id<"apps">;
  roles: Doc<"roles">[];
}) {
  const createRole = useMutation(api.roles.createRole);
  const updateRole = useMutation(api.roles.updateRole);
  const deleteRole = useMutation(api.roles.deleteRole);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"roles"> | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  // Permission groups for better organization
  const permissionGroups = {
    Users: ["users.read", "users.write", "users.delete", "users.invite"],
    Roles: ["roles.read", "roles.write", "roles.delete"],
    Deployments: ["deployments.read", "deployments.write", "deployments.delete", "deployments.manage"],
    Analytics: ["analytics.read", "analytics.export"],
    Settings: ["settings.read", "settings.write"],
    API: ["api.keys.read", "api.keys.write", "api.keys.delete"],
    Env: ["env.read", "env.write", "env.delete"],
  };

  const allPermissions = Object.values(permissionGroups).flat();

  // Role templates
  const roleTemplates = {
    Admin: {
      name: "Admin",
      description: "Full access to all features",
      permissions: allPermissions,
    },
    Editor: {
      name: "Editor",
      description: "Can read and write most resources",
      permissions: [
        "users.read", "users.write",
        "roles.read",
        "deployments.read", "deployments.write",
        "analytics.read",
        "settings.read",
        "api.keys.read",
        "env.read", "env.write",
      ],
    },
    Viewer: {
      name: "Viewer",
      description: "Read-only access",
      permissions: [
        "users.read",
        "roles.read",
        "deployments.read",
        "analytics.read",
        "settings.read",
        "api.keys.read",
        "env.read",
      ],
    },
  };

  const filteredRoles = roles.filter((r) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(query) ||
      r.description?.toLowerCase().includes(query) ||
      r.permissions.some((p) => p.toLowerCase().includes(query))
    );
  });

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      if (editingId) {
        await updateRole({
          roleId: editingId,
          name: formData.name,
          description: formData.description || undefined,
          permissions: formData.permissions,
        });
        setEditingId(null);
      } else {
    await createRole({
      appId,
          name: formData.name,
          description: formData.description || undefined,
          permissions: formData.permissions,
        });
      }
      setShowCreateForm(false);
      setFormData({ name: "", description: "", permissions: [] });
    } catch (error: any) {
      alert(error.message || "Failed to save role");
    }
  };

  const handleEdit = (role: Doc<"roles">) => {
    setEditingId(role._id);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions,
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (roleId: Id<"roles">) => {
    if (!confirm("Delete this role? Users with this role will lose their permissions.")) return;
    try {
    await deleteRole({ roleId });
    } catch (error: any) {
      alert(error.message || "Failed to delete role");
    }
  };

  const handleCopy = async (role: Doc<"roles">) => {
    setFormData({
      name: `${role.name} (Copy)`,
      description: role.description || "",
      permissions: role.permissions,
    });
    setEditingId(null);
    setShowCreateForm(true);
  };

  const handleTemplate = (template: typeof roleTemplates.Admin) => {
    setFormData({
      name: template.name,
      description: template.description,
      permissions: template.permissions,
    });
    setEditingId(null);
    setShowCreateForm(true);
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const toggleGroup = (groupPermissions: string[]) => {
    const allSelected = groupPermissions.every((p) => formData.permissions.includes(p));
    setFormData((prev) => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter((p) => !groupPermissions.includes(p))
        : [...new Set([...prev.permissions, ...groupPermissions])],
    }));
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Description", "Permissions", "Created"];
    const rows = filteredRoles.map((r) => [
      r.name,
      r.description || "",
      r.permissions.join("; "),
      new Date(r.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roles-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* HEADER WITH EXPORT */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-200/50" />
          <Input
            placeholder="Search roles by name, description, or permissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-black/60 border-emerald-500/30 text-sm placeholder:text-emerald-200/40 focus-visible:ring-emerald-400/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-200/50 hover:text-emerald-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {filteredRoles.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportCSV}
            className="text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10"
          >
            <FileDown className="mr-1 h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      {/* ROLE TEMPLATES */}
      <div className="grid gap-3 md:grid-cols-3">
        {Object.entries(roleTemplates).map(([key, template]) => (
          <button
            key={key}
            onClick={() => handleTemplate(template)}
            className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:border-emerald-500/40 transition-all text-left group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-emerald-300" />
              <span className="font-semibold text-emerald-100">{template.name}</span>
            </div>
            <p className="text-xs text-emerald-200/60 mb-2">{template.description}</p>
            <p className="text-[10px] text-emerald-200/50">
              {template.permissions.length} permissions
            </p>
          </button>
        ))}
      </div>

      {/* FORM CREATE/EDIT ROLE */}
      {showCreateForm && (
        <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-6 shadow-[0_0_30px_rgba(16,185,129,0.25)] space-y-4">
          <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2 text-emerald-100">
              <Shield className="h-4 w-4 text-emerald-300" />
              {editingId ? "Edit role" : "Create role"}
        </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreateForm(false);
                setEditingId(null);
                setFormData({ name: "", description: "", permissions: [] });
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-emerald-200/80 mb-1">
                  Role Name *
                </label>
          <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. admin, editor, viewer"
                  className="bg-black/60 border-emerald-500/30 text-sm"
            required
          />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-200/80 mb-1">
                  Description
                </label>
          <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="bg-black/60 border-emerald-500/30 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-emerald-200/80 mb-2">
                Permissions ({formData.permissions.length} selected)
              </label>
              <div className="rounded-lg border border-emerald-500/20 bg-black/40 p-4 space-y-4 max-h-64 overflow-y-auto">
                {Object.entries(permissionGroups).map(([groupName, groupPermissions]) => {
                  const allSelected = groupPermissions.every((p) => formData.permissions.includes(p));
                  const someSelected = groupPermissions.some((p) => formData.permissions.includes(p));
                  return (
                    <div key={groupName} className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(input) => {
                            if (input) input.indeterminate = someSelected && !allSelected;
                          }}
                          onChange={() => toggleGroup(groupPermissions)}
                          className="rounded border-emerald-500/50"
                        />
                        <span className="text-sm font-medium text-emerald-100">{groupName}</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2 ml-6">
                        {groupPermissions.map((permission) => (
                          <label
                            key={permission}
                            className="flex items-center gap-2 cursor-pointer hover:bg-emerald-500/5 p-1 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission)}
                              onChange={() => togglePermission(permission)}
                              className="rounded border-emerald-500/50"
                            />
                            <span className="text-xs text-emerald-200/80">{permission}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
          <Button
            type="submit"
            className="rounded-xl bg-emerald-500/90 text-black shadow-[0_0_18px_rgba(16,185,129,0.7)] hover:bg-emerald-400"
          >
                {editingId ? "Update" : "Create"} Role
          </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingId(null);
                  setFormData({ name: "", description: "", permissions: [] });
                }}
              >
                Cancel
              </Button>
            </div>
        </form>
      </div>
      )}

      {!showCreateForm && (
        <Button
          onClick={() => setShowCreateForm(true)}
          className="rounded-xl bg-emerald-500/90 text-black shadow-[0_0_18px_rgba(16,185,129,0.7)] hover:bg-emerald-400"
        >
          <Plus className="mr-1 h-4 w-4" /> Create Role
        </Button>
      )}

      {/* TABLE ROLES */}
      <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-black/60 shadow-[0_0_32px_rgba(15,118,110,0.4)]">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-emerald-500/15 via-transparent to-emerald-500/10 border-b border-emerald-500/30 text-emerald-100/80">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Name</th>
              <th className="px-4 py-2 text-left font-medium">Description</th>
              <th className="px-4 py-2 text-left font-medium">Permissions</th>
              <th className="px-4 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map((r) => (
              <tr
                key={r._id}
                className="border-t border-emerald-500/10 bg-black/40 transition-colors hover:bg-emerald-500/5"
              >
                <td className="px-4 py-2 font-medium text-emerald-50">
                  {r.name}
                </td>
                <td className="px-4 py-2 text-emerald-100/70">
                  {r.description || "—"}
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {r.permissions.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-1 rounded-full bg-emerald-500/10 text-[11px] font-medium text-emerald-200"
                      >
                        {p}
                      </span>
                    ))}
                    {r.permissions.length === 0 && (
                      <span className="text-xs text-emerald-200/70">
                        No permissions
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-blue-500/10"
                      onClick={() => handleCopy(r)}
                      title="Copy role"
                    >
                      <Copy className="h-4 w-4 text-blue-400" />
                    </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-emerald-500/10"
                      onClick={() => handleEdit(r)}
                      title="Edit role"
                  >
                    <Edit3 className="h-4 w-4 text-emerald-300" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-red-500/10"
                    onClick={() => handleDelete(r._id)}
                      title="Delete role"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredRoles.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-emerald-200/70"
                >
                  {searchQuery
                    ? "No roles match your search"
                    : "No roles yet. Create one above to start managing permissions."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- DEPLOYMENTS ---------------- */

function DeploymentsTab({
  appId,
  deployments,
}: {
  appId: Id<"apps">;
  deployments: Doc<"deployments">[];
}) {
  const createDeployment = useMutation(api.deployments.createDeployment);
  const updateStatus = useMutation(api.deployments.updateStatus);
  const deleteDeployment = useMutation(api.deployments.deleteDeployment);
  const [region, setRegion] = useState<string>("");
  const [deploymentName, setDeploymentName] = useState<string>("");
  const [deploymentUrl, setDeploymentUrl] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [healthChecks, setHealthChecks] = useState<Record<string, "checking" | "healthy" | "unhealthy">>({});
  const [selectedDeployments, setSelectedDeployments] = useState<Set<Id<"deployments">>>(new Set());
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [selectedDeploymentForLogs, setSelectedDeploymentForLogs] = useState<Doc<"deployments"> | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "created" | "status">("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Deployment templates
  const deploymentTemplates: Record<string, { name: string; region: string; url: string; status: string }> = {
    Production: {
      name: "Production",
      region: "us-east-1",
      url: "https://app.example.com",
      status: "active",
    },
    Staging: {
      name: "Staging",
      region: "us-west-2",
      url: "https://staging.example.com",
      status: "active",
    },
    Development: {
      name: "Development",
      region: "eu-west-1",
      url: "https://dev.example.com",
      status: "inactive",
    },
  };

  // Filter and sort deployments
  let filteredDeployments = deployments.filter((d) => {
    const matchesSearch =
      !searchQuery ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.region.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort deployments
  filteredDeployments = [...filteredDeployments].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "status") {
      comparison = a.status.localeCompare(b.status);
    } else if (sortBy === "created") {
      comparison = a.createdAt - b.createdAt;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Statistics
  const stats = {
    total: deployments.length,
    active: deployments.filter((d) => d.status === "active").length,
    inactive: deployments.filter((d) => d.status === "inactive").length,
    error: deployments.filter((d) => d.status === "error").length,
  };

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = deploymentName.trim();
    const url = deploymentUrl.trim();

    if (!name || !region || !url) {
      alert("Please fill in all fields");
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      alert("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    try {
    await createDeployment({
      appId,
      name,
      region,
      url,
      status: "active",
    });
      // Reset form
      setDeploymentName("");
      setDeploymentUrl("");
    setRegion("");
    } catch (error: any) {
      alert(error.message || "Failed to create deployment");
    }
  };

  const handleTemplate = (template: { name: string; region: string; url: string; status: string }) => {
    setDeploymentName(template.name);
    setDeploymentUrl(template.url);
    setRegion(template.region);
  };

  const handleUpdateStatus = async (id: Id<"deployments">, newStatus: string) => {
    try {
      await updateStatus({ id, status: newStatus });
    } catch (error: any) {
      alert(error.message || "Failed to update status");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDeployments.size === 0) return;
    if (!confirm(`Delete ${selectedDeployments.size} selected deployment(s)?`)) return;
    try {
      await Promise.all(Array.from(selectedDeployments).map((id) => deleteDeployment({ id })));
      setSelectedDeployments(new Set());
    } catch (error: any) {
      alert(error.message || "Failed to delete deployments");
    }
  };

  const toggleSelectDeployment = (id: Id<"deployments">) => {
    const newSelected = new Set(selectedDeployments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDeployments(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDeployments.size === filteredDeployments.length) {
      setSelectedDeployments(new Set());
    } else {
      setSelectedDeployments(new Set(filteredDeployments.map((d) => d._id)));
    }
  };

  const handleViewLogs = (deployment: Doc<"deployments">) => {
    setSelectedDeploymentForLogs(deployment);
    setShowLogsDialog(true);
  };

  const handleDelete = async (id: Id<"deployments">) => {
    if (!confirm("Delete this deployment?")) return;
    try {
    await deleteDeployment({ id });
    } catch (error: any) {
      alert(error.message || "Failed to delete deployment");
    }
  };

  const handleHealthCheck = async (deployment: Doc<"deployments">) => {
    setHealthChecks((prev) => ({ ...prev, [deployment._id]: "checking" }));
    try {
      // Simulate health check (CORS prevents actual check)
      await fetch(deployment.url, { method: "HEAD", mode: "no-cors" });
      // Simulate success
      setTimeout(() => {
        setHealthChecks((prev) => ({ ...prev, [deployment._id]: "healthy" }));
        setTimeout(() => {
          setHealthChecks((prev) => {
            const newState = { ...prev };
            delete newState[deployment._id];
            return newState;
          });
        }, 3000);
      }, 1000);
    } catch (error) {
      setHealthChecks((prev) => ({ ...prev, [deployment._id]: "unhealthy" }));
      setTimeout(() => {
        setHealthChecks((prev) => {
          const newState = { ...prev };
          delete newState[deployment._id];
          return newState;
        });
      }, 3000);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Region", "URL", "Status", "Created"];
    const rows = filteredDeployments.map((d) => [
      d.name,
      d.region,
      d.url,
      d.status,
      new Date(d.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deployments-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: "bg-emerald-500/15", text: "text-emerald-200", icon: CheckCircle2 },
      inactive: { bg: "bg-gray-500/15", text: "text-gray-300", icon: XCircle },
      error: { bg: "bg-red-500/15", text: "text-red-300", icon: AlertTriangle },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* STATISTICS */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="text-xs text-emerald-200/60 mb-1">Total</div>
          <div className="text-2xl font-bold text-emerald-100">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="text-xs text-emerald-200/60 mb-1">Active</div>
          <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="text-xs text-emerald-200/60 mb-1">Inactive</div>
          <div className="text-2xl font-bold text-gray-400">{stats.inactive}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="text-xs text-emerald-200/60 mb-1">Errors</div>
          <div className="text-2xl font-bold text-red-400">{stats.error}</div>
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-200/50" />
          <Input
            placeholder="Search deployments by name, URL, or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-black/60 border-emerald-500/30 text-sm placeholder:text-emerald-200/40 focus-visible:ring-emerald-400/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-200/50 hover:text-emerald-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-emerald-200/70" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-emerald-500/25 bg-black/70 px-3 text-xs text-emerald-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div className="text-xs text-emerald-200/60">
          {filteredDeployments.length} of {deployments.length} deployments
        </div>
      </div>

      {/* DEPLOYMENT TEMPLATES */}
      <div className="space-y-2">
        <div className="text-xs text-emerald-200/60 font-medium">Quick Templates:</div>
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(deploymentTemplates).map(([key, template]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleTemplate(template)}
              className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-emerald-300" />
                  <span className="font-semibold text-emerald-100">{template.name}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300">
                  Use
                </span>
              </div>
              <p className="text-xs text-emerald-200/60 mb-1">📍 Region: {template.region}</p>
              <p className="text-xs text-emerald-200/50 truncate font-mono">🔗 {template.url}</p>
            </button>
          ))}
        </div>
      </div>

      {/* FORM CREATE DEPLOYMENT */}
      <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-5 shadow-[0_0_30px_rgba(16,185,129,0.25)] space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2 text-emerald-100">
          <Server className="h-4 w-4 text-emerald-300" /> Create deployment
        </h2>
        <form
          onSubmit={handleCreate}
          className="grid gap-3 md:grid-cols-[1.3fr,1fr,1.7fr,auto]"
        >
          <Input
            name="name"
            value={deploymentName}
            onChange={(e) => setDeploymentName(e.target.value)}
            placeholder="Deployment name"
            className="bg-black/60 border-emerald-500/30 text-sm placeholder:text-emerald-200/40 focus-visible:ring-emerald-400/60"
            required
          />
          <div className="h-9">
            <RegionSelect
              value={region}
              onChange={setRegion}
            />
          </div>

          <Input
            name="url"
            value={deploymentUrl}
            onChange={(e) => setDeploymentUrl(e.target.value)}
            placeholder="https://my-app.example.com"
            className="bg-black/60 border-emerald-500/20 text-sm placeholder:text-emerald-200/35 focus-visible:ring-emerald-400/60"
            required
          />
          <Button
            type="submit"
            size="sm"
            className="rounded-xl bg-emerald-500/90 text-black shadow-[0_0_18px_rgba(16,185,129,0.7)] hover:bg-emerald-400"
          >
            <Plus className="mr-1 h-4 w-4" /> Deploy
          </Button>
        </form>
      </div>

      {/* BULK ACTIONS & EXPORT */}
      {(selectedDeployments.size > 0 || filteredDeployments.length > 0) && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {selectedDeployments.size > 0 && (
              <>
                <span className="text-sm text-emerald-200/80">
                  {selectedDeployments.size} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Delete Selected
                </Button>
              </>
            )}
          </div>
          {filteredDeployments.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportCSV}
              className="text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10"
            >
              <FileDown className="mr-1 h-4 w-4" /> Export CSV
            </Button>
          )}
        </div>
      )}

      {/* TABLE DEPLOYMENTS */}
      <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-black/60 shadow-[0_0_32px_rgba(15,118,110,0.4)]">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-emerald-500/15 via-transparent to-emerald-500/10 border-b border-emerald-500/30 text-emerald-100/80">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedDeployments.size === filteredDeployments.length && filteredDeployments.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-emerald-500/50 bg-black/40"
                />
              </th>
              <th 
                className="px-4 py-3 text-left font-medium cursor-pointer hover:text-emerald-100 transition-colors"
                onClick={() => {
                  if (sortBy === "name") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("name");
                    setSortOrder("asc");
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  Name
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium">Region</th>
              <th className="px-4 py-3 text-left font-medium">URL</th>
              <th 
                className="px-4 py-3 text-left font-medium cursor-pointer hover:text-emerald-100 transition-colors"
                onClick={() => {
                  if (sortBy === "status") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("status");
                    setSortOrder("asc");
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  Status
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-medium cursor-pointer hover:text-emerald-100 transition-colors"
                onClick={() => {
                  if (sortBy === "created") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("created");
                    setSortOrder("desc");
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  Created
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeployments.map((d) => {
              const healthStatus = healthChecks[d._id];
              return (
              <tr
                key={d._id}
                className="border-t border-emerald-500/10 bg-black/40 transition-colors hover:bg-emerald-500/5"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedDeployments.has(d._id)}
                    onChange={() => toggleSelectDeployment(d._id)}
                    className="rounded border-emerald-500/50 bg-black/40"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-emerald-300/50" />
                    <span className="font-medium text-emerald-50">{d.name}</span>
                  </div>
                </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-xs font-medium text-emerald-200">
                  {d.region}
                    </span>
                </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                        className="underline text-emerald-300 hover:text-emerald-200 truncate max-w-[200px] font-mono text-xs"
                        title={d.url}
                  >
                    {d.url}
                  </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(d.url);
                        }}
                        className="text-emerald-300/50 hover:text-emerald-300 transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-300/50 hover:text-emerald-300 transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={d.status}
                      onChange={(e) => handleUpdateStatus(d._id, e.target.value)}
                      className="h-8 rounded-xl border border-emerald-500/30 bg-black/70 px-3 text-xs text-emerald-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
                    >
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                      <option value="error">error</option>
                    </select>
                    {getStatusBadge(d.status)}
                    {healthStatus && (
                      <span className={`text-xs ${
                        healthStatus === "checking" ? "text-yellow-400" :
                        healthStatus === "healthy" ? "text-emerald-400" :
                        "text-red-400"
                      }`}>
                        {healthStatus === "checking" && <RefreshCw className="h-3 w-3 animate-spin" />}
                        {healthStatus === "healthy" && <CheckCircle2 className="h-3 w-3" />}
                        {healthStatus === "unhealthy" && <XCircle className="h-3 w-3" />}
                  </span>
                    )}
                  </div>
                </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-200/60">
                      <Clock className="h-3 w-3" />
                      {new Date(d.createdAt).toLocaleDateString()}
                    </div>
                </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-emerald-500/10"
                        onClick={() => handleHealthCheck(d)}
                        title="Health check"
                      >
                        {healthStatus === "checking" ? (
                          <RefreshCw className="h-4 w-4 text-yellow-400 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4 text-emerald-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-blue-500/10"
                        onClick={() => handleViewLogs(d)}
                        title="View logs"
                      >
                        <FileText className="h-4 w-4 text-blue-400" />
                      </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-red-500/10"
                    onClick={() => handleDelete(d._id)}
                        title="Delete deployment"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                    </div>
                </td>
              </tr>
              );
            })}

            {filteredDeployments.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-emerald-200/70"
                >
                  {searchQuery || statusFilter !== "all"
                    ? "No deployments match your filters"
                    : "No deployments yet. Create your first deployment above 🚀"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* LOGS DIALOG */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-2xl bg-black/90 border-emerald-500/30">
          <DialogHeader>
            <DialogTitle className="text-emerald-100">
              Deployment Logs: {selectedDeploymentForLogs?.name}
            </DialogTitle>
            <DialogDescription className="text-emerald-200/60">
              View deployment information and logs
            </DialogDescription>
          </DialogHeader>
          {selectedDeploymentForLogs && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-emerald-200/60">Name:</span>
                  <p className="text-emerald-100 font-medium">{selectedDeploymentForLogs.name}</p>
                </div>
                <div>
                  <span className="text-emerald-200/60">Region:</span>
                  <p className="text-emerald-100 font-medium">{selectedDeploymentForLogs.region}</p>
                </div>
                <div>
                  <span className="text-emerald-200/60">URL:</span>
                  <p className="text-emerald-100 font-mono text-xs break-all">{selectedDeploymentForLogs.url}</p>
                </div>
                <div>
                  <span className="text-emerald-200/60">Status:</span>
                  <p className="text-emerald-100 font-medium">{selectedDeploymentForLogs.status}</p>
                </div>
                <div>
                  <span className="text-emerald-200/60">Created:</span>
                  <p className="text-emerald-100 font-medium">
                    {new Date(selectedDeploymentForLogs.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="border-t border-emerald-500/20 pt-4">
                <h4 className="text-sm font-semibold text-emerald-100 mb-2">Recent Logs</h4>
                <div className="bg-black/60 rounded-lg p-4 font-mono text-xs text-emerald-200/80 space-y-1 max-h-64 overflow-y-auto">
                  <div className="text-emerald-400">[INFO] Deployment created successfully</div>
                  <div className="text-emerald-400">[INFO] Status: {selectedDeploymentForLogs.status}</div>
                  <div className="text-emerald-400">[INFO] Region: {selectedDeploymentForLogs.region}</div>
                  <div className="text-emerald-200/60">[DEBUG] URL: {selectedDeploymentForLogs.url}</div>
                  <div className="text-emerald-200/60">[DEBUG] Created at: {new Date(selectedDeploymentForLogs.createdAt).toISOString()}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
/* ----------- Settings ----------- */
function SettingsTab({ app }: { app: Doc<"apps"> }) {
  const updateInfo = useMutation(api.apps.updateInfo);
  const deleteApp = useMutation(api.apps.deleteApp);
  const [name, setName] = useState(app.name);
  const [region, setRegion] = useState(app.region);
  const [description, setDescription] = useState(app.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedAppId, setCopiedAppId] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Get statistics
  const users = useQuery(api.appUsers.listUsers, { appId: app._id }) ?? [];
  const roles = useQuery(api.roles.listRoles, { appId: app._id }) ?? [];
  const deployments = useQuery(api.deployments.listDeployments, { appId: app._id }) ?? [];
  const envVars = useQuery(api.environmentVariables.list, { appId: app._id }) ?? [];
  const apiKeys = useQuery(api.apiKeys.list, { appId: app._id }) ?? [];

  const save = async () => {
    if (!name.trim()) {
      alert("Tên app không được để trống");
      return;
    }

    setIsSaving(true);
    try {
      await updateInfo({
        appId: app._id,
        name: name.trim(),
        region,
        description: description.trim() || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error: any) {
      alert(error.message || "Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteApp = async () => {
    if (deleteConfirmText !== app.name) {
      alert(`Vui lòng nhập "${app.name}" để xác nhận xóa`);
      return;
    }

    try {
      await deleteApp({ appId: app._id });
      // Redirect to dashboard after deletion
      window.location.href = "/dashboard";
    } catch (error: any) {
      alert(error.message || "Failed to delete app");
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
    }
  };

  const copyAppId = async () => {
    await navigator.clipboard.writeText(String(app._id));
    setCopiedAppId(true);
    setTimeout(() => setCopiedAppId(false), 2000);
  };

  const hasChanges =
    name !== app.name ||
    region !== app.region ||
    description !== (app.description || "");

  return (
    <div className="space-y-6">
      {/* STATISTICS */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="text-xs text-emerald-200/60 mb-1">Users</div>
          <div className="text-2xl font-bold text-emerald-100">{users.length}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="text-xs text-emerald-200/60 mb-1">Roles</div>
          <div className="text-2xl font-bold text-blue-300">{roles.length}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="text-xs text-emerald-200/60 mb-1">Deployments</div>
          <div className="text-2xl font-bold text-purple-300">{deployments.length}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="text-xs text-emerald-200/60 mb-1">Env Vars</div>
          <div className="text-2xl font-bold text-yellow-300">{envVars.length}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="text-xs text-emerald-200/60 mb-1">API Keys</div>
          <div className="text-2xl font-bold text-red-300">{apiKeys.length}</div>
        </div>
      </div>

      {/* APPLICATION SETTINGS */}
      <div className="rounded-2xl border border-emerald-500/20 p-6 bg-black/50 shadow-[0_0_20px_rgba(0,255,180,0.2)]">
        <h2 className="text-emerald-200 text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-300" /> Cài đặt ứng dụng
          <div className="group relative">
            <HelpCircle className="h-4 w-4 text-emerald-200/50 cursor-help" />
            <div className="absolute left-0 top-6 w-64 p-2 bg-black/90 border border-emerald-500/30 rounded-lg text-xs text-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Cập nhật thông tin cơ bản của ứng dụng. Thay đổi sẽ được lưu ngay khi bạn click "Lưu thay đổi".
            </div>
          </div>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-emerald-200/80 mb-1 block flex items-center gap-1">
              Tên ứng dụng *
              <div className="group relative">
                <HelpCircle className="h-3 w-3 text-emerald-200/50 cursor-help" />
                <div className="absolute left-0 top-5 w-48 p-2 bg-black/90 border border-emerald-500/30 rounded-lg text-xs text-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Tên hiển thị của ứng dụng trong dashboard
                </div>
              </div>
            </label>
            <Input
              className="bg-black/70 border-emerald-500/30 text-sm text-emerald-100"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My App"
              maxLength={100}
            />
            <div className="text-xs text-emerald-200/50 mt-1">
              {name.length}/100 ký tự
            </div>
          </div>

          <div>
            <label className="text-xs text-emerald-200/80 mb-1 block flex items-center gap-1">
              Region (Khu vực) *
              <div className="group relative">
                <HelpCircle className="h-3 w-3 text-emerald-200/50 cursor-help" />
                <div className="absolute left-0 top-5 w-48 p-2 bg-black/90 border border-emerald-500/30 rounded-lg text-xs text-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Khu vực server để deploy ứng dụng. Không thể thay đổi sau khi tạo.
                </div>
              </div>
            </label>
            <RegionSelect value={region} onChange={setRegion} />
          </div>

          <div>
            <label className="text-xs text-emerald-200/80 mb-1 block">
              Mô tả (tùy chọn)
            </label>
            <textarea
              className="w-full rounded-xl bg-black/70 border border-emerald-500/30 px-3 py-2 text-sm text-emerald-100 placeholder:text-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả về ứng dụng của bạn..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-emerald-200/50 mt-1">
              {description.length}/500 ký tự
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="text-xs text-emerald-200/50">
            {hasChanges && "⚠️ Bạn có thay đổi chưa lưu"}
          </div>
          <Button
            onClick={save}
            disabled={!hasChanges || isSaving}
            className="rounded-xl bg-emerald-500/90 px-4 py-2 text-black shadow-lg hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Activity className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
              </>
            ) : saved ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Đã lưu!
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </div>
      </div>

      {/* APP INFO */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-6 shadow-[0_0_32px_rgba(16,185,129,0.25)]">
        <h3 className="text-base font-semibold text-emerald-100 mb-4 flex items-center gap-2">
          Thông tin ứng dụng
          <div className="group relative">
            <HelpCircle className="h-4 w-4 text-emerald-200/50 cursor-help" />
            <div className="absolute left-0 top-6 w-64 p-2 bg-black/90 border border-emerald-500/30 rounded-lg text-xs text-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Thông tin chỉ đọc về ứng dụng. App ID có thể được sử dụng trong API calls.
            </div>
          </div>
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs text-emerald-200/60 mb-1">App ID</div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-emerald-100">{String(app._id)}</span>
              <button
                onClick={copyAppId}
                className="text-emerald-300/50 hover:text-emerald-300 transition-colors"
                title="Copy App ID"
              >
                {copiedAppId ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
          <div>
            <div className="text-xs text-emerald-200/60 mb-1">Ngày tạo</div>
            <div className="text-sm text-emerald-100">
              {new Date(app.createdAt).toLocaleString("vi-VN")}
            </div>
          </div>
          <div>
            <div className="text-xs text-emerald-200/60 mb-1">Region</div>
            <div className="text-sm text-emerald-100">{app.region}</div>
          </div>
          <div>
            <div className="text-xs text-emerald-200/60 mb-1">Chủ sở hữu</div>
            <div className="text-sm text-emerald-200/70">Bạn</div>
          </div>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="rounded-2xl border border-red-500/30 p-6 bg-gradient-to-br from-red-950/20 via-slate-950/40 to-red-900/10 shadow-[0_0_32px_rgba(239,68,68,0.2)]">
        <h3 className="text-base font-semibold text-red-300 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" /> Vùng nguy hiểm
        </h3>
        <p className="text-sm text-red-200/70 mb-4">
          Xóa ứng dụng sẽ xóa vĩnh viễn tất cả dữ liệu liên quan (users, roles, deployments, env vars, API keys).
          Hành động này không thể hoàn tác.
        </p>
        {!showDeleteConfirm ? (
          <Button
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            className="border border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Xóa ứng dụng
          </Button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-red-200/80 mb-2">
                Nhập tên ứng dụng để xác nhận: <span className="font-mono text-red-300">{app.name}</span>
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={app.name}
                className="bg-black/70 border-red-500/50 text-sm text-emerald-100"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleDeleteApp}
                disabled={deleteConfirmText !== app.name}
                className="bg-red-500/90 text-white hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Xác nhận xóa
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                className="text-emerald-200 hover:bg-emerald-500/10"
              >
                Hủy
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
/* ----------- API Keys ----------- */
function ApiKeysTab({ appId }: { appId: Id<"apps"> }) {
  const keys = useQuery(api.apiKeys.list, { appId }) ?? [];
  const createKey = useMutation(api.apiKeys.create);
  const deleteKey = useMutation(api.apiKeys.remove);
  const toggle = useMutation(api.apiKeys.toggleActive);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filteredKeys = keys.filter((k) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      k.name.toLowerCase().includes(query) ||
      k.type.toLowerCase().includes(query) ||
      k.key.toLowerCase().includes(query)
    );
  });

  const createNew = async () => {
    const type = prompt("Type: public | secret | webhook") || "public";
    const name = prompt("Key name") || "New Key";

    const key = generateKey(type === "public" ? "pk" : "sk");

    try {
    await createKey({ appId, name, type, key });
      alert("API Key created! Make sure to copy it now - you won't be able to see it again.");
    } catch (error: any) {
      alert(error.message || "Failed to create API key");
    }
  };

  const copyKey = async (key: string, keyId: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* SEARCH */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-200/50" />
          <Input
            placeholder="Search API keys by name, type, or key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-black/60 border-emerald-500/30 text-sm placeholder:text-emerald-200/40 focus-visible:ring-emerald-400/60"
          />
          {searchQuery && (
      <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-200/50 hover:text-emerald-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
        onClick={createNew}
        className="rounded-xl bg-emerald-500/90 text-black px-4 py-2 shadow-lg hover:bg-emerald-400"
      >
          <Plus className="mr-2 h-4 w-4" /> Create API Key
        </Button>
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-black/60 shadow-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-emerald-500/10 text-emerald-200 border-b border-emerald-500/20">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Key</th>
              <th className="px-4 py-2 text-left">Active</th>
              <th className="px-4 py-2 text-left">Last Used</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredKeys.map((k) => (
              <tr
                key={k._id}
                className="border-t border-emerald-500/10 hover:bg-emerald-500/5"
              >
                <td className="px-4 py-2">{k.name}</td>
                <td className="px-4 py-2 text-xs">{k.type}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-emerald-50">
                      {k.key}
                    </span>
                    <button
                      onClick={() => copyKey(k.key, k._id)}
                      className="text-emerald-300 hover:text-emerald-100 transition-colors"
                      title="Copy key"
                    >
                      {copiedKey === k._id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => toggle({ keyId: k._id })}
                    className={`px-2 py-1 rounded-full text-xs transition-all ${
                      k.active
                        ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                        : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                    }`}
                  >
                    {k.active ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="px-4 py-2 text-xs text-emerald-200/60">
                  {k.lastUsedAt
                    ? new Date(k.lastUsedAt).toLocaleString()
                    : "Never"}
                </td>
                <td className="px-4 py-2 text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-red-500/10"
                    onClick={() => {
                      if (confirm("Delete this API key?")) {
                        deleteKey({ keyId: k._id });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </td>
              </tr>
            ))}

            {filteredKeys.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-emerald-300/60"
                >
                  {searchQuery
                    ? "No keys match your search"
                    : "No keys yet. Create one above 🔑"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ----------- ANALYTICS ----------- */
function AnalyticsTab({ appId }: { appId: Id<"apps"> }) {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  
  const summary = useQuery(api.analytics.getSummary, { appId, days });
  const metrics = useQuery(api.analytics.getMetrics, { appId, days });
  const events = useQuery(api.analytics.getEvents, { appId, limit: 50 });

  // Filter events by type
  const filteredEvents = events?.filter((e) => 
    eventTypeFilter === "all" || e.eventType === eventTypeFilter
  ) ?? [];

  // Get unique event types
  const eventTypes = Array.from(new Set(events?.map((e) => e.eventType) ?? []));

  // Group metrics by date for chart
  const metricsByDate = metrics?.reduce((acc, m) => {
    if (!acc[m.date]) {
      acc[m.date] = {};
    }
    acc[m.date][m.metricType] = m.value;
    return acc;
  }, {} as Record<string, Record<string, number>>) ?? {};

  const dates = Object.keys(metricsByDate).sort();
  const maxValue = Math.max(
    ...(metrics?.map((m) => m.value) ?? [0]),
    1
  );

  const handleExportCSV = () => {
    const headers = ["Date", "Event Type", "Timestamp", "Metadata"];
    const rows = filteredEvents.map((e) => [
      new Date(e.timestamp).toLocaleDateString(),
      e.eventType,
      new Date(e.timestamp).toLocaleString(),
      JSON.stringify(e.metadata || {}),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${days}days-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* HEADER WITH FILTERS */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-200/60">Time Range:</span>
          <div className="flex gap-1 rounded-lg border border-emerald-500/20 bg-black/40 p-1">
            {([7, 30, 90] as const).map((d) => (
                  <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  days === d
                    ? "bg-emerald-500/20 text-emerald-100"
                    : "text-emerald-200/60 hover:text-emerald-100"
                }`}
              >
                {d}d
                  </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-emerald-200/70" />
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="h-9 rounded-xl border border-emerald-500/25 bg-black/70 px-3 text-xs text-emerald-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="all">All Events</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        {filteredEvents.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportCSV}
            className="text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10"
          >
            <FileDown className="mr-1 h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      {/* SUMMARY STATS */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-300" />
              <span className="text-sm font-medium text-emerald-100">API Calls</span>
            </div>
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-emerald-200/50 cursor-help" />
              <div className="absolute right-0 top-6 w-48 p-2 bg-black/90 border border-emerald-500/30 rounded-lg text-xs text-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Tổng số lần API được gọi trong khoảng thời gian đã chọn
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-50">
            {summary?.totalApiCalls?.toLocaleString() ?? "0"}
          </div>
          <div className="text-xs text-emerald-200/60 mt-1">Tổng số requests</div>
        </div>
        
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span className="text-sm font-medium text-emerald-100">Errors</span>
            </div>
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-emerald-200/50 cursor-help" />
              <div className="absolute right-0 top-6 w-48 p-2 bg-black/90 border border-emerald-500/30 rounded-lg text-xs text-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Số lỗi xảy ra trong các API calls (4xx, 5xx errors)
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-red-400">
            {summary?.totalErrors?.toLocaleString() ?? "0"}
          </div>
          <div className="text-xs text-emerald-200/60 mt-1">Lỗi phát sinh</div>
        </div>
        
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-300" />
              <span className="text-sm font-medium text-emerald-100">Active Users</span>
            </div>
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-emerald-200/50 cursor-help" />
              <div className="absolute right-0 top-6 w-48 p-2 bg-black/90 border border-emerald-500/30 rounded-lg text-xs text-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Số lượng người dùng đã sử dụng app trong khoảng thời gian này
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-300">
            {summary?.activeUsers?.toLocaleString() ?? "0"}
          </div>
          <div className="text-xs text-emerald-200/60 mt-1">Người dùng hoạt động</div>
        </div>
        
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-purple-300" />
              <span className="text-sm font-medium text-emerald-100">Deployments</span>
            </div>
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-emerald-200/50 cursor-help" />
              <div className="absolute right-0 top-6 w-48 p-2 bg-black/90 border border-emerald-500/30 rounded-lg text-xs text-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Số deployment đang hoạt động / Tổng số deployments
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-300">
            {summary?.activeDeployments ?? 0}/{summary?.totalDeployments ?? 0}
          </div>
          <div className="text-xs text-emerald-200/60 mt-1">Active / Total</div>
        </div>
      </div>

      {/* ERROR RATE */}
      {summary && (
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-6 shadow-[0_0_32px_rgba(16,185,129,0.25)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-emerald-100 flex items-center gap-2">
              Tỷ lệ lỗi (Error Rate)
              <div className="group relative">
                <HelpCircle className="h-4 w-4 text-emerald-200/50 cursor-help" />
                <div className="absolute left-0 top-6 w-64 p-2 bg-black/90 border border-emerald-500/30 rounded-lg text-xs text-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Tỷ lệ phần trăm lỗi so với tổng số requests. Tỷ lệ thấp (&lt;1%) là tốt.
                </div>
              </div>
            </h3>
            {summary.errorRate > 5 && (
              <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Cao
              </span>
            )}
            {summary.errorRate > 1 && summary.errorRate <= 5 && (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Trung bình
              </span>
            )}
            {summary.errorRate <= 1 && (
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Tốt
              </span>
            )}
          </div>
          <div className="flex items-end gap-3">
            <div className="text-4xl font-bold text-emerald-50">
              {summary.errorRate.toFixed(2)}%
            </div>
            <div className="text-sm text-emerald-200/70 mb-2">
              của tổng số requests
            </div>
          </div>
          <div className="mt-4 text-xs text-emerald-200/60">
            {summary.totalApiCalls > 0 ? (
              <>
                {summary.totalErrors} lỗi trong {summary.totalApiCalls} requests
              </>
            ) : (
              "Chưa có dữ liệu"
            )}
          </div>
        </div>
      )}

      {/* METRICS CHART */}
      {dates.length > 0 ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-6 shadow-[0_0_32px_rgba(16,185,129,0.25)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-emerald-100 flex items-center gap-2">
              Biểu đồ thống kê ({days} ngày gần nhất)
              <div className="group relative">
                <HelpCircle className="h-4 w-4 text-emerald-200/50 cursor-help" />
                <div className="absolute left-0 top-6 w-64 p-2 bg-black/90 border border-emerald-500/30 rounded-lg text-xs text-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Biểu đồ hiển thị xu hướng API calls và errors theo thời gian. Hover vào các cột để xem chi tiết.
                </div>
              </div>
            </h3>
            <span className="text-xs text-emerald-200/60">
              {dates.length} điểm dữ liệu
            </span>
          </div>
          <div className="space-y-6">
            {/* API Calls Chart */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-sm font-medium text-emerald-100">API Calls</span>
                  <span className="text-xs text-emerald-200/60">(Số lần gọi API)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-emerald-50">
                    {metricsByDate[dates[dates.length - 1]]?.["api_calls"] ?? 0}
                  </span>
                  <span className="text-xs text-emerald-200/60">lần gọi</span>
                </div>
              </div>
              <div className="h-12 bg-black/40 rounded-lg overflow-hidden flex items-end gap-1 p-1.5">
                {dates.slice(-14).map((date) => {
                  const value = metricsByDate[date]?.["api_calls"] ?? 0;
                  const height = (value / maxValue) * 100;
                  return (
                    <div
                      key={date}
                      className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded hover:from-emerald-400 hover:to-emerald-300 transition-colors cursor-help relative group"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${date}: ${value} API calls`}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 border border-emerald-500/30 rounded text-xs text-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {new Date(date).toLocaleDateString("vi-VN")}: {value} calls
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Errors Chart */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-sm font-medium text-emerald-100">Errors</span>
                  <span className="text-xs text-emerald-200/60">(Số lỗi)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-400">
                    {metricsByDate[dates[dates.length - 1]]?.["errors"] ?? 0}
                  </span>
                  <span className="text-xs text-emerald-200/60">lỗi</span>
                </div>
              </div>
              <div className="h-12 bg-black/40 rounded-lg overflow-hidden flex items-end gap-1 p-1.5">
                {dates.slice(-14).map((date) => {
                  const value = metricsByDate[date]?.["errors"] ?? 0;
                  const height = (value / maxValue) * 100;
                  return (
                    <div
                      key={date}
                      className="flex-1 bg-gradient-to-t from-red-500 to-red-400 rounded hover:from-red-400 hover:to-red-300 transition-colors cursor-help relative group"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${date}: ${value} errors`}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 border border-red-500/30 rounded text-xs text-red-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {new Date(date).toLocaleDateString("vi-VN")}: {value} errors
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-8 shadow-[0_0_32px_rgba(16,185,129,0.25)] text-center">
          <BarChart3 className="h-12 w-12 text-emerald-300/50 mx-auto mb-3" />
          <p className="text-sm text-emerald-200/70">
            Chưa có dữ liệu để hiển thị biểu đồ
          </p>
          <p className="text-xs text-emerald-200/50 mt-1">
            Dữ liệu sẽ xuất hiện khi app của bạn được sử dụng
          </p>
        </div>
      )}

      {/* RECENT EVENTS */}
      <div className="rounded-2xl border border-emerald-500/20 bg-black/60 shadow-[0_0_32px_rgba(15,118,110,0.4)]">
        <div className="p-4 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-emerald-100">
              Sự kiện gần đây
            </h3>
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-emerald-200/50 cursor-help" />
              <div className="absolute left-0 top-6 w-64 p-2 bg-black/90 border border-emerald-500/30 rounded-lg text-xs text-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Danh sách các sự kiện đã xảy ra trong app (tạo user, deployment, v.v.)
              </div>
            </div>
          </div>
          <span className="text-xs text-emerald-200/60">
            {filteredEvents.length} {eventTypeFilter !== "all" ? "đã lọc" : "tổng"} sự kiện
          </span>
        </div>
        <div className="divide-y divide-emerald-500/10 max-h-96 overflow-y-auto">
          {filteredEvents && filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <div
                key={event._id}
                className="p-4 hover:bg-emerald-500/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-50">
                        {event.eventType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-emerald-200/60">
                        {new Date(event.timestamp).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  {event.metadata && (
                    <div className="text-xs text-emerald-200/50 font-mono max-w-xs truncate" title={JSON.stringify(event.metadata, null, 2)}>
                      {JSON.stringify(event.metadata).slice(0, 40)}...
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-emerald-200/70">
              {eventTypeFilter !== "all"
                ? "No events match your filter"
                : "No events yet. Events will appear here as your app is used."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------- ENVIRONMENT VARIABLES ----------- */
function EnvironmentVariablesTab({ appId }: { appId: Id<"apps"> }) {
  const envVars = useQuery(api.environmentVariables.list, { appId }) ?? [];
  const createVar = useMutation(api.environmentVariables.create);
  const updateVar = useMutation(api.environmentVariables.update);
  const deleteVar = useMutation(api.environmentVariables.remove);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [selectedEnv, setSelectedEnv] = useState<string>("all");
  const [copied, setCopied] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVars, setSelectedVars] = useState<Set<Id<"environmentVariables">>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    key: "",
    value: "",
    environment: "all",
    isEncrypted: false,
    description: "",
  });

  const environments = ["all", "development", "staging", "production"];

  // Environment variable templates
  const envVarTemplates: Record<string, { key: string; value: string; environment: string; isEncrypted?: boolean; description?: string }> = {
    "Database URL": {
      key: "DATABASE_URL",
      value: "postgresql://user:password@localhost:5432/dbname",
      environment: "all",
      description: "Database connection string",
    },
    "API Key": {
      key: "API_KEY",
      value: "your-api-key-here",
      environment: "all",
      description: "External API key",
    },
    "Secret Key": {
      key: "SECRET_KEY",
      value: "your-secret-key-here",
      environment: "all",
      isEncrypted: true,
      description: "Secret key for encryption",
    },
    "Node Environment": {
      key: "NODE_ENV",
      value: "production",
      environment: "production",
      description: "Node.js environment",
    },
  };

  // Get decrypted values for export
  const getDecryptedVars = () => {
    return filteredVars.map((v) => ({
      key: v.key,
      value: (v as any).decryptedValue || v.value,
      environment: v.environment,
    }));
  };

  // Export as .env format
  const exportAsEnv = () => {
    const envContent = getDecryptedVars()
      .map((v) => `${v.key}=${v.value}`)
      .join("\n");
    
    const blob = new Blob([envContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `.env.${selectedEnv === "all" ? "all" : selectedEnv}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy as .env format
  const copyAsEnv = async () => {
    const envContent = getDecryptedVars()
      .map((v) => `${v.key}=${v.value}`)
      .join("\n");
    
    await navigator.clipboard.writeText(envContent);
    setCopied("env");
    setTimeout(() => setCopied(null), 2000);
  };

  // Copy as JSON
  const copyAsJSON = async () => {
    const jsonContent = JSON.stringify(
      getDecryptedVars().reduce((acc, v) => {
        acc[v.key] = v.value;
        return acc;
      }, {} as Record<string, string>),
      null,
      2
    );
    
    await navigator.clipboard.writeText(jsonContent);
    setCopied("json");
    setTimeout(() => setCopied(null), 2000);
  };

  // Copy single value
  const copyValue = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  // Statistics
  const stats = {
    total: envVars.length,
    development: envVars.filter((v) => v.environment === "development").length,
    staging: envVars.filter((v) => v.environment === "staging").length,
    production: envVars.filter((v) => v.environment === "production").length,
    encrypted: envVars.filter((v) => v.isEncrypted).length,
  };

  // Filter and search
  let filteredVars = envVars.filter((v) => {
    const matchesEnv = selectedEnv === "all" || v.environment === selectedEnv;
    const matchesSearch =
      !searchQuery ||
      v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v as any).description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEnv && matchesSearch;
  });

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const key = formData.key.trim();
    const value = formData.value.trim();

    if (!key || !value) {
      alert("Vui lòng điền Key và Value");
      return;
    }

    // Validate key format (should be uppercase with underscores)
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
      if (!confirm("Key nên là UPPERCASE với dấu gạch dưới. Bạn có muốn tiếp tục?")) {
        return;
      }
    }

    try {
      await createVar({
        appId,
        key,
        value,
        environment: formData.environment,
        isEncrypted: formData.isEncrypted,
        description: formData.description || undefined,
      });
      setFormData({ key: "", value: "", environment: "all", isEncrypted: false, description: "" });
      setShowCreateForm(false);
    } catch (error: any) {
      alert(error.message || "Failed to create environment variable");
    }
  };

  const handleTemplate = (template: { key: string; value: string; environment: string; isEncrypted?: boolean; description?: string }) => {
    setFormData({
      key: template.key,
      value: template.value,
      environment: template.environment,
      isEncrypted: template.isEncrypted || false,
      description: template.description || "",
    });
    setShowCreateForm(true);
  };

  const handleBulkDelete = async () => {
    if (selectedVars.size === 0) return;
    if (!confirm(`Xóa ${selectedVars.size} biến môi trường đã chọn?`)) return;
    try {
      await Promise.all(Array.from(selectedVars).map((id) => deleteVar({ envVarId: id })));
      setSelectedVars(new Set());
    } catch (error: any) {
      alert(error.message || "Failed to delete environment variables");
    }
  };

  const toggleSelectVar = (id: Id<"environmentVariables">) => {
    const newSelected = new Set(selectedVars);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedVars(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedVars.size === filteredVars.length) {
      setSelectedVars(new Set());
    } else {
      setSelectedVars(new Set(filteredVars.map((v) => v._id)));
    }
  };


  const handleDelete = async (envVarId: Id<"environmentVariables">) => {
    if (!confirm("Delete this environment variable?")) return;
    try {
      await deleteVar({ envVarId });
    } catch (error: any) {
      alert(error.message || "Failed to delete environment variable");
    }
  };

  const toggleShowValue = (id: string) => {
    setShowValues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* STATISTICS */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="text-xs text-emerald-200/60 mb-1">Total</div>
          <div className="text-2xl font-bold text-emerald-100">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="text-xs text-emerald-200/60 mb-1">Development</div>
          <div className="text-2xl font-bold text-blue-300">{stats.development}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="text-xs text-emerald-200/60 mb-1">Staging</div>
          <div className="text-2xl font-bold text-yellow-300">{stats.staging}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="text-xs text-emerald-200/60 mb-1">Production</div>
          <div className="text-2xl font-bold text-red-300">{stats.production}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="text-xs text-emerald-200/60 mb-1">Encrypted</div>
          <div className="text-2xl font-bold text-purple-300">{stats.encrypted}</div>
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-200/50" />
          <Input
            placeholder="Tìm kiếm theo key hoặc description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-black/60 border-emerald-500/30 text-sm placeholder:text-emerald-200/40 focus-visible:ring-emerald-400/60"
          />
          {searchQuery && (
                  <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-200/50 hover:text-emerald-200"
                  >
              <X className="h-4 w-4" />
                  </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-emerald-200/70" />
          <div className="flex gap-2">
            {environments.map((env) => (
              <button
                key={env}
                onClick={() => setSelectedEnv(env)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedEnv === env
                    ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    : "bg-black/40 text-emerald-200/70 hover:bg-emerald-500/10"
                }`}
              >
                {env.charAt(0).toUpperCase() + env.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-emerald-200/60">
          {filteredVars.length} of {envVars.length} variables
        </div>
      </div>

      {/* TEMPLATES */}
      <div className="space-y-2">
        <div className="text-xs text-emerald-200/60 font-medium flex items-center gap-2">
          Quick Templates:
          <div className="group relative">
            <HelpCircle className="h-3 w-3 text-emerald-200/50 cursor-help" />
            <div className="absolute left-0 top-5 w-56 p-2 bg-black/90 border border-emerald-500/30 rounded-lg text-xs text-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Click vào template để tự động điền form
            </div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {Object.entries(envVarTemplates).map(([key, template]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleTemplate(template)}
              className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-3 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Key className="h-3 w-3 text-emerald-300" />
                  <span className="font-semibold text-emerald-100 text-xs">{key}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300">
                  Use
                </span>
              </div>
              <p className="text-[10px] text-emerald-200/60 font-mono truncate">{template.key}</p>
              {template.description && (
                <p className="text-[10px] text-emerald-200/50 mt-1">{template.description}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* FORM CREATE ENV VAR */}
      {showCreateForm ? (
        <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-6 shadow-[0_0_30px_rgba(16,185,129,0.25)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2 text-emerald-100">
              <Key className="h-4 w-4 text-emerald-300" /> Tạo biến môi trường
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreateForm(false);
                setFormData({ key: "", value: "", environment: "all", isEncrypted: false, description: "" });
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-emerald-200/80 mb-1">
                  Key (Tên biến) *
                  <div className="group relative inline-block ml-1">
                    <HelpCircle className="h-3 w-3 text-emerald-200/50 cursor-help" />
                    <div className="absolute left-0 top-5 w-48 p-2 bg-black/90 border border-emerald-500/30 rounded-lg text-xs text-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Nên dùng UPPERCASE với dấu gạch dưới (VD: DATABASE_URL)
                    </div>
                  </div>
                </label>
                <Input
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                  placeholder="DATABASE_URL"
                  className="bg-black/60 border-emerald-500/30 text-sm font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-200/80 mb-1">
                  Environment *
                </label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="h-9 w-full rounded-xl border border-emerald-500/25 bg-black/70 px-3 text-xs text-emerald-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="all">All Environments</option>
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-emerald-200/80 mb-1">
                Value (Giá trị) *
              </label>
              <div className="relative">
                <Input
                  type={showValues["new"] ? "text" : "password"}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="your-value-here"
                  className="bg-black/60 border-emerald-500/30 text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowValues((prev) => ({ ...prev, new: !prev.new }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-200/50 hover:text-emerald-200"
                >
                  {showValues["new"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-emerald-200/80 mb-1">
                Description (Mô tả - tùy chọn)
              </label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả về biến này..."
                className="bg-black/60 border-emerald-500/30 text-sm"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-emerald-200/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isEncrypted}
                  onChange={(e) => setFormData({ ...formData, isEncrypted: e.target.checked })}
                  className="rounded border-emerald-500/30"
                />
                <span>Encrypt (Mã hóa giá trị)</span>
                <div className="group relative">
                  <HelpCircle className="h-3 w-3 text-emerald-200/50 cursor-help" />
                  <div className="absolute left-0 top-5 w-48 p-2 bg-black/90 border border-emerald-500/30 rounded-lg text-xs text-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Mã hóa giá trị để bảo mật thông tin nhạy cảm
                  </div>
                </div>
              </label>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                className="rounded-xl bg-emerald-500/90 text-black shadow-[0_0_18px_rgba(16,185,129,0.7)] hover:bg-emerald-400"
              >
                <Plus className="mr-1 h-4 w-4" /> Tạo biến
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ key: "", value: "", environment: "all", isEncrypted: false, description: "" });
                }}
              >
                Hủy
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <Button
          onClick={() => setShowCreateForm(true)}
          className="rounded-xl bg-emerald-500/90 text-black shadow-[0_0_18px_rgba(16,185,129,0.7)] hover:bg-emerald-400"
        >
          <Plus className="mr-1 h-4 w-4" /> Tạo biến môi trường
        </Button>
      )}

      {/* BULK ACTIONS & EXPORT */}
      {(selectedVars.size > 0 || filteredVars.length > 0) && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {selectedVars.size > 0 && (
              <>
                <span className="text-sm text-emerald-200/80">
                  {selectedVars.size} đã chọn
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Xóa đã chọn
                </Button>
              </>
            )}
          </div>
          {filteredVars.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={copyAsEnv}
                className="rounded-xl border-emerald-500/30 bg-black/40 text-emerald-200 hover:bg-emerald-500/10 text-xs"
              >
                {copied === "env" ? (
                  <>
                    <Check className="mr-1 h-3 w-3" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3 w-3" /> Copy .env
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={copyAsJSON}
                className="rounded-xl border-emerald-500/30 bg-black/40 text-emerald-200 hover:bg-emerald-500/10 text-xs"
              >
                {copied === "json" ? (
                  <>
                    <Check className="mr-1 h-3 w-3" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3 w-3" /> Copy JSON
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={exportAsEnv}
                className="rounded-xl border-emerald-500/30 bg-black/40 text-emerald-200 hover:bg-emerald-500/10 text-xs"
              >
                <Download className="mr-1 h-3 w-3" /> Export .env
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TABLE ENV VARS */}
      <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-black/60 shadow-[0_0_32px_rgba(15,118,110,0.4)]">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-emerald-500/15 via-transparent to-emerald-500/10 border-b border-emerald-500/30 text-emerald-100/80">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedVars.size === filteredVars.length && filteredVars.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-emerald-500/50 bg-black/40"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium">Key</th>
              <th className="px-4 py-3 text-left font-medium">Value</th>
              <th className="px-4 py-3 text-left font-medium">Environment</th>
              <th className="px-4 py-3 text-left font-medium">Encrypted</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVars.map((v) => {
              const isShowing = showValues[v._id];
              const displayValue = isShowing
                ? (v as any).decryptedValue || v.value
                : v.value;

              return (
                <tr
                  key={v._id}
                  className="border-t border-emerald-500/10 bg-black/40 transition-colors hover:bg-emerald-500/5"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedVars.has(v._id)}
                      onChange={() => toggleSelectVar(v._id)}
                      className="rounded border-emerald-500/50 bg-black/40"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-mono text-xs text-emerald-50 font-medium">
                        {v.key}
                      </div>
                      {(v as any).description && (
                        <div className="text-[10px] text-emerald-200/50 mt-0.5">
                          {(v as any).description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 max-w-md">
                      <span className="font-mono text-xs text-emerald-100/80 truncate">
                        {isShowing ? displayValue : "••••••••"}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => copyValue(v._id, displayValue)}
                          className="text-emerald-300/50 hover:text-emerald-300 transition-colors"
                          title="Copy value"
                        >
                          {copied === v._id ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleShowValue(v._id)}
                          className="text-emerald-300/50 hover:text-emerald-300 transition-colors"
                          title={isShowing ? "Ẩn giá trị" : "Hiện giá trị"}
                        >
                          {isShowing ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-xs font-medium text-emerald-200 capitalize">
                      {v.environment}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {v.isEncrypted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 text-xs font-medium text-purple-300">
                        <Key className="h-3 w-3" />
                        Encrypted
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-200/50">Plain</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-blue-500/10"
                        onClick={async () => {
                          const newKey = window.prompt("Key", v.key);
                          if (!newKey) return;
                          const newValue = window.prompt("Value", displayValue);
                          if (newValue === null) return;
                          const newEnv = window.prompt("Environment", v.environment);
                          if (!newEnv) return;
                          try {
                            await updateVar({
                              envVarId: v._id,
                              key: newKey,
                              value: newValue,
                              environment: newEnv,
                              isEncrypted: v.isEncrypted,
                            });
                          } catch (error: any) {
                            alert(error.message || "Failed to update");
                          }
                        }}
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4 text-blue-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-red-500/10"
                        onClick={() => handleDelete(v._id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                </td>
              </tr>
              );
            })}

            {filteredVars.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-emerald-200/70"
                >
                  {searchQuery || selectedEnv !== "all"
                    ? "Không tìm thấy biến môi trường nào phù hợp"
                    : "Chưa có biến môi trường. Tạo một biến ở trên 🔒"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ----------- SHARED SMALL COMPONENTS ----------- */

function TabButton({
  label,
  tab,
  current,
  setTab,
  icon,
}: {
  label: string;
  tab: TabKey;
  current: TabKey;
  setTab: (t: TabKey) => void;
  icon?: ReactNode;
}) {
  const active = current === tab;
  return (
    <button
      data-tab={tab}
      onClick={() => setTab(tab)}
      className={[
        "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all",
        active
          ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.7)]"
          : "bg-transparent text-emerald-200/70 hover:bg-emerald-500/10 hover:text-emerald-100",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

function Stat({
  icon,
  label,
  value,
  badge,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-4 shadow-[0_0_26px_rgba(16,185,129,0.3)] space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-200/70">
          {label}
        </span>
        <div className="rounded-full bg-black/70 p-2 shadow-[0_0_18px_rgba(16,185,129,0.3)]">
          {icon}
        </div>
      </div>
      <span
        className={
          "text-sm font-semibold text-emerald-50" +
          (badge
            ? " inline-flex w-fit rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs"
            : "")
        }
      >
        {value}
      </span>
    </div>
  );
}


function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-wide text-emerald-200/60">
        {label}
      </p>
      <div className="text-sm font-medium text-emerald-50">{value}</div>
    </div>
  );
}
