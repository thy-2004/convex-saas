import { internal } from "@cvx/_generated/api";
import { mutation, query } from "@cvx/_generated/server";
import { auth } from "@cvx/auth";
import { currencyValidator, PLANS } from "@cvx/schema";
import { asyncMap } from "convex-helpers";
import { v } from "convex/values";
import { User } from "~/types";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx): Promise<User | undefined> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return;
    }
    const [user, subscription] = await Promise.all([
      ctx.db.get(userId),
      ctx.db
        .query("subscriptions")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .unique(),
    ]);
    if (!user) {
      return;
    }
    const plan = subscription?.planId
      ? await ctx.db.get(subscription.planId)
      : undefined;
    const avatarUrl = user.imageId
      ? await ctx.storage.getUrl(user.imageId)
      : user.image;
    return {
      ...user,
      avatarUrl: avatarUrl || undefined,
      subscription:
        subscription && plan
          ? {
              ...subscription,
              planKey: plan.key,
            }
          : undefined,
    };
  },
});

export const updateUsername = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return;
    }
    await ctx.db.patch(userId, { username: args.username });
  },
});

export const completeOnboarding = mutation({
  args: {
    username: v.string(),
    currency: currencyValidator,
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return;
    }
    await ctx.db.patch(userId, { username: args.username });
    if (user.customerId) {
      return;
    }
    await ctx.scheduler.runAfter(
      0,
      internal.stripe.PREAUTH_createStripeCustomer,
      {
        currency: args.currency,
        userId,
      },
    );
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not found");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateUserImage = mutation({
  args: {
    imageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return;
    }
    ctx.db.patch(userId, { imageId: args.imageId });
  },
});

export const removeUserImage = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return;
    }
    ctx.db.patch(userId, { imageId: undefined, image: undefined });
  },
});

export const getActivePlans = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }
    
    // Try to get plans from database
    const [free, pro] = await asyncMap(
      [PLANS.FREE, PLANS.PRO] as const,
      async (key) => {
        const plan = await ctx.db
          .query("plans")
          .withIndex("key", (q) => q.eq("key", key))
          .unique();
        return plan;
      },
    );
    
    // If plans don't exist, return null
    // The frontend will show a message to initialize plans
    if (!free || !pro) {
      console.warn("Plans not found in database. Please run init function to seed plans.");
      return null;
    }
    
    return { free, pro };
  },
});

// Mutation to create fallback plans (without Stripe integration)
export const createFallbackPlans = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    
    // Check if plans already exist
    const existingFree = await ctx.db
      .query("plans")
      .withIndex("key", (q) => q.eq("key", PLANS.FREE))
      .unique();
    const existingPro = await ctx.db
      .query("plans")
      .withIndex("key", (q) => q.eq("key", PLANS.PRO))
      .unique();
    
    if (existingFree && existingPro) {
      return { message: "Plans already exist", free: existingFree, pro: existingPro };
    }
    
    // Create fallback FREE plan
    const freePlanId = existingFree?._id || await ctx.db.insert("plans", {
      key: PLANS.FREE,
      stripeId: "fallback_free_" + Date.now(),
      name: "Free",
      description: "Start with the basics, upgrade anytime.",
      prices: {
        month: {
          usd: { stripeId: "fallback_free_month_usd", amount: 0 },
          eur: { stripeId: "fallback_free_month_eur", amount: 0 },
        },
        year: {
          usd: { stripeId: "fallback_free_year_usd", amount: 0 },
          eur: { stripeId: "fallback_free_year_eur", amount: 0 },
        },
      },
    });
    
    // Create fallback PRO plan
    const proPlanId = existingPro?._id || await ctx.db.insert("plans", {
      key: PLANS.PRO,
      stripeId: "fallback_pro_" + Date.now(),
      name: "Pro",
      description: "Access to all features and unlimited projects.",
      prices: {
        month: {
          usd: { stripeId: "fallback_pro_month_usd", amount: 1990 },
          eur: { stripeId: "fallback_pro_month_eur", amount: 1990 },
        },
        year: {
          usd: { stripeId: "fallback_pro_year_usd", amount: 19990 },
          eur: { stripeId: "fallback_pro_year_eur", amount: 19990 },
        },
      },
    });
    
    const freePlan = existingFree || await ctx.db.get(freePlanId);
    const proPlan = existingPro || await ctx.db.get(proPlanId);
    
    return { 
      message: "Fallback plans created successfully", 
      free: freePlan, 
      pro: proPlan 
    };
  },
});

export const deleteCurrentUserAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .unique();
    if (!subscription) {
      console.error("No subscription found");
    } else {
      await ctx.db.delete(subscription._id);
      await ctx.scheduler.runAfter(
        0,
        internal.stripe.cancelCurrentUserSubscriptions,
      );
    }
    await ctx.db.delete(userId);
    await asyncMap(["resend-otp", "github"], async (provider) => {
      const authAccount = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) =>
          q.eq("userId", userId).eq("provider", provider),
        )
        .unique();
      if (!authAccount) {
        return;
      }
      await ctx.db.delete(authAccount._id);
    });
  },
});
