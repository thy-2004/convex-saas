import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "@cvx/_generated/api";
import { useQuery } from "convex/react";

export const Route = createFileRoute("/_app/_auth/dashboard/apps/")({
  component: AppsListPage,
});

function AppsListPage() {
  const apps = useQuery(api.apps.listApps) ?? [];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-semibold">Your Apps</h2>

      <div className="grid gap-3">
        {apps.map(app => (
          <Link
            key={app._id}
            to="./$appId/"
            params={{ appId: app._id }}
            className="block border p-4 rounded-lg hover:bg-gray-800"
          >
            <div className="font-medium">{app.name}</div>
            <div className="text-sm opacity-60">Region: {app.region}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
