// convex/appUsers.ts
import { query, mutation } from "@cvx/_generated/server";
import { v } from "convex/values";

export const listUsers = query({
  args: { appId: v.id("apps") },
  async handler(ctx, args) {
    return await ctx.db
      .query("appUsers")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .order("desc")
      .collect();
  },
});

export const createUser = mutation({
  args: {
    appId: v.id("apps"),
    email: v.string(),
    name: v.optional(v.string()),
    roleId: v.optional(v.id("roles")),
  },
  async handler(ctx, args) {
    const now = Date.now();
    return await ctx.db.insert("appUsers", {
      appId: args.appId,
      email: args.email,
      name: args.name ?? "",
      roleId: args.roleId,
      createdAt: now,
    });
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("appUsers"),
    name: v.optional(v.string()),
    roleId: v.optional(v.id("roles")),
  },
  async handler(ctx, args) {
    const patch: any = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.roleId !== undefined) patch.roleId = args.roleId;

    await ctx.db.patch(args.userId, patch);
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("appUsers") },
  async handler(ctx, args) {
    await ctx.db.delete(args.userId);
  },
});
