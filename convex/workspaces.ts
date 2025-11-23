// convex/workspaces.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

async function assertOwnsApp(ctx: any, appId: string) {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const app = await ctx.db.get(appId);
  if (!app || app.ownerId !== userId) throw new Error("App not found");
  return app;
}

export const create = mutation({
  args: {
    appId: v.id("apps"),
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    await assertOwnsApp(ctx, args.appId);
    const now = Date.now();
    return await ctx.db.insert("workspaces", {
      appId: args.appId,
      name: args.name.trim(),
      slug: args.slug.trim(),
      createdAt: now,
    });
  },
});

export const list = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    await assertOwnsApp(ctx, args.appId);
    const ws = await ctx.db
      .query("workspaces")
      .withIndex("by_app", q => q.eq("appId", args.appId))
      .collect();
    ws.sort((a, b) => b.createdAt - a.createdAt);
    return ws;
  },
});
