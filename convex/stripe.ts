import Stripe from "stripe";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "@cvx/_generated/server";
import { v } from "convex/values";
import { ERRORS } from "~/errors";
import { auth } from "@cvx/auth";
import { currencyValidator, intervalValidator, PLANS } from "@cvx/schema";
import { api, internal } from "~/convex/_generated/api";
import { SITE_URL, STRIPE_SECRET_KEY } from "@cvx/env";
import { asyncMap } from "convex-helpers";

/**
 * TODO: Uncomment to require Stripe keys.
 * Also remove the `|| ''` from the Stripe constructor.
 */
/*
if (!STRIPE_SECRET_KEY) {
  throw new Error(`Stripe - ${ERRORS.ENVS_NOT_INITIALIZED})`)
}
*/

export const stripe = new Stripe(STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
  typescript: true,
});

/**
 * The following functions are prefixed 'PREAUTH' or 'UNAUTH' because they are
 * used as scheduled functions and do not have a currently authenticated user to
 * reference. PREAUTH means a user id is passed in, and must be authorized prior
 * to scheduling the function. UNAUTH means authorization is not required.
 *
 * All PREAUTH and UNAUTH functions should be internal.
 *
 * Note: this is an arbitrary naming convention, feel free to change or remove.
 */

/**
 * Creates a Stripe customer for a user.
 */
export const PREAUTH_updateCustomerId = internalMutation({
  args: {
    userId: v.id("users"),
    customerId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { customerId: args.customerId });
  },
});

export const PREAUTH_getUserById = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.userId);
  },
});

export const PREAUTH_createStripeCustomer = internalAction({
  args: {
    currency: currencyValidator,
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.stripe.PREAUTH_getUserById, {
      userId: args.userId,
    });
    if (!user || user.customerId)
      throw new Error(ERRORS.STRIPE_CUSTOMER_NOT_CREATED);

    const customer = await stripe.customers
      .create({ email: user.email, name: user.username })
      .catch((err) => console.error(err));
    if (!customer) throw new Error(ERRORS.STRIPE_CUSTOMER_NOT_CREATED);

    await ctx.runAction(internal.stripe.PREAUTH_createFreeStripeSubscription, {
      userId: args.userId,
      customerId: customer.id,
      currency: args.currency,
    });
  },
});

export const UNAUTH_getDefaultPlan = internalQuery({
  handler: async (ctx) => {
    return ctx.db
      .query("plans")
      .withIndex("key", (q) => q.eq("key", PLANS.FREE))
      .unique();
  },
});

export const PREAUTH_getUserByCustomerId = internalQuery({
  args: {
    customerId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("customerId", (q) => q.eq("customerId", args.customerId))
      .unique();
    if (!user) {
      throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
    }
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .unique();
    if (!subscription) {
      throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
    }
    const plan = await ctx.db.get(subscription.planId);
    if (!plan) {
      throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
    }
    return {
      ...user,
      subscription: {
        ...subscription,
        planKey: plan.key,
      },
    };
  },
});

export const PREAUTH_createSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    planId: v.id("plans"),
    priceStripeId: v.string(),
    currency: currencyValidator,
    stripeSubscriptionId: v.string(),
    status: v.string(),
    interval: intervalValidator,
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (subscription) {
      throw new Error("Subscription already exists");
    }
    await ctx.db.insert("subscriptions", {
      userId: args.userId,
      planId: args.planId,
      priceStripeId: args.priceStripeId,
      stripeId: args.stripeSubscriptionId,
      currency: args.currency,
      interval: args.interval,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
    });
  },
});

export const PREAUTH_replaceSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    subscriptionStripeId: v.string(),
    input: v.object({
      currency: currencyValidator,
      planStripeId: v.string(),
      priceStripeId: v.string(),
      interval: intervalValidator,
      status: v.string(),
      currentPeriodStart: v.number(),
      currentPeriodEnd: v.number(),
      cancelAtPeriodEnd: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!subscription) {
      throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
    }
    await ctx.db.delete(subscription._id);
    const plan = await ctx.db
      .query("plans")
      .withIndex("stripeId", (q) => q.eq("stripeId", args.input.planStripeId))
      .unique();
    if (!plan) {
      throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
    }
    await ctx.db.insert("subscriptions", {
      userId: args.userId,
      planId: plan._id,
      stripeId: args.subscriptionStripeId,
      priceStripeId: args.input.priceStripeId,
      interval: args.input.interval,
      status: args.input.status,
      currency: args.input.currency,
      currentPeriodStart: args.input.currentPeriodStart,
      currentPeriodEnd: args.input.currentPeriodEnd,
      cancelAtPeriodEnd: args.input.cancelAtPeriodEnd,
    });
  },
});

