import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/misc";
import { buttonVariants } from "@/ui/button-util";
import { CreateMenu } from "@/ui/create-menu";
import { api } from "@cvx/_generated/api";
import { useQuery } from "convex/react";

export const Route = createFileRoute("/_app/_auth/dashboard/")({
  component: Dashboard,
});

export default function Dashboard() {
  const { t } = useTranslation();
  const apps = useQuery(api.apps.listApps) ?? [];

  return (
    <div className="flex h-full w-full bg-secondary px-6 py-8 dark:bg-black">
      <div className="mx-auto flex h-full w-full max-w-screen-xl gap-12">
        <div className="flex w-full flex-col rounded-lg border border-border bg-card">
          
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Your Apps</h2>

            <div className="space-y-2">
              {apps.map((app) => (
                <Link
                  key={app._id}
                  to="/_app/_auth/dashboard/apps/$appId/"

                  params={{ appId: app._id }}
                  className="block p-4 rounded-lg border border-border bg-card hover:bg-muted"
                >
                  <p className="font-medium">{app.name}</p>
                  <p className="text-sm text-primary/60">Region: {app.region}</p>
                </Link>
              ))}

              {apps.length === 0 && (
                <p className="text-primary/60 text-sm">No apps yet.</p>
              )}
            </div>
          </div>

          {/* divider */}
          <div className="w-full px-6">
            <div className="w-full border-b border-border" />
          </div>

          {/* GET STARTED */}
          <div className="relative mx-auto flex w-full flex-col items-center p-6">
            <div className="relative flex w-full flex-col items-center gap-6 rounded-lg border border-border px-6 py-24">
              
              <CreateMenu />

              <p className="text-base font-medium text-primary">{t("title")}</p>
              <p className="text-center text-base text-primary/60">
                {t("description")}
              </p>

              <a
                target="_blank"
                rel="noreferrer"
                href="https://github.com/get-convex/convex-saas/tree/main/docs"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}
              >
                Explore Documentation
                <ExternalLink className="h-4 w-4 text-primary/60" />
              </a>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
