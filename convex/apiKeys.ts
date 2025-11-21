import { mutation} from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./lib/getCurrentUserId";

function generateApiKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return "sk_" + Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

export const createAppKey = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const apiKey = generateApiKey();

    const id = await ctx.db.insert("apiKeys", {
      name: args.name,
      description: args.description,
      key: apiKey,
      createdAt: Date.now(),
      userId: userId,
    });

    return { id, apiKey };
  },
});
