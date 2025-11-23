import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "@cvx/_generated/api";
import { useQuery } from "convex/react";

export const Route = createFileRoute(
  "/_app/_auth/dashboard/apps/"
)({
  component: AppsPage,
});

function AppsPage() {
  const apps = useQuery(api.apps.listApps) ?? [];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Your Apps</h2>

      <div className="space-y-2">
        {apps.map(app => (
          <Link
            key={app._id}
            to="/_app/_auth/dashboard/apps/$appId/"
            params={{ appId: app._id }}
            className="block p-4 rounded-lg border bg-card hover:bg-muted"
          >
            <p className="font-medium">{app.name}</p>
            <p className="text-sm text-primary/60">Region: {app.region}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
