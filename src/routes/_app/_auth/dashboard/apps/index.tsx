import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "@cvx/_generated/api";
import { useQuery } from "convex/react";

export const Route = createFileRoute(
  "/_app/_auth/dashboard/apps/"
)({
  component: AppsListPage,
});

function AppsListPage() {
  const apps = useQuery(api.apps.listApps) ?? [];

  return (
    <div className="p-6 space-y-6">

      <h2 className="text-lg font-semibold text-primary">Your Apps</h2>

      <div className="grid grid-cols-1 gap-3">
        {apps.map((app) => (
          <Link
            key={app._id}
            to={"/_app/_auth/dashboard/apps/$appId"}
            params={{ appId: app._id }}
            className="block rounded-lg border border-border bg-card px-4 py-3 hover:bg-secondary transition"
          >
            <div className="text-base font-medium">{app.name}</div>
            <div className="text-sm text-primary/60">
              Region: <span className="font-medium">{app.region}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
