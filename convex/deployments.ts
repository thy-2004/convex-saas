import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
    await ctx.db.insert("deployments", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const deleteDeployment = mutation({
  args: { id: v.id("deployments") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
