import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { RegionSelect } from "@/ui/region-select";
import { generateKey } from "@/utils/generateKey";

export const Route = createFileRoute(
  "/_app/_auth/dashboard/apps/$appId/"
)({
  component: AppOverviewPage,
});

type TabKey = "overview" | "users" | "roles" | "deployments" | "analytics" | "env-vars" | "settings" | "api-keys";

function AppOverviewPage() {
  const { appId } = Route.useParams();
  const typedAppId = appId as Id<"apps">;

  const app = useQuery(api.apps.getApp, { appId: typedAppId });
  const [tab, setTab] = useState<TabKey>("overview");

  const users = useQuery(api.appUsers.listUsers, { appId: typedAppId }) ?? [];
  const roles = useQuery(api.roles.listRoles, { appId: typedAppId }) ?? [];
  const deployments =
    useQuery(api.deployments.listDeployments, { appId: typedAppId }) ?? [];

  if (!app) {
    return (
      <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-black/60 via-slate-950 to-black/90 p-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
        <p className="text-sm text-emerald-200/70">Loading app…</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-black/60 via-slate-950 to-black/90 p-6 shadow-[0_0_40px_rgba(16,185,129,0.3)] space-y-8">
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

        <span className="hidden text-xs font-medium text-emerald-300/70 md:inline">
          App ID: <span className="font-mono">{String(app._id)}</span>
        </span>
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

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const name = String(form.get("name") || "").trim();
    const roleId = String(form.get("roleId") || "");

    if (!email) return;

    await createUser({
      appId,
      email,
      name: name || undefined,
      roleId: roleId ? (roleId as Id<"roles">) : undefined,
    });

    e.currentTarget.reset();
  };

  const handleUpdateRole = async (userId: Id<"appUsers">, roleId: string) => {
    await updateUser({
      userId,
      roleId: roleId ? (roleId as Id<"roles">) : undefined,
    });
  };

  const handleDelete = async (userId: Id<"appUsers">) => {
    if (!confirm("Delete this user?")) return;
    await deleteUser({ userId });
  };

  const roleName = (roleId?: Id<"roles">) =>
    roles.find((r) => r._id === roleId)?.name ?? "No role";

  // Filter users
  const filteredUsers = users.filter((u) => {
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

      {/* TABLE USERS */}
      <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-black/60 shadow-[0_0_32px_rgba(15,118,110,0.4)]">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-emerald-500/15 via-transparent to-emerald-500/10 border-b border-emerald-500/30 text-emerald-100/80">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Email</th>
              <th className="px-4 py-2 text-left font-medium">Name</th>
              <th className="px-4 py-2 text-left font-medium">Role</th>
              <th className="px-4 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr
                key={u._id}
                className="border-t border-emerald-500/10 bg-black/40 transition-colors hover:bg-emerald-500/5"
              >
                <td className="px-4 py-2 font-mono text-xs text-emerald-50">
                  {u.email}
                </td>
                <td className="px-4 py-2 text-sm text-emerald-50/80">
                  {u.name || "—"}
                </td>
                <td className="px-4 py-2">
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
                <td className="px-4 py-2 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-red-500/10"
                    onClick={() => handleDelete(u._id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td
                  colSpan={4}
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
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const description = String(form.get("description") || "").trim();
    const permissionsRaw = String(form.get("permissions") || "").trim();

    if (!name) return;

    const permissions = permissionsRaw
      ? permissionsRaw.split(",").map((p) => p.trim())
      : [];

    await createRole({
      appId,
      name,
      description: description || undefined,
      permissions,
    });

    e.currentTarget.reset();
  };

  const handleUpdate = async (role: Doc<"roles">) => {
    const newName = window.prompt("Role name", role.name);
    if (!newName) return;
    
    const newDescription = window.prompt(
      "Description (optional)",
      role.description || ""
    );
    
    const newPermissions = window.prompt(
      "Permissions (comma-separated)",
      role.permissions.join(", ")
    );
    
    try {
      await updateRole({
        roleId: role._id,
        name: newName,
        description: newDescription || undefined,
        permissions: newPermissions
          ? newPermissions.split(",").map((p) => p.trim())
          : [],
      });
    } catch (error: any) {
      alert(error.message || "Failed to update role");
    }
  };

  const handleDelete = async (roleId: Id<"roles">) => {
    if (!confirm("Delete this role?")) return;
    await deleteRole({ roleId });
  };

  return (
    <div className="space-y-6">
      {/* SEARCH */}
      <div className="relative">
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

      {/* FORM CREATE ROLE */}
      <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-5 shadow-[0_0_30px_rgba(16,185,129,0.25)] space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2 text-emerald-100">
          <Shield className="h-4 w-4 text-emerald-300" /> Create role
        </h2>
        <form
          onSubmit={handleCreate}
          className="grid gap-3 md:grid-cols-[1.3fr,1.7fr,1.5fr,auto]"
        >
          <Input
            name="name"
            placeholder="Role name (e.g. admin)"
            className="bg-black/60 border-emerald-500/30 text-sm placeholder:text-emerald-200/40 focus-visible:ring-emerald-400/60"
            required
          />
          <Input
            name="description"
            placeholder="Description (optional)"
            className="bg-black/60 border-emerald-500/20 text-sm placeholder:text-emerald-200/35 focus-visible:ring-emerald-400/60"
          />
          <Input
            name="permissions"
            placeholder="Permissions: users.read, users.write"
            className="bg-black/60 border-emerald-500/20 text-sm placeholder:text-emerald-200/35 focus-visible:ring-emerald-400/60"
          />
          <Button
            type="submit"
            size="sm"
            className="rounded-xl bg-emerald-500/90 text-black shadow-[0_0_18px_rgba(16,185,129,0.7)] hover:bg-emerald-400"
          >
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </form>
      </div>

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
                <td className="px-4 py-2 text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-emerald-500/10"
                    onClick={() => handleUpdate(r)}
                  >
                    <Edit3 className="h-4 w-4 text-emerald-300" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-red-500/10"
                    onClick={() => handleDelete(r._id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
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
  const deleteDeployment = useMutation(api.deployments.deleteDeployment);
  const [region, setRegion] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredDeployments = deployments.filter((d) => {
    const matchesSearch =
      !searchQuery ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.region.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const url = String(form.get("url") || "").trim();

    if (!name || !region || !url) return;

    await createDeployment({
      appId,
      name,
      region,
      url,
      status: "active",
    });

    e.currentTarget.reset();
    setRegion("");
  };

  const handleDelete = async (id: Id<"deployments">) => {
    if (!confirm("Delete this deployment?")) return;
    await deleteDeployment({ id });

  };

  return (
    <div className="space-y-6">
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

      {/* TABLE DEPLOYMENTS */}
      <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-black/60 shadow-[0_0_32px_rgba(15,118,110,0.4)]">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-emerald-500/15 via-transparent to-emerald-500/10 border-b border-emerald-500/30 text-emerald-100/80">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Name</th>
              <th className="px-4 py-2 text-left font-medium">Region</th>
              <th className="px-4 py-2 text-left font-medium">URL</th>
              <th className="px-4 py-2 text-left font-medium">Status</th>
              <th className="px-4 py-2 text-left font-medium">Created</th>
              <th className="px-4 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeployments.map((d) => (
              <tr
                key={d._id}
                className="border-t border-emerald-500/10 bg-black/40 transition-colors hover:bg-emerald-500/5"
              >
                <td className="px-4 py-2 font-medium text-emerald-50">
                  {d.name}
                </td>
                <td className="px-4 py-2 text-xs text-emerald-100/80">
                  {d.region}
                </td>
                <td className="px-4 py-2 text-xs">
                  <div className="flex items-center gap-2">
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                      className="underline text-emerald-300 hover:text-emerald-200 truncate max-w-[200px]"
                      title={d.url}
                  >
                    {d.url}
                  </a>
                    <button
                      onClick={() => navigator.clipboard.writeText(d.url)}
                      className="text-emerald-300/50 hover:text-emerald-300"
                      title="Copy URL"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      d.status === "active"
                        ? "bg-emerald-500/15 text-emerald-200"
                        : d.status === "error"
                        ? "bg-red-500/15 text-red-300"
                        : "bg-gray-500/15 text-gray-300"
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-emerald-100/70">
                  {new Date(d.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-red-500/10"
                    onClick={() => handleDelete(d._id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </td>
              </tr>
            ))}

            {filteredDeployments.length === 0 && (
              <tr>
                <td
                  colSpan={6}
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
    </div>
  );
}
/* ----------- Settings ----------- */
function SettingsTab({ app }: { app: Doc<"apps"> }) {
  const updateInfo = useMutation(api.apps.updateInfo);
  const [name, setName] = useState(app.name);
  const [region, setRegion] = useState(app.region);
  const [description, setDescription] = useState(app.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setIsSaving(true);
    try {
      await updateInfo({
        appId: app._id,
        name,
        region,
        description: description || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error: any) {
      alert(error.message || "Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    name !== app.name ||
    region !== app.region ||
    description !== (app.description || "");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-500/20 p-6 bg-black/50 shadow-[0_0_20px_rgba(0,255,180,0.2)]">
        <h2 className="text-emerald-200 text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-300" /> Application Settings
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-emerald-200/60 mb-1 block">App name</label>
            <Input
              className="bg-black/70 border-emerald-500/30 text-sm text-emerald-100"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My App"
            />
          </div>

          <div>
            <label className="text-xs text-emerald-200/60 mb-1 block">Region</label>
            <RegionSelect value={region} onChange={setRegion} />
          </div>

          <div>
            <label className="text-xs text-emerald-200/60 mb-1 block">Description (optional)</label>
            <textarea
              className="w-full rounded-xl bg-black/70 border border-emerald-500/30 px-3 py-2 text-sm text-emerald-100 placeholder:text-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your app..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="text-xs text-emerald-200/50">
            {hasChanges && "You have unsaved changes"}
          </div>
          <Button
          onClick={save}
            disabled={!hasChanges || isSaving}
            className="rounded-xl bg-emerald-500/90 px-4 py-2 text-black shadow-lg hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Activity className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : saved ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Saved!
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>

      {/* APP INFO */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-6 shadow-[0_0_32px_rgba(16,185,129,0.25)]">
        <h3 className="text-base font-semibold text-emerald-100 mb-4">App Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoRow
            label="App ID"
            value={
              <span className="font-mono text-xs">{String(app._id)}</span>
            }
          />
          <InfoRow
            label="Created"
            value={new Date(app.createdAt).toLocaleString()}
          />
          <InfoRow label="Region" value={app.region} />
          <InfoRow
            label="Owner"
            value={<span className="text-emerald-200/70">You</span>}
          />
        </div>
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
  const summary = useQuery(api.analytics.getSummary, { appId, days: 30 });
  const metrics = useQuery(api.analytics.getMetrics, { appId, days: 30 });
  const events = useQuery(api.analytics.getEvents, { appId, limit: 20 });

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

  return (
    <div className="space-y-6">
      {/* SUMMARY STATS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          icon={<Activity className="h-5 w-5 text-emerald-300" />}
          label="API Calls"
          value={summary?.totalApiCalls?.toLocaleString() ?? "0"}
        />
        <Stat
          icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
          label="Errors"
          value={summary?.totalErrors?.toLocaleString() ?? "0"}
        />
        <Stat
          icon={<Users className="h-5 w-5 text-blue-300" />}
          label="Active Users"
          value={summary?.activeUsers?.toLocaleString() ?? "0"}
        />
        <Stat
          icon={<Server className="h-5 w-5 text-purple-300" />}
          label="Deployments"
          value={`${summary?.activeDeployments ?? 0}/${summary?.totalDeployments ?? 0}`}
        />
      </div>

      {/* ERROR RATE */}
      {summary && (
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-6 shadow-[0_0_32px_rgba(16,185,129,0.25)]">
          <h3 className="text-base font-semibold text-emerald-100 mb-4">
            Error Rate
          </h3>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold text-emerald-50">
              {summary.errorRate.toFixed(2)}%
            </div>
            <div className="text-sm text-emerald-200/70 mb-1">
              of total requests
            </div>
          </div>
        </div>
      )}

      {/* METRICS CHART */}
      {dates.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-6 shadow-[0_0_32px_rgba(16,185,129,0.25)]">
          <h3 className="text-base font-semibold text-emerald-100 mb-4">
            Metrics (Last 30 Days)
          </h3>
          <div className="space-y-4">
            {/* API Calls Chart */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-emerald-200/70">API Calls</span>
                <span className="text-xs font-medium text-emerald-50">
                  {metricsByDate[dates[dates.length - 1]]?.["api_calls"] ?? 0}
                </span>
              </div>
              <div className="h-8 bg-black/40 rounded-lg overflow-hidden flex items-end gap-1 p-1">
                {dates.slice(-14).map((date) => {
                  const value = metricsByDate[date]?.["api_calls"] ?? 0;
                  const height = (value / maxValue) * 100;
                  return (
                    <div
                      key={date}
                      className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${date}: ${value}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Errors Chart */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-emerald-200/70">Errors</span>
                <span className="text-xs font-medium text-red-400">
                  {metricsByDate[dates[dates.length - 1]]?.["errors"] ?? 0}
                </span>
              </div>
              <div className="h-8 bg-black/40 rounded-lg overflow-hidden flex items-end gap-1 p-1">
                {dates.slice(-14).map((date) => {
                  const value = metricsByDate[date]?.["errors"] ?? 0;
                  const height = (value / maxValue) * 100;
                  return (
                    <div
                      key={date}
                      className="flex-1 bg-gradient-to-t from-red-500 to-red-400 rounded"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${date}: ${value}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECENT EVENTS */}
      <div className="rounded-2xl border border-emerald-500/20 bg-black/60 shadow-[0_0_32px_rgba(15,118,110,0.4)]">
        <div className="p-4 border-b border-emerald-500/30">
          <h3 className="text-base font-semibold text-emerald-100">
            Recent Events
          </h3>
        </div>
        <div className="divide-y divide-emerald-500/10">
          {events && events.length > 0 ? (
            events.map((event) => (
              <div
                key={event._id}
                className="p-4 hover:bg-emerald-500/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <div>
                      <p className="text-sm font-medium text-emerald-50">
                        {event.eventType}
                      </p>
                      <p className="text-xs text-emerald-200/60">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {event.metadata && (
                    <span className="text-xs text-emerald-200/50">
                      {JSON.stringify(event.metadata).slice(0, 30)}...
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-emerald-200/70">
              No events yet. Events will appear here as your app is used.
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

  const environments = ["all", "development", "staging", "production"];

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

  const filteredVars =
    selectedEnv === "all"
      ? envVars
      : envVars.filter((v) => v.environment === selectedEnv);

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const key = String(form.get("key") || "").trim();
    const value = String(form.get("value") || "").trim();
    const environment = String(form.get("environment") || "all");
    const isEncrypted = form.get("isEncrypted") === "on";
    const description = String(form.get("description") || "").trim();

    if (!key || !value || !environment) return;

    try {
      await createVar({
        appId,
        key,
        value,
        environment,
        isEncrypted,
        description: description || undefined,
      });
      e.currentTarget.reset();
    } catch (error: any) {
      alert(error.message || "Failed to create environment variable");
    }
  };

  const handleUpdate = async (envVarId: Id<"environmentVariables">) => {
    const envVar = envVars.find((v) => v._id === envVarId);
    if (!envVar) return;

    const newKey = window.prompt("Key", envVar.key);
    if (!newKey) return;

    const newValue = window.prompt(
      "Value",
      (envVar as any).decryptedValue || envVar.value
    );
    if (newValue === null) return;

    const newEnv = window.prompt(
      "Environment (development/staging/production/all)",
      envVar.environment
    );
    if (!newEnv) return;

    try {
      await updateVar({
        envVarId,
        key: newKey,
        value: newValue,
        environment: newEnv,
        isEncrypted: envVar.isEncrypted,
      });
    } catch (error: any) {
      alert(error.message || "Failed to update environment variable");
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
      {/* FILTER BY ENVIRONMENT & EXPORT */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-sm text-emerald-200/70">Filter:</span>
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

        {/* EXPORT BUTTONS */}
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

      {/* FORM CREATE ENV VAR */}
      <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-5 shadow-[0_0_30px_rgba(16,185,129,0.25)] space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2 text-emerald-100">
          <Key className="h-4 w-4 text-emerald-300" /> Create Environment Variable
        </h2>
        <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-[1.5fr,2fr,1.2fr,auto,auto]">
          <Input
            name="key"
            placeholder="KEY_NAME"
            className="bg-black/60 border-emerald-500/30 text-sm placeholder:text-emerald-200/40 focus-visible:ring-emerald-400/60"
            required
          />
          <Input
            name="value"
            type="password"
            placeholder="value"
            className="bg-black/60 border-emerald-500/20 text-sm placeholder:text-emerald-200/35 focus-visible:ring-emerald-400/60"
            required
          />
          <select
            name="environment"
            className="h-9 rounded-xl border border-emerald-500/25 bg-black/70 px-3 text-xs text-emerald-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
            defaultValue="all"
          >
            <option value="all">All</option>
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-emerald-200/70">
            <input
              type="checkbox"
              name="isEncrypted"
              className="rounded border-emerald-500/30"
            />
            Encrypt
          </label>
          <Button
            type="submit"
            size="sm"
            className="rounded-xl bg-emerald-500/90 text-black shadow-[0_0_18px_rgba(16,185,129,0.7)] hover:bg-emerald-400"
          >
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </form>
      </div>

      {/* TABLE ENV VARS */}
      <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-black/60 shadow-[0_0_32px_rgba(15,118,110,0.4)]">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-emerald-500/15 via-transparent to-emerald-500/10 border-b border-emerald-500/30 text-emerald-100/80">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Key</th>
              <th className="px-4 py-2 text-left font-medium">Value</th>
              <th className="px-4 py-2 text-left font-medium">Environment</th>
              <th className="px-4 py-2 text-left font-medium">Encrypted</th>
              <th className="px-4 py-2 text-right font-medium">Actions</th>
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
                  <td className="px-4 py-2 font-mono text-xs text-emerald-50">
                    {v.key}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-emerald-100/80">
                        {displayValue}
                      </span>
                  <button
                        onClick={() => copyValue(v._id, displayValue)}
                        className="text-emerald-300 hover:text-emerald-100 transition-colors"
                        title="Copy value"
                      >
                        {copied === v._id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                  </button>
                      {v.isEncrypted && (
                        <button
                          onClick={() => toggleShowValue(v._id)}
                          className="text-emerald-300 hover:text-emerald-100"
                          title={isShowing ? "Hide value" : "Show value"}
                        >
                          {isShowing ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-[11px] font-medium text-emerald-200">
                      {v.environment}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {v.isEncrypted ? (
                      <span className="px-2 py-1 rounded-full bg-blue-500/20 text-[11px] font-medium text-blue-300">
                        Encrypted
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-200/50">Plain</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-emerald-500/10"
                      onClick={() => handleUpdate(v._id)}
                    >
                      <Edit3 className="h-4 w-4 text-emerald-300" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-red-500/10"
                      onClick={() => handleDelete(v._id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                </td>
              </tr>
              );
            })}

            {filteredVars.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-emerald-200/70"
                >
                  No environment variables yet. Create one above 🔐
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
