import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ExternalLink, Search, X, Server, Users, Globe2, CalendarClock, ArrowRight, Sparkles, TrendingUp, Shield, Key, AlertCircle, Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { cn } from "@/utils/misc";
import { buttonVariants } from "@/ui/button-util";
import { CreateMenu } from "@/ui/create-menu";
import { Input } from "@/ui/input";
import { api } from "@cvx/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "@cvx/_generated/dataModel";

export const Route = createFileRoute("/_app/_auth/dashboard/")({
  component: Dashboard,
});

function AppCard({ appId }: { appId: Id<"apps"> }) {
  const navigate = useNavigate();
  const app = useQuery(api.apps.getApp, { appId });
  const users = useQuery(api.appUsers.listUsers, { appId }) ?? [];
  const roles = useQuery(api.roles.listRoles, { appId }) ?? [];
  const deployments = useQuery(api.deployments.listDeployments, { appId }) ?? [];
  const envVars = useQuery(api.environmentVariables.list, { appId }) ?? [];
  const apiKeys = useQuery(api.apiKeys.list, { appId }) ?? [];
  const summary = useQuery(api.analytics.getSummary, { appId, days: 7 });

  if (!app) return null;

  const handleClick = () => {
    const appIdString = String(app._id);
    navigate({
      to: "/dashboard/apps/$appId/",
      params: { appId: appIdString },
    });
  };

  const activeDeployments = deployments.filter((d) => d.status === "active").length;
  const totalDeployments = deployments.length;
  const apiCalls = summary?.totalApiCalls ?? 0;
  const errors = summary?.totalErrors ?? 0;
  const errorRate = apiCalls > 0 ? ((errors / apiCalls) * 100).toFixed(1) : "0.0";
  const activeUsers = summary?.activeUsers ?? 0;

  return (
    <div
      onClick={handleClick}
      className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/90 via-slate-900/50 to-emerald-950/20 p-6 shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:border-emerald-500/40 hover:shadow-[0_0_50px_rgba(16,185,129,0.3)] transition-all duration-300 cursor-pointer backdrop-blur-sm"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:via-emerald-500/0 group-hover:to-emerald-500/5 transition-all duration-300 pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 group-hover:bg-emerald-300 transition-colors shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
              <h3 className="text-xl font-bold text-emerald-50 group-hover:text-white transition-colors truncate">
                {app.name}
              </h3>
            </div>
            {app.description ? (
              <p className="text-sm text-emerald-200/70 line-clamp-2 leading-relaxed mb-3">
                {app.description}
              </p>
            ) : (
              <p className="text-xs text-emerald-200/40 italic mb-3">Chưa có mô tả</p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 p-2.5 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
            <ArrowRight className="h-5 w-5 text-emerald-300/70 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 mb-5 pb-4 border-b border-emerald-500/10">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <Globe2 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-200/90 capitalize font-mono">{app.region}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <CalendarClock className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-200/90">
              {new Date(app.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Main Statistics - Row 1 */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 group-hover:border-blue-500/30 transition-colors">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-semibold text-emerald-200/80 uppercase tracking-wide">Users</span>
            </div>
            <div className="text-2xl font-bold text-blue-300">{users.length}</div>
            {activeUsers > 0 && (
              <div className="text-xs text-emerald-200/50 mt-1">{activeUsers} active</div>
            )}
          </div>
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 group-hover:border-purple-500/30 transition-colors">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Server className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-semibold text-emerald-200/80 uppercase tracking-wide">Deploy</span>
            </div>
            <div className="text-2xl font-bold text-purple-300">
              <span className="text-purple-300">{activeDeployments}</span>
              <span className="text-emerald-200/50 text-lg">/{totalDeployments}</span>
            </div>
            {totalDeployments > 0 && (
              <div className="text-xs text-emerald-200/50 mt-1">
                {Math.round((activeDeployments / totalDeployments) * 100)}% active
              </div>
            )}
          </div>
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 group-hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-200/80 uppercase tracking-wide">API</span>
            </div>
            <div className="text-2xl font-bold text-emerald-300">
              {apiCalls.toLocaleString()}
            </div>
            {errors > 0 && (
              <div className="text-xs text-red-400/70 mt-1">{errors} errors</div>
            )}
          </div>
        </div>

        {/* Secondary Statistics - Row 2 */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-lg bg-black/20 group-hover:bg-black/30 transition-colors">
            <Shield className="h-3.5 w-3.5 text-yellow-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-emerald-100">{roles.length}</div>
            <div className="text-[10px] text-emerald-200/50 uppercase">Roles</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-black/20 group-hover:bg-black/30 transition-colors">
            <Key className="h-3.5 w-3.5 text-orange-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-emerald-100">{envVars.length}</div>
            <div className="text-[10px] text-emerald-200/50 uppercase">Env</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-black/20 group-hover:bg-black/30 transition-colors">
            <Key className="h-3.5 w-3.5 text-red-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-emerald-100">{apiKeys.length}</div>
            <div className="text-[10px] text-emerald-200/50 uppercase">Keys</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-black/20 group-hover:bg-black/30 transition-colors">
            {parseFloat(errorRate) > 5 ? (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-red-400 mx-auto mb-1" />
                <div className="text-sm font-bold text-red-400">{errorRate}%</div>
                <div className="text-[10px] text-emerald-200/50 uppercase">Error</div>
              </>
            ) : (
              <>
                <Activity className="h-3.5 w-3.5 text-emerald-400 mx-auto mb-1" />
                <div className="text-sm font-bold text-emerald-300">{errorRate}%</div>
                <div className="text-[10px] text-emerald-200/50 uppercase">Error</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const apps = useQuery(api.apps.listApps) ?? [];
  const [searchQuery, setSearchQuery] = useState("");

  const filteredApps = apps.filter((app) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.name.toLowerCase().includes(query) ||
      app.region.toLowerCase().includes(query) ||
      app.description?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-slate-950 to-black">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 mb-2">
                Your Apps
              </h1>
              <p className="text-emerald-200/60 text-sm">
                Quản lý và theo dõi tất cả ứng dụng của bạn
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-100">{filteredApps.length}</div>
                <div className="text-xs text-emerald-200/60 uppercase tracking-wide">
                  {filteredApps.length === 1 ? "App" : "Apps"}
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          {apps.length > 0 && (
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400/50" />
              <Input
                placeholder="Tìm kiếm theo tên, region, hoặc mô tả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-10 h-12 bg-black/40 border-emerald-500/30 text-sm text-emerald-100 placeholder:text-emerald-200/40 focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:border-emerald-400/50 backdrop-blur-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-emerald-200/50 hover:text-emerald-200 hover:bg-emerald-500/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Apps Grid */}
        {filteredApps.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredApps.map((app) => (
              <AppCard key={app._id} appId={app._id} />
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
              <Sparkles className="h-16 w-16 text-emerald-400/50 relative z-10" />
            </div>
            <h3 className="text-xl font-semibold text-emerald-100 mb-2">Chưa có ứng dụng nào</h3>
            <p className="text-emerald-200/60 text-sm text-center max-w-md mb-6">
              Bắt đầu bằng cách tạo ứng dụng đầu tiên của bạn để quản lý users, roles, deployments và nhiều hơn nữa.
            </p>
            <CreateMenu />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <Search className="h-12 w-12 text-emerald-400/30 mb-4" />
            <h3 className="text-xl font-semibold text-emerald-100 mb-2">Không tìm thấy kết quả</h3>
            <p className="text-emerald-200/60 text-sm text-center max-w-md">
              Không có ứng dụng nào phù hợp với từ khóa "<span className="text-emerald-300">{searchQuery}</span>"
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-sm font-medium transition-colors border border-emerald-500/20"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {/* Get Started Section */}
        {apps.length > 0 && (
          <div className="mt-12 pt-8 border-t border-emerald-500/10">
            <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl bg-gradient-to-br from-emerald-950/20 via-slate-950/40 to-emerald-950/20 border border-emerald-500/10">
              <div className="mb-4">
                <Sparkles className="h-8 w-8 text-emerald-400/60" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-100 mb-2">{t("title")}</h3>
              <p className="text-center text-sm text-emerald-200/60 max-w-md mb-6">
                {t("description")}
              </p>
              <div className="flex items-center gap-4">
                <CreateMenu />
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://github.com/get-convex/convex-saas/tree/main/docs"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 text-emerald-200/70 hover:text-emerald-100 border border-emerald-500/20 hover:border-emerald-500/40")}
                >
                  Documentation
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
