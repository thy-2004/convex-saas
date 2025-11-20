import { internalQuery } from "./_generated/server";

import { v } from "convex/values";

export const getByKey = internalQuery({

  args: { key: v.string() },
  async handler(ctx, args) {
    return await ctx.db
      .query("apiKeys")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
  },
});
