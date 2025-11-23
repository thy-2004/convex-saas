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

type TabKey = "overview" | "users" | "roles" | "deployments" | "settings" | "api-keys";

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
  const createdAt = new Date(app.createdAt).toLocaleString();
  const deleteAppMutation = useMutation(api.apps.deleteApp);

  return (
    <div className="space-y-6">
      {/* STATS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Stat
          icon={<Globe2 className="h-5 w-5 text-emerald-300" />}
          label="Region"
          value={app.region}
        />
        <Stat
          icon={<CalendarClock className="h-5 w-5 text-emerald-300" />}
          label="Created"
          value={createdAt}
        />
        <Stat
          icon={<Activity className="h-5 w-5 text-emerald-400" />}
          label="Status"
          value="Active"
          badge
        />
      </div>

      {/* INFO */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-emerald-900/10 p-6 shadow-[0_0_32px_rgba(16,185,129,0.25)] space-y-4">
        <h2 className="text-lg font-semibold text-emerald-100">
          Application details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoRow label="Name" value={app.name ?? "Untitled app"} />
          <InfoRow label="Region" value={app.region} />
          <InfoRow label="Environment" value="Production" />
          <InfoRow
            label="Deployments"
            value={deployments.length.toString()}
          />
        </div>
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
            if (!confirm("Are you sure you want to delete this app?")) return;

            await deleteAppMutation({ appId: app._id });
            window.location.href = "/_app/_auth/dashboard/apps";
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

  return (
    <div className="space-y-6">
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
            {users.map((u) => (
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

            {users.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-emerald-200/70"
                >
                  No users yet. Invite someone above ✨
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
    await updateRole({ roleId: role._id, name: newName });
  };

  const handleDelete = async (roleId: Id<"roles">) => {
    if (!confirm("Delete this role?")) return;
    await deleteRole({ roleId });
  };

  return (
    <div className="space-y-6">
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
            {roles.map((r) => (
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

            {roles.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-emerald-200/70"
                >
                  No roles yet. Create one above to start managing permissions.
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
            {deployments.map((d) => (
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
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-emerald-300 hover:text-emerald-200"
                  >
                    {d.url}
                  </a>
                </td>
                <td className="px-4 py-2">
                  <span className="px-2 py-1 rounded-full bg-emerald-500/15 text-xs font-medium text-emerald-200">
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

            {deployments.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-emerald-200/70"
                >
                  No deployments yet. Create your first deployment above 🚀
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

  const save = async () => {
    await updateInfo({ appId: app._id, name, region });
    alert("Updated!");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-500/20 p-6 bg-black/50 shadow-[0_0_20px_rgba(0,255,180,0.2)]">
        <h2 className="text-emerald-200 text-lg font-semibold mb-4">Application Settings</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-emerald-200/60 mb-1">App name</p>
            <input
              className="rounded-xl bg-black/70 border border-emerald-500/30 px-3 py-2 text-sm text-emerald-100"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <p className="text-xs text-emerald-200/60 mb-1">Region</p>
            <RegionSelect value={region} onChange={setRegion} />
          </div>
        </div>

        <button
          onClick={save}
          className="mt-4 rounded-xl bg-emerald-500/90 px-4 py-2 text-black shadow-lg hover:bg-emerald-400"
        >
          Save changes
        </button>
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

  const createNew = async () => {
    const type = prompt("Type: public | secret | webhook") || "public";
    const name = prompt("Key name") || "New Key";

    const key = generateKey(type === "public" ? "pk" : "sk");

    await createKey({ appId, name, type, key });

    alert("Created!");
  };

  return (
    <div className="space-y-6">
      <button
        onClick={createNew}
        className="rounded-xl bg-emerald-500/90 text-black px-4 py-2 shadow-lg hover:bg-emerald-400"
      >
        + Create API Key
      </button>

      <div className="rounded-2xl border border-emerald-500/20 bg-black/60 shadow-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-emerald-500/10 text-emerald-200 border-b border-emerald-500/20">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Key</th>
              <th className="px-4 py-2 text-left">Active</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr
                key={k._id}
                className="border-t border-emerald-500/10 hover:bg-emerald-500/5"
              >
                <td className="px-4 py-2">{k.name}</td>
                <td className="px-4 py-2 text-xs">{k.type}</td>
                <td className="px-4 py-2 font-mono text-xs">{k.key}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => toggle({ keyId: k._id })}
                    className={
                      k.active
                        ? "px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs"
                        : "px-2 py-1 rounded-full bg-red-500/20 text-red-300 text-xs"
                    }
                  >
                    {k.active ? "Active" : "Disabled"}
                  </button>
                </td>

                <td className="px-4 py-2 text-right space-x-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(k.key)}
                    className="text-emerald-300 hover:text-emerald-100"
                  >
                    Copy
                  </button>

                  <button
                    onClick={() => deleteKey({ keyId: k._id })}
                    className="text-red-400 hover:text-red-200"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {keys.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-emerald-300/60">
                  No keys yet. Create one above 🔑
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-wide text-emerald-200/60">
        {label}
      </p>
      <p className="text-sm font-medium text-emerald-50">{value}</p>
    </div>
  );
}