export const PREAUTH_deleteSubscription = internalMutation({
  args: {
    subscriptionStripeId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("stripeId", (q) => q.eq("stripeId", args.subscriptionStripeId))
      .unique();
    if (!subscription) {
      throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
    }
    await ctx.db.delete(subscription._id);
  },
});

/**
 * Creates a Stripe free tier subscription for a user.
 */
export const PREAUTH_createFreeStripeSubscription = internalAction({
  args: {
    userId: v.id("users"),
    customerId: v.string(),
    currency: currencyValidator,
  },
  handler: async (ctx, args) => {
    const plan = await ctx.runQuery(internal.stripe.UNAUTH_getDefaultPlan);
    if (!plan) {
      throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
    }

    const yearlyPrice = plan.prices.year[args.currency];
    
    // Check if this is a fallback plan (price ID starts with "fallback_")
    const isFallbackPlan = yearlyPrice?.stripeId?.startsWith("fallback_") ?? false;

    if (isFallbackPlan) {
      // For fallback plans, create subscription in database only (no Stripe subscription)
      console.log("Creating fallback subscription (database only, no Stripe subscription)");
      const now = Math.floor(Date.now() / 1000);
      const oneYearFromNow = now + 365 * 24 * 60 * 60; // 1 year from now
      
      await ctx.runMutation(internal.stripe.PREAUTH_createSubscription, {
        userId: args.userId,
        planId: plan._id,
        currency: args.currency,
        priceStripeId: yearlyPrice.stripeId,
        stripeSubscriptionId: `fallback_sub_${args.userId}_${Date.now()}`,
        status: "active",
        interval: "year",
        currentPeriodStart: now,
        currentPeriodEnd: oneYearFromNow,
        cancelAtPeriodEnd: false,
      });
    } else {
      // For real Stripe plans, create subscription in Stripe
      if (!yearlyPrice?.stripeId) {
        throw new Error("Price not found for plan");
      }

      const stripeSubscription = await stripe.subscriptions.create({
        customer: args.customerId,
        items: [{ price: yearlyPrice.stripeId }],
      });
      if (!stripeSubscription) {
        throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
      }
      await ctx.runMutation(internal.stripe.PREAUTH_createSubscription, {
        userId: args.userId,
        planId: plan._id,
        currency: args.currency,
        priceStripeId: stripeSubscription.items.data[0].price.id,
        stripeSubscriptionId: stripeSubscription.id,
        status: stripeSubscription.status,
        interval: "year",
        currentPeriodStart: stripeSubscription.current_period_start,
        currentPeriodEnd: stripeSubscription.current_period_end,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      });
    }

    await ctx.runMutation(internal.stripe.PREAUTH_updateCustomerId, {
      userId: args.userId,
      customerId: args.customerId,
    });
  },
});

export const getCurrentUserSubscription = internalQuery({
  args: {
    planId: v.id("plans"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
    }
    const [currentSubscription, newPlan] = await Promise.all([
      ctx.db
        .query("subscriptions")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .unique(),
      ctx.db.get(args.planId),
    ]);
    
    // If no subscription exists, try to get the FREE plan as default
    if (!currentSubscription) {
      const freePlan = await ctx.db
        .query("plans")
        .withIndex("key", (q) => q.eq("key", PLANS.FREE))
        .unique();
      
      if (!freePlan) {
        throw new Error("Free plan not found. Please initialize plans first.");
      }
      
      return {
        currentSubscription: {
          planId: freePlan._id,
          plan: freePlan,
        },
        newPlan,
      };
    }
    
    const currentPlan = await ctx.db.get(currentSubscription.planId);
    if (!currentPlan) {
      throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
    }
    
    return {
      currentSubscription: {
        ...currentSubscription,
        plan: currentPlan,
      },
      newPlan,
    };
  },
});

/**
 * Creates a Stripe checkout session for a user.
 */
