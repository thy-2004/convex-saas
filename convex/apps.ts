import { mutation, query } from "@cvx/_generated/server";
import { v } from "convex/values";
import { auth } from "@cvx/auth";

/** Create a new App */
export const createApp = mutation({
  args: {
    name: v.string(),
    region: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    return await ctx.db.insert("apps", {
      name: args.name,
      region: args.region,
      description: args.description,
      ownerId: userId,
      createdAt: Date.now(),
    });
  },
});

/** List all apps of current user */
export const listApps = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("apps")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .order("desc")
      .collect();
  },
});

/** Get details for one app */
export const getApp = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const app = await ctx.db.get(args.appId);
    if (!app || app.ownerId !== userId) return null;

    return app;
  },
});
export const deleteApp = mutation({
  args: {
    appId: v.id("apps"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const app = await ctx.db.get(args.appId);
    if (!app || app.ownerId !== userId) {
      throw new Error("App not found");
    }

    // TODO: sau này xóa luôn users/roles/deployments liên quan
    await ctx.db.delete(args.appId);
  },
});

/** Update app info */
export const updateInfo = mutation({
  args: {
    appId: v.id("apps"),
    name: v.optional(v.string()),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const app = await ctx.db.get(args.appId);
    if (!app || app.ownerId !== userId) {
      throw new Error("App not found");
    }

    await ctx.db.patch(args.appId, {
      ...(args.name !== undefined && { name: args.name }),
      ...(args.region !== undefined && { region: args.region }),
    });
  },
});