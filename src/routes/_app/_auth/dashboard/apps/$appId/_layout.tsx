import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/_auth/dashboard/apps/$appId/_layout"
)({
  beforeLoad: ({ location, params }) => {
    const path = location.pathname;
    // Nếu thiếu dấu "/" thì redirect đúng route
    if (!path.endsWith("/")) {
      throw redirect({
        to: "/_app/_auth/dashboard/apps/$appId/",
        params: { appId: params.appId },
        replace: true,
      });
    }
  },
  component: () => <Outlet />,
});
