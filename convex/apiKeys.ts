// convex/apiKeys.ts
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

// ---------------------- CREATE ----------------------
export const create = mutation({
  args: {
    appId: v.id("apps"),
    name: v.string(),
    type: v.string(),  // <— thêm
    key: v.string(),
  },
  handler: async (ctx, args) => {
    await assertOwnsApp(ctx, args.appId);

    return await ctx.db.insert("apiKeys", {
      appId: args.appId,
      name: args.name.trim(),
      type: args.type,                 // <— thêm
      key: args.key.trim(),
      active: true,                    // <— thêm
      createdAt: Date.now(),
      lastUsedAt: undefined,
    });
  },
});

// ---------------------- LIST ----------------------
export const list = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    await assertOwnsApp(ctx, args.appId);

    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_app", q => q.eq("appId", args.appId))
      .collect();

    keys.sort((a, b) => b.createdAt - a.createdAt);

    return keys;
  },
});

// ---------------------- DELETE ----------------------
export const remove = mutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.keyId);
  },
});

// ---------------------- TOGGLE ACTIVE ----------------------
export const toggleActive = mutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db.get(args.keyId);
    if (!key) throw new Error("Key not found");

    return await ctx.db.patch(args.keyId, {
      active: !key.active,
    });
  },
});
