import { mutation, query, internalMutation } from "@cvx/_generated/server";
import { v } from "convex/values";
import { auth } from "@cvx/auth";

/** Internal function to track events (can be called from other mutations) */
export const trackEventInternal = internalMutation({
  args: {
    appId: v.id("apps"),
    eventType: v.string(),
    metadata: v.optional(v.any()),
    userId: v.optional(v.id("appUsers")),
    deploymentId: v.optional(v.id("deployments")),
  },
  handler: async (ctx, args) => {
    // Insert event
    await ctx.db.insert("analyticsEvents", {
      appId: args.appId,
      eventType: args.eventType,
      metadata: args.metadata,
      userId: args.userId,
      deploymentId: args.deploymentId,
      timestamp: Date.now(),
    });

    // Update aggregated metrics (async, non-blocking)
    await updateMetrics(ctx, args.appId, args.eventType);
  },
});

/** Track an analytics event (public API) */
export const trackEvent = mutation({
  args: {
    appId: v.id("apps"),
    eventType: v.string(),
    metadata: v.optional(v.any()),
    userId: v.optional(v.id("appUsers")),
    deploymentId: v.optional(v.id("deployments")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Verify user owns the app
    const app = await ctx.db.get(args.appId);
    if (!app || app.ownerId !== userId) {
      throw new Error("Unauthorized");
    }

    // Insert event directly (already verified auth)
    await ctx.db.insert("analyticsEvents", {
      appId: args.appId,
      eventType: args.eventType,
      metadata: args.metadata,
      userId: args.userId,
      deploymentId: args.deploymentId,
      timestamp: Date.now(),
    });

    // Update aggregated metrics
    await updateMetrics(ctx, args.appId, args.eventType);
  },
});

/** Update aggregated metrics for an event */
async function updateMetrics(
  ctx: any,
  appId: any,
  eventType: string
) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Map event types to metric types
  const metricTypeMap: Record<string, string> = {
    api_call: "api_calls",
    error: "errors",
    user_login: "active_users",
    deployment_created: "deployments",
  };

  const metricType = metricTypeMap[eventType] || eventType;

    // Find existing metric for today
    const existing = await ctx.db
      .query("analyticsMetrics")
      .withIndex("by_app_type_date", (q: any) =>
        q.eq("appId", appId).eq("metricType", metricType).eq("date", today)
      )
      .first();

  if (existing) {
    // Increment existing metric
    await ctx.db.patch(existing._id, {
      value: existing.value + 1,
      updatedAt: Date.now(),
    });
  } else {
    // Create new metric
    await ctx.db.insert("analyticsMetrics", {
      appId,
      date: today,
      metricType,
      value: 1,
      updatedAt: Date.now(),
    });
  }
}

/** Get analytics events for an app */
export const getEvents = query({
  args: {
    appId: v.id("apps"),
    eventType: v.optional(v.string()),
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Verify user owns the app
    const app = await ctx.db.get(args.appId);
    if (!app || app.ownerId !== userId) {
      throw new Error("Unauthorized");
    }

    let query = ctx.db
      .query("analyticsEvents")
      .withIndex("by_app", (q) => q.eq("appId", args.appId));

    if (args.eventType) {
      query = ctx.db
        .query("analyticsEvents")
        .withIndex("by_app_type", (q: any) =>
          q.eq("appId", args.appId).eq("eventType", args.eventType)
        );
    }

    let events = await query.order("desc").take(args.limit || 100);

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      events = events.filter((event) => {
        if (args.startDate && event.timestamp < args.startDate) return false;
        if (args.endDate && event.timestamp > args.endDate) return false;
        return true;
      });
    }

    return events;
  },
});

/** Get aggregated metrics for an app */
export const getMetrics = query({
  args: {
    appId: v.id("apps"),
    metricType: v.optional(v.string()),
    days: v.optional(v.number()), // Number of days to look back
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Verify user owns the app
    const app = await ctx.db.get(args.appId);
    if (!app || app.ownerId !== userId) {
      throw new Error("Unauthorized");
    }

    const days = args.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    let query = ctx.db
      .query("analyticsMetrics")
      .withIndex("by_app", (q) => q.eq("appId", args.appId));

    if (args.metricType) {
      query = ctx.db
        .query("analyticsMetrics")
        .withIndex("by_app_type_date", (q: any) =>
          q
            .eq("appId", args.appId)
            .eq("metricType", args.metricType)
            .gte("date", startDateStr)
        );
    } else {
      query = ctx.db
        .query("analyticsMetrics")
        .withIndex("by_app_date", (q: any) =>
          q.eq("appId", args.appId).gte("date", startDateStr)
        );
    }

    const metrics = await query.collect();
    return metrics;
  },
});

/** Get analytics summary (totals, averages, etc.) */
export const getSummary = query({
  args: {
    appId: v.id("apps"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const app = await ctx.db.get(args.appId);
    if (!app || app.ownerId !== userId) {
      throw new Error("Unauthorized");
    }

    const days = args.days || 30;
    const startTimestamp = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get recent events
    const events = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_app_timestamp", (q) =>
        q.eq("appId", args.appId).gte("timestamp", startTimestamp)
      )
      .collect();

    // Calculate summary
    const apiCalls = events.filter((e) => e.eventType === "api_call").length;
    const errors = events.filter((e) => e.eventType === "error").length;
    const uniqueUsers = new Set(
      events
        .filter((e) => e.userId)
        .map((e) => e.userId)
        .filter(Boolean)
    ).size;

    // Get deployments count
    const deployments = await ctx.db
      .query("deployments")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .collect();

    return {
      totalApiCalls: apiCalls,
      totalErrors: errors,
      errorRate: apiCalls > 0 ? (errors / apiCalls) * 100 : 0,
      activeUsers: uniqueUsers,
      totalDeployments: deployments.length,
      activeDeployments: deployments.filter((d) => d.status === "active").length,
    };
  },
});

