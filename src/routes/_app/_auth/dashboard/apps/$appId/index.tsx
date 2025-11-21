import { createFileRoute } from "@tanstack/react-router";
import { api } from "@cvx/_generated/api";
import { useQuery } from "convex/react";
import type { Id } from "@cvx/_generated/dataModel";

export const Route = createFileRoute(
  "/_app/_auth/dashboard/apps/$appId/"
)({
  component: AppDetailPage,
});

function AppDetailPage() {
  const { appId } = Route.useParams();
  const typedAppId = appId as Id<"apps">; // ⭐ FIX Convex TS type

  const app = useQuery(api.apps.getApp, { appId: typedAppId });

  if (!app) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{app.name}</h1>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Region: <span className="font-medium">{app.region}</span>
        </p>

        <p className="text-sm text-muted-foreground">
          Created at:{" "}
          <span className="font-medium">
            {new Date(app.createdAt).toLocaleString()}
          </span>
        </p>
      </div>
    </div>
  );
}
