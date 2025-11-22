import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "@cvx/_generated/api";
import { useQuery } from "convex/react";
import { Button } from "@/ui/button";

export const Route = createFileRoute("/_app/_auth/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  const apps = useQuery(api.apps.listApps) ?? [];

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
          <p className="text-sm text-primary/60">
            Manage your Apps and view your usage.
          </p>
        </div>

        {/* Nút mở modal tạo app – bạn đã có component rồi thì gọi ở đây */}
        {/* <CreateAppDialog /> */}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-primary">Your Apps</h2>

        <div className="grid grid-cols-1 gap-3">
          {apps.map((app) => (
            <Link
              key={app._id}
              to="/_app/_auth/dashboard/apps/$appId/"
              params={{ appId: app._id }}
              className="block rounded-lg border border-border bg-card px-4 py-3 hover:bg-secondary transition"
            >
              <div className="text-base font-medium">{app.name}</div>
              <div className="text-sm text-primary/60">
                Region: {app.region}
              </div>
            </Link>
          ))}

          {apps.length === 0 && (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-primary/60 text-center">
              You don&apos;t have any apps yet.
              <br />
              Click <span className="font-medium">New App</span> to create one.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
