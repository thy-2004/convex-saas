import { mutation, query } from "@cvx/_generated/server";
import { v } from "convex/values";
import { auth } from "@cvx/auth";

/** Create a new App */
export const createApp = mutation({
  args: {
    name: v.string(),
    region: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    return await ctx.db.insert("apps", {
      name: args.name,
      region: args.region,
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
