import { Outlet, createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { api } from "@cvx/_generated/api";
import { Id } from "@cvx/_generated/dataModel";
import { useQuery } from "convex/react";
import { Button } from "@/ui/button";
import AppNewMenu from "@/ui/app-new-menu";

import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute(
  "/_app/_auth/dashboard/apps/$appId/_layout"
)({
  component: AppLayout,
});

function AppLayout() {
  const { appId } = Route.useParams();
  const typedId = appId as Id<"apps">;

  const app = useQuery(api.apps.getApp, { appId: typedId });

  if (app === undefined) {
    return (
      <div className="px-6 py-8">
        <p className="text-sm text-primary/60">Loading app…</p>
      </div>
    );
  }

  if (app === null) {
    return (
      <div className="px-6 py-8">
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3">
          <p className="text-sm font-medium text-destructive">
            App not found or you don&apos;t have access.
          </p>
        </div>
      </div>
    );
  }

  const router = useRouter();

  return (
    <div className="flex h-full w-full bg-secondary px-6 py-8 dark:bg-black">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-6">
        {/* Header: back + app info + New dropdown */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="inline-flex items-center gap-2 px-0 text-primary/60 hover:text-primary"
              onClick={() =>
                router.navigate({ to: "/_app/_auth/dashboard/" })
              }
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>

            <div>
              <h1 className="text-2xl font-semibold text-primary">
                {app.name}
              </h1>
              <p className="text-sm text-primary/60">
                Region: <span className="font-medium">{app.region}</span>
              </p>
            </div>
          </div>

          {/* Menu New ... */}
          <AppNewMenu appId={app._id as Id<"apps">} />
        </header>

        {/* Tabs – tạm thời chỉ có Overview */}
        <nav className="flex items-center gap-4 border-b border-border/60 text-sm">
          <Link
            to="/_app/_auth/dashboard/apps/$appId/"
            params={{ appId: app._id }}
            className="border-b-2 border-primary pb-2 text-primary font-medium"
          >
            Overview
          </Link>
          {/* Sau này muốn thêm Settings, Billing, Deployments… ở đây */}
        </nav>

        {/* Nội dung con */}
        <main className="pt-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
