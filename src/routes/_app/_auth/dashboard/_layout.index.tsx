import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/misc.js";
import { buttonVariants } from "@/ui/button-util";
import siteConfig from "~/site.config";
import { CreateMenu } from "@/ui/create-menu";
import { api } from "@cvx/_generated/api";
import { useQuery } from "convex/react";

export const Route = createFileRoute("/_app/_auth/dashboard/_layout/")({
  component: Dashboard,
  beforeLoad: () => ({
    title: `${siteConfig.siteTitle} - Dashboard`,
    headerTitle: "Dashboard",
    headerDescription: "Manage your Apps and view your usage.",
  }),
});

export default function Dashboard() {
  const { t } = useTranslation();
  const apps = useQuery(api.apps.listApps) ?? [];

  return (
    <div className="flex h-full w-full bg-secondary px-6 py-8 dark:bg-black">
      <div className="z-10 mx-auto flex h-full w-full max-w-screen-xl gap-12">
        <div className="flex w-full flex-col rounded-lg border border-border bg-card dark:bg-black">

          {/* ⭐ Your Apps */}
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Your Apps</h2>

            <div className="space-y-2">
              {apps.map((app) => (
                <Link
                  key={app._id}
                  to="/_app/_auth/dashboard/apps/$appId/"
                  params={{ appId: app._id }}
                  className="block p-4 rounded-lg border border-border bg-card hover:bg-muted cursor-pointer transition"
                >
                  <p className="font-medium">{app.name}</p>
                  <p className="text-sm text-primary/60">
                    Region: {app.region}
                  </p>
                </Link>
              ))}

              {apps.length === 0 && (
                <p className="text-primary/60 text-sm">No apps yet.</p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="flex w-full px-6">
            <div className="w-full border-b border-border" />
          </div>

          {/* ⭐ Get Started block */}
          <div className="relative mx-auto flex w-full flex-col items-center p-6">
            <div className="relative flex w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-lg border border-border bg-secondary px-6 py-24 dark:bg-card">

              <div className="z-10 flex max-w-[460px] flex-col items-center gap-4">
                <CreateMenu />

                <div className="flex flex-col items-center gap-2">
                  <p className="text-base font-medium text-primary">{t("title")}</p>

                  <p className="text-center text-base font-normal text-primary/60">
                    {t("description")}
                  </p>
                </div>
              </div>

              <div className="z-10 flex items-center justify-center">
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://github.com/get-convex/convex-saas/tree/main/docs"
                  className={cn(
                    `${buttonVariants({ variant: "ghost", size: "sm" })} gap-2`
                  )}
                >
                  <span className="text-sm font-medium text-primary/60 group-hover:text-primary">
                    Explore Documentation
                  </span>
                  <ExternalLink className="h-4 w-4 stroke-[1.5px] text-primary/60 group-hover:text-primary" />
                </a>
              </div>

              <div className="base-grid absolute h-full w-full opacity-40" />
              <div className="absolute bottom-0 h-full w-full bg-gradient-to-t from-[hsl(var(--card))] to-transparent" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
