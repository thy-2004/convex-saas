import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const listDeployments = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, { appId }) => {
    return await ctx.db
      .query("deployments")
      .withIndex("by_app", (q) => q.eq("appId", appId))
      .collect();
  },
});

export const createDeployment = mutation({
  args: {
    appId: v.id("apps"),
    name: v.string(),
    region: v.string(),
    url: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const deploymentId = await ctx.db.insert("deployments", {
      ...args,
      createdAt: Date.now(),
    });

    // Track analytics event
    await ctx.runMutation(internal.analytics.trackEventInternal, {
      appId: args.appId,
      eventType: "deployment_created",
      metadata: { name: args.name, region: args.region, url: args.url },
      deploymentId: deploymentId,
    });

    return deploymentId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("deployments"),
    status: v.string(),
  },
  handler: async (ctx, { id, status }) => {
    const deployment = await ctx.db.get(id);
    if (!deployment) throw new Error("Deployment not found");

    await ctx.db.patch(id, { status });

    // Track analytics event
    await ctx.runMutation(internal.analytics.trackEventInternal, {
      appId: deployment.appId,
      eventType: "deployment_status_updated",
      metadata: { name: deployment.name, status },
      deploymentId: id,
    });
  },
});

export const deleteDeployment = mutation({
  args: { id: v.id("deployments") },
  handler: async (ctx, { id }) => {
    const deployment = await ctx.db.get(id);
    if (!deployment) return;

    await ctx.db.delete(id);

    // Track analytics event
    await ctx.runMutation(internal.analytics.trackEventInternal, {
      appId: deployment.appId,
      eventType: "deployment_deleted",
      metadata: { name: deployment.name },
      deploymentId: id,
    });
  },
});
