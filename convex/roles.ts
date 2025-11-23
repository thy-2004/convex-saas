// convex/roles.ts
import { query, mutation } from "@cvx/_generated/server";
import { v } from "convex/values";

export const listRoles = query({
  args: { appId: v.id("apps") },
  async handler(ctx, args) {
    return await ctx.db
      .query("roles")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .order("desc")
      .collect();
  },
});

export const createRole = mutation({
  args: {
    appId: v.id("apps"),
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
  },
  async handler(ctx, args) {
    const now = Date.now();
    return await ctx.db.insert("roles", {
      appId: args.appId,
      name: args.name,
      description: args.description,
      permissions: args.permissions,
      createdAt: now,
    });
  },
});

export const updateRole = mutation({
  args: {
    roleId: v.id("roles"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
  },
  async handler(ctx, args) {
    const patch: any = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.description !== undefined) patch.description = args.description;
    if (args.permissions !== undefined) patch.permissions = args.permissions;

    await ctx.db.patch(args.roleId, patch);
  },
});

export const deleteRole = mutation({
  args: { roleId: v.id("roles") },
  async handler(ctx, args) {
    await ctx.db.delete(args.roleId);
  },
});
