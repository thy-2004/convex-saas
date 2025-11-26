import { internal } from "@cvx/_generated/api";
import { mutation, query, internalMutation, internalAction, action, internalQuery } from "@cvx/_generated/server";
import { auth } from "@cvx/auth";
import { currencyValidator, PLANS } from "@cvx/schema";
import { asyncMap } from "convex-helpers";
import { v } from "convex/values";
import { User } from "~/types";
import { STRIPE_PRODUCT_FREE, STRIPE_PRODUCT_PRO } from "@cvx/env";
import { stripe } from "@cvx/stripe";

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

// Internal action to fetch Stripe prices and update plans
export const updatePlansWithStripeIdsInternal = internalAction({
  args: {},
  handler: async (ctx): Promise<{ message: string; free: any; pro: any }> => {
    // Get existing plans
    const freePlan = await ctx.runQuery(internal.app.getFreePlan);
    const proPlan = await ctx.runQuery(internal.app.getProPlan);
    
    if (!freePlan || !proPlan) {
      throw new Error("Plans not found. Please create plans first.");
    }
    
    let freeProductId = STRIPE_PRODUCT_FREE;
    let proProductId = STRIPE_PRODUCT_PRO;
    
    // If product IDs not set or don't exist, create new products
    if (!freeProductId || !proProductId) {
      console.log("Stripe product IDs not configured, creating new products...");
      // Create FREE product
      const freeProduct = await stripe.products.create({
        name: "Free",
        description: "Start with the basics, upgrade anytime.",
      });
      // Create FREE prices
      const freeMonthUsdPrice = await stripe.prices.create({
        product: freeProduct.id,
        currency: "usd",
        unit_amount: 0,
        recurring: { interval: "month" },
      });
      const freeMonthEurPrice = await stripe.prices.create({
        product: freeProduct.id,
        currency: "eur",
        unit_amount: 0,
        recurring: { interval: "month" },
      });
      const freeYearUsdPrice = await stripe.prices.create({
        product: freeProduct.id,
        currency: "usd",
        unit_amount: 0,
        recurring: { interval: "year" },
      });
      const freeYearEurPrice = await stripe.prices.create({
        product: freeProduct.id,
        currency: "eur",
        unit_amount: 0,
        recurring: { interval: "year" },
      });
      
      // Create PRO product
      const proProduct = await stripe.products.create({
        name: "Pro",
        description: "Access to all features and unlimited projects.",
      });
      // Create PRO prices
      const proMonthUsdPrice = await stripe.prices.create({
        product: proProduct.id,
        currency: "usd",
        unit_amount: 1990,
        recurring: { interval: "month" },
      });
      const proMonthEurPrice = await stripe.prices.create({
        product: proProduct.id,
        currency: "eur",
        unit_amount: 1990,
        recurring: { interval: "month" },
      });
      const proYearUsdPrice = await stripe.prices.create({
        product: proProduct.id,
        currency: "usd",
        unit_amount: 19990,
        recurring: { interval: "year" },
      });
      const proYearEurPrice = await stripe.prices.create({
        product: proProduct.id,
        currency: "eur",
        unit_amount: 19990,
        recurring: { interval: "year" },
      });
      
      freeProductId = freeProduct.id;
      proProductId = proProduct.id;
      
      // Update plans directly with new prices
      await ctx.runMutation(internal.app.updateFreePlanWithStripeIds, {
        planId: freePlan._id,
        stripeId: freeProductId,
        prices: {
          month: {
            usd: { stripeId: freeMonthUsdPrice.id, amount: 0 },
            eur: { stripeId: freeMonthEurPrice.id, amount: 0 },
          },
          year: {
            usd: { stripeId: freeYearUsdPrice.id, amount: 0 },
            eur: { stripeId: freeYearEurPrice.id, amount: 0 },
          },
        },
      });
      
      await ctx.runMutation(internal.app.updateProPlanWithStripeIds, {
        planId: proPlan._id,
        stripeId: proProductId,
        prices: {
          month: {
            usd: { stripeId: proMonthUsdPrice.id, amount: 1990 },
            eur: { stripeId: proMonthEurPrice.id, amount: 1990 },
          },
          year: {
            usd: { stripeId: proYearUsdPrice.id, amount: 19990 },
            eur: { stripeId: proYearEurPrice.id, amount: 19990 },
          },
        },
      });
      
      const updatedFree: any = await ctx.runQuery(internal.app.getFreePlan);
      const updatedPro: any = await ctx.runQuery(internal.app.getProPlan);
      
      return {
        message: "Stripe products and plans created successfully",
        free: updatedFree,
        pro: updatedPro,
      };
    }
    
    // Try to fetch prices, if product doesn't exist, create new one
    let freePrices;
    let proPrices;
    
    try {
      freePrices = await stripe.prices.list({
        product: freeProductId,
        limit: 100,
      });
    } catch (error: any) {
      if (error.message?.includes("No such product")) {
        console.log(`Product ${freeProductId} not found, creating new FREE product...`);
        const freeProduct = await stripe.products.create({
          name: "Free",
          description: "Start with the basics, upgrade anytime.",
        });
        const freeMonthUsdPrice = await stripe.prices.create({
          product: freeProduct.id,
          currency: "usd",
          unit_amount: 0,
          recurring: { interval: "month" },
        });
        const freeMonthEurPrice = await stripe.prices.create({
          product: freeProduct.id,
          currency: "eur",
          unit_amount: 0,
          recurring: { interval: "month" },
        });
        const freeYearUsdPrice = await stripe.prices.create({
          product: freeProduct.id,
          currency: "usd",
          unit_amount: 0,
          recurring: { interval: "year" },
        });
        const freeYearEurPrice = await stripe.prices.create({
          product: freeProduct.id,
          currency: "eur",
          unit_amount: 0,
          recurring: { interval: "year" },
        });
        freeProductId = freeProduct.id;
        freePrices = { data: [freeMonthUsdPrice, freeMonthEurPrice, freeYearUsdPrice, freeYearEurPrice] };
      } else {
        throw error;
      }
    }
    
    try {
      proPrices = await stripe.prices.list({
        product: proProductId,
        limit: 100,
      });
    } catch (error: any) {
      if (error.message?.includes("No such product")) {
        console.log(`Product ${proProductId} not found, creating new PRO product...`);
        const proProduct = await stripe.products.create({
          name: "Pro",
          description: "Access to all features and unlimited projects.",
        });
        const proMonthUsdPrice = await stripe.prices.create({
          product: proProduct.id,
          currency: "usd",
          unit_amount: 1990,
          recurring: { interval: "month" },
        });
        const proMonthEurPrice = await stripe.prices.create({
          product: proProduct.id,
          currency: "eur",
          unit_amount: 1990,
          recurring: { interval: "month" },
        });
        const proYearUsdPrice = await stripe.prices.create({
          product: proProduct.id,
          currency: "usd",
          unit_amount: 19990,
          recurring: { interval: "year" },
        });
        const proYearEurPrice = await stripe.prices.create({
          product: proProduct.id,
          currency: "eur",
          unit_amount: 19990,
          recurring: { interval: "year" },
        });
        proProductId = proProduct.id;
        proPrices = { data: [proMonthUsdPrice, proMonthEurPrice, proYearUsdPrice, proYearEurPrice] };
      } else {
        throw error;
      }
    }
    
    // Helper to find price by currency and interval
    const findPrice = (prices: typeof freePrices.data, currency: string, interval: string) => {
      return prices.find(
        (p) => p.currency === currency && p.recurring?.interval === interval
      );
    };
    
    // Prepare updates for FREE plan
    const freeMonthUsd = findPrice(freePrices.data, "usd", "month");
    const freeMonthEur = findPrice(freePrices.data, "eur", "month");
    const freeYearUsd = findPrice(freePrices.data, "usd", "year");
    const freeYearEur = findPrice(freePrices.data, "eur", "year");
    
    // Prepare updates for PRO plan
    const proMonthUsd = findPrice(proPrices.data, "usd", "month");
    const proMonthEur = findPrice(proPrices.data, "eur", "month");
    const proYearUsd = findPrice(proPrices.data, "usd", "year");
    const proYearEur = findPrice(proPrices.data, "eur", "year");
    
    // Update plans using mutations
      await ctx.runMutation(internal.app.updateFreePlanWithStripeIds, {
        planId: freePlan._id,
        stripeId: freeProductId,
      prices: {
        month: {
          usd: freeMonthUsd ? { stripeId: freeMonthUsd.id, amount: freeMonthUsd.unit_amount || 0 } : freePlan.prices.month.usd,
          eur: freeMonthEur ? { stripeId: freeMonthEur.id, amount: freeMonthEur.unit_amount || 0 } : freePlan.prices.month.eur,
        },
        year: {
          usd: freeYearUsd ? { stripeId: freeYearUsd.id, amount: freeYearUsd.unit_amount || 0 } : freePlan.prices.year.usd,
          eur: freeYearEur ? { stripeId: freeYearEur.id, amount: freeYearEur.unit_amount || 0 } : freePlan.prices.year.eur,
        },
      },
    });
    
      await ctx.runMutation(internal.app.updateProPlanWithStripeIds, {
        planId: proPlan._id,
        stripeId: proProductId,
      prices: {
        month: {
          usd: proMonthUsd ? { stripeId: proMonthUsd.id, amount: proMonthUsd.unit_amount || 0 } : proPlan.prices.month.usd,
          eur: proMonthEur ? { stripeId: proMonthEur.id, amount: proMonthEur.unit_amount || 0 } : proPlan.prices.month.eur,
        },
        year: {
          usd: proYearUsd ? { stripeId: proYearUsd.id, amount: proYearUsd.unit_amount || 0 } : proPlan.prices.year.usd,
          eur: proYearEur ? { stripeId: proYearEur.id, amount: proYearEur.unit_amount || 0 } : proPlan.prices.year.eur,
        },
      },
    });
    
    const updatedFree: any = await ctx.runQuery(internal.app.getFreePlan);
    const updatedPro: any = await ctx.runQuery(internal.app.getProPlan);
    
    return {
      message: "Plans updated successfully with Stripe IDs",
      free: updatedFree,
      pro: updatedPro,
    };
  },
});

// Helper queries to get plans
export const getFreePlan = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("plans")
      .withIndex("key", (q) => q.eq("key", PLANS.FREE))
      .unique();
  },
});

export const getProPlan = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("plans")
      .withIndex("key", (q) => q.eq("key", PLANS.PRO))
      .unique();
  },
});

// Helper mutations to update plans
export const updateFreePlanWithStripeIds = internalMutation({
  args: {
    planId: v.id("plans"),
    stripeId: v.string(),
    prices: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.planId, {
      stripeId: args.stripeId,
      prices: args.prices,
    });
  },
});

export const updateProPlanWithStripeIds = internalMutation({
  args: {
    planId: v.id("plans"),
    stripeId: v.string(),
    prices: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.planId, {
      stripeId: args.stripeId,
      prices: args.prices,
    });
  },
});

// Public action wrapper (can be called from Dashboard or UI)
export const updatePlansWithStripeIds = action({
  args: {},
  handler: async (ctx): Promise<{ message: string; free: any; pro: any }> => {
    // Allow anyone to run this (or add admin check if needed)
    return await ctx.runAction(internal.app.updatePlansWithStripeIdsInternal, {});
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
