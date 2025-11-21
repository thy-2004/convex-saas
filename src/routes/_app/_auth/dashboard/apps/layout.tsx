import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/_auth/dashboard/apps/layout"
)({
  component: AppsLayout,
});

function AppsLayout() {
  return (
    <div className="p-6">
      <Outlet />
    </div>
  );
}
