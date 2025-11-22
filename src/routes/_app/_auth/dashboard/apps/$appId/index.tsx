import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "@cvx/_generated/api";
import { Id } from "@cvx/_generated/dataModel";
import { useQuery } from "convex/react";
import { useState } from "react";

export const Route = createFileRoute(
  "/_app/_auth/dashboard/apps/$appId/"
)({
  component: AppOverviewPage,
});

function AppOverviewPage() {
  const { appId } = Route.useParams();
  const typedId = appId as Id<"apps">;

  const app = useQuery(api.apps.getApp, { appId: typedId });
  const [open, setOpen] = useState(false);

  if (!app) return <p>Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      {/* TITLE */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">{app.name} – Overview</h1>

        {/* DROPDOWN MENU */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Actions ▾
          </button>

          {open && (
            <div className="absolute right-0 mt-2 bg-card border rounded shadow-lg w-56">
              {[
                "New User",
                "New Organization",
                "New Workspace",
                "New API Key",
                "New Email Template",
                "New Subscription Plan",
                "New Deployment",
                "New Role / Permission",
              ].map((item) => (
                <button
                  key={item}
                  className="block w-full text-left px-4 py-2 hover:bg-secondary"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* INFO */}
      <div className="border p-4 rounded bg-secondary">
        <p className="text-primary/80">Region: {app.region}</p>
        <p className="text-primary/80">Created: {app.createdAt}</p>
        <p className="text-primary/80">Status: Active</p>
      </div>

      {/* BACK BUTTON */}
      <Link
        to="/_app/_auth/dashboard"
        className="inline-block px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
