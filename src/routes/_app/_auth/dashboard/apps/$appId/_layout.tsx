import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/_auth/dashboard/apps/$appId/_layout"
)({
  beforeLoad: ({ location, params }) => {
    const path = location.pathname;
    // Nếu path không kết thúc bằng "/" và không có sub-route, redirect
    // Check if path ends with just the appId (no trailing slash, no sub-routes)
    if (path === `/_app/_auth/dashboard/apps/${params.appId}`) {
      throw redirect({
        to: "/_app/_auth/dashboard/apps/$appId/",
        params: { appId: params.appId },
        replace: true,
      });
    }
  },
  component: () => <Outlet />,
});
