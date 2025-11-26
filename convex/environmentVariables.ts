import { mutation, query } from "@cvx/_generated/server";
import { v } from "convex/values";
import { auth } from "@cvx/auth";
import { internal } from "@cvx/_generated/api";

// Simple encryption/decryption (in production, use proper encryption)
function encrypt(value: string): string {
  // Simple base64 encoding for demo (use proper encryption in production)
  return btoa(value);
}

function decrypt(encrypted: string): string {
  // Simple base64 decoding for demo
  try {
    return atob(encrypted);
  } catch {
    return encrypted; // Return as-is if not encrypted
  }
}

/** List environment variables for an app */
export const list = query({
  args: {
    appId: v.id("apps"),
    environment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const app = await ctx.db.get(args.appId);
    if (!app || app.ownerId !== userId) {
      throw new Error("Unauthorized");
    }

    let query = ctx.db
      .query("environmentVariables")
      .withIndex("by_app", (q: any) => q.eq("appId", args.appId));

    if (args.environment) {
      query = ctx.db
        .query("environmentVariables")
        .withIndex("by_app_env", (q: any) =>
          q.eq("appId", args.appId).eq("environment", args.environment)
        );
    }

    const vars = await query.collect();

    // Decrypt sensitive values for display (masked)
    return vars.map((v) => ({
      ...v,
      value: v.isEncrypted ? "••••••••" : v.value,
      decryptedValue: v.isEncrypted ? decrypt(v.value) : v.value, // For editing
    }));
  },
});

/** Get a single environment variable (with decrypted value) */
export const get = query({
  args: {
    envVarId: v.id("environmentVariables"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const envVar = await ctx.db.get(args.envVarId);
    if (!envVar) return null;

    const app = await ctx.db.get(envVar.appId);
    if (!app || app.ownerId !== userId) {
      throw new Error("Unauthorized");
    }

    return {
      ...envVar,
      decryptedValue: envVar.isEncrypted ? decrypt(envVar.value) : envVar.value,
    };
  },
});

/** Create environment variable */
export const create = mutation({
  args: {
    appId: v.id("apps"),
    key: v.string(),
    value: v.string(),
    isEncrypted: v.optional(v.boolean()),
    environment: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const app = await ctx.db.get(args.appId);
    if (!app || app.ownerId !== userId) {
      throw new Error("Unauthorized");
    }

    // Check if key already exists for this app and environment
    const existing = await ctx.db
      .query("environmentVariables")
      .withIndex("by_app_key", (q: any) =>
        q.eq("appId", args.appId).eq("key", args.key)
      )
      .filter((q: any) => q.eq(q.field("environment"), args.environment))
      .first();

    if (existing) {
      throw new Error(
        `Environment variable "${args.key}" already exists for ${args.environment}`
      );
    }

    const now = Date.now();
    const encryptedValue = args.isEncrypted
      ? encrypt(args.value)
      : args.value;

    const envVarId = await ctx.db.insert("environmentVariables", {
      appId: args.appId,
      key: args.key,
      value: encryptedValue,
      isEncrypted: args.isEncrypted || false,
      environment: args.environment,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });

    // Track analytics event
    await ctx.runMutation(internal.analytics.trackEventInternal, {
      appId: args.appId,
      eventType: "env_var_created",
      metadata: { key: args.key, environment: args.environment },
    });

    return envVarId;
  },
});

/** Update environment variable */
export const update = mutation({
  args: {
    envVarId: v.id("environmentVariables"),
    key: v.optional(v.string()),
    value: v.optional(v.string()),
    isEncrypted: v.optional(v.boolean()),
    environment: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const envVar = await ctx.db.get(args.envVarId);
    if (!envVar) throw new Error("Environment variable not found");

    const app = await ctx.db.get(envVar.appId);
    if (!app || app.ownerId !== userId) {
      throw new Error("Unauthorized");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.key !== undefined) updateData.key = args.key;
    if (args.environment !== undefined)
      updateData.environment = args.environment;
    if (args.description !== undefined)
      updateData.description = args.description;
    if (args.isEncrypted !== undefined)
      updateData.isEncrypted = args.isEncrypted;

    if (args.value !== undefined) {
      // If changing encryption status, handle accordingly
      const shouldEncrypt = args.isEncrypted ?? envVar.isEncrypted;
      updateData.value = shouldEncrypt ? encrypt(args.value) : args.value;
      updateData.isEncrypted = shouldEncrypt;
    }

    await ctx.db.patch(args.envVarId, updateData);

    // Track analytics event
    await ctx.runMutation(internal.analytics.trackEventInternal, {
      appId: envVar.appId,
      eventType: "env_var_updated",
      metadata: { key: envVar.key },
    });
  },
});

/** Delete environment variable */
export const remove = mutation({
  args: {
    envVarId: v.id("environmentVariables"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const envVar = await ctx.db.get(args.envVarId);
    if (!envVar) throw new Error("Environment variable not found");

    const app = await ctx.db.get(envVar.appId);
    if (!app || app.ownerId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.envVarId);

    // Track analytics event
    await ctx.runMutation(internal.analytics.trackEventInternal, {
      appId: envVar.appId,
      eventType: "env_var_deleted",
      metadata: { key: envVar.key },
    });
  },
});

/** Bulk import environment variables */
export const bulkImport = mutation({
  args: {
    appId: v.id("apps"),
    variables: v.array(
      v.object({
        key: v.string(),
        value: v.string(),
        isEncrypted: v.optional(v.boolean()),
        environment: v.string(),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const app = await ctx.db.get(args.appId);
    if (!app || app.ownerId !== userId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const results = [];

    for (const variable of args.variables) {
      // Check if exists
      const existing = await ctx.db
        .query("environmentVariables")
        .withIndex("by_app_key", (q: any) =>
          q.eq("appId", args.appId).eq("key", variable.key)
        )
        .filter((q: any) =>
          q.eq(q.field("environment"), variable.environment)
        )
        .first();

      if (existing) {
        // Update existing
        const encryptedValue = variable.isEncrypted
          ? encrypt(variable.value)
          : variable.value;
        await ctx.db.patch(existing._id, {
          value: encryptedValue,
          isEncrypted: variable.isEncrypted || false,
          description: variable.description,
          updatedAt: now,
        });
        results.push({ key: variable.key, action: "updated" });
      } else {
        // Create new
        const encryptedValue = variable.isEncrypted
          ? encrypt(variable.value)
          : variable.value;
        await ctx.db.insert("environmentVariables", {
          appId: args.appId,
          key: variable.key,
          value: encryptedValue,
          isEncrypted: variable.isEncrypted || false,
          environment: variable.environment,
          description: variable.description,
          createdAt: now,
          updatedAt: now,
        });
        results.push({ key: variable.key, action: "created" });
      }
    }

    // Track analytics event
    await ctx.runMutation(internal.analytics.trackEventInternal, {
      appId: args.appId,
      eventType: "env_vars_bulk_imported",
      metadata: { count: args.variables.length },
    });

    return results;
  },
});

