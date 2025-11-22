import { convexQuery } from "@convex-dev/react-query";
import { api } from "@cvx/_generated/api";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  component: Outlet,
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(
        convexQuery(api.app.getCurrentUser, {})
      );
    } catch (err) {
      console.warn("Failed to load current user:", err);
    }
  },
});