export const createSubscriptionCheckout = action({
  args: {
    userId: v.id("users"),
    planId: v.id("plans"),
    planInterval: intervalValidator,
    currency: currencyValidator,
  },
  handler: async (ctx, args): Promise<string | undefined> => {
    let user = await ctx.runQuery(api.app.getCurrentUser);
    if (!user) {
      throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
    }

    // If user doesn't have customerId, create it first
    if (!user.customerId) {
      console.log("User doesn't have customerId, creating Stripe customer...");
      
      // Get user details for creating customer
      const userDetails = await ctx.runQuery(internal.stripe.PREAUTH_getUserById, {
        userId: user._id,
      });
      
      if (!userDetails) {
        throw new Error("User not found");
      }
      
      // Validate Stripe key before creating customer
      if (!STRIPE_SECRET_KEY) {
        throw new Error("Stripe API key is not configured. Please set STRIPE_SECRET_KEY environment variable.");
      }

      // Create Stripe customer directly
      let customer;
      try {
        customer = await stripe.customers.create({
          email: userDetails.email,
          name: userDetails.username,
        });
      } catch (error) {
        console.error("Error creating Stripe customer:", error);
        if (error instanceof Stripe.errors.StripeError) {
          throw new Error(`Failed to create Stripe customer: ${error.message}`);
        }
        throw new Error("Failed to create Stripe customer. Please try again.");
      }
      
      if (!customer) {
        throw new Error("Failed to create Stripe customer");
      }
      
      // Update user with customerId
      await ctx.runMutation(internal.stripe.PREAUTH_updateCustomerId, {
        userId: user._id,
        customerId: customer.id,
      });
      
      // Create free subscription
      await ctx.runAction(internal.stripe.PREAUTH_createFreeStripeSubscription, {
        userId: user._id,
        customerId: customer.id,
        currency: args.currency,
      });
      
      // Refresh user data
      user = await ctx.runQuery(api.app.getCurrentUser);
      if (!user || !user.customerId) {
        throw new Error("Failed to create Stripe customer. Please try again.");
      }
    }

    const { currentSubscription, newPlan } = await ctx.runQuery(
      internal.stripe.getCurrentUserSubscription,
      { planId: args.planId },
    );
    if (!currentSubscription?.plan) {
      throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
    }
    // Only allow checkout if user is on Free plan
    if (currentSubscription.plan.key !== PLANS.FREE) {
      console.log("User is not on Free plan, cannot create checkout");
      return;
    }

    const price = newPlan?.prices[args.planInterval][args.currency];
    
    if (!price || !price.stripeId) {
      console.error("Price not found for plan:", {
        planId: args.planId,
        interval: args.planInterval,
        currency: args.currency,
      });
      throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
    }

    // Check if this is a fallback plan (price ID starts with "fallback_")
    const isFallbackPlan = price.stripeId.startsWith("fallback_");
    
    if (isFallbackPlan) {
      throw new Error("This plan is not configured with Stripe. Please run the init function to set up Stripe integration, or contact support.");
    }

    try {
      // Validate Stripe key
      if (!STRIPE_SECRET_KEY) {
        throw new Error("Stripe API key is not configured. Please set STRIPE_SECRET_KEY environment variable.");
      }

      const checkout = await stripe.checkout.sessions.create({
        customer: user.customerId,
        line_items: [{ price: price.stripeId, quantity: 1 }],
        mode: "subscription",
        payment_method_types: ["card"],
        success_url: `${SITE_URL || "http://localhost:5173"}/dashboard/settings/billing?success=true`,
        cancel_url: `${SITE_URL || "http://localhost:5173"}/dashboard/settings/billing?canceled=true`,
      });
      
      if (!checkout || !checkout.url) {
        throw new Error("Failed to create checkout session. Please try again.");
      }
      
      return checkout.url;
    } catch (error) {
      console.error("Stripe API error:", error);
      if (error instanceof Stripe.errors.StripeError) {
        throw new Error(`Stripe error: ${error.message}`);
      }
      if (error instanceof Error) {
        throw new Error(`Failed to create checkout: ${error.message}`);
      }
      throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
    }
  },
});

/**
 * Creates a Stripe customer portal for a user.
 */
export const createCustomerPortal = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return;
    }
    const user = await ctx.runQuery(api.app.getCurrentUser);
    if (!user || !user.customerId) {
      throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
    }

    const customerPortal = await stripe.billingPortal.sessions.create({
      customer: user.customerId,
      return_url: `${SITE_URL}/dashboard/settings/billing`,
    });
    if (!customerPortal) {
      throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
    }
    return customerPortal.url;
  },
});

export const cancelCurrentUserSubscriptions = internalAction({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.runQuery(api.app.getCurrentUser);
    if (!user) {
      throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
    }
    const subscriptions = (
      await stripe.subscriptions.list({ customer: user.customerId })
    ).data.map((sub) => sub.items);

    await asyncMap(subscriptions, async (subscription) => {
      await stripe.subscriptions.cancel(subscription.data[0].subscription);
    });
  },
});
