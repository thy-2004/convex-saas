import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/_auth/dashboard/apps/$appId/_layout"
)({
  component: () => <Outlet />,
});
