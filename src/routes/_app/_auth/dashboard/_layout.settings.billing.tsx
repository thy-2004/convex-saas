import { useState, useRef, useEffect } from "react";
import { Switch } from "@/ui/switch";
import { Button } from "@/ui/button";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { api } from "~/convex/_generated/api";
import { convexQuery, useConvexAction, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getLocaleCurrency } from "@/utils/misc";
import { CURRENCIES, PLANS } from "@cvx/schema";
import { Loader2, AlertCircle, CreditCard, Sparkles, Receipt, TrendingUp, Check, X, Calendar, DollarSign, FileText, Download, Bell, BarChart3, Zap, Star, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute(
  "/_app/_auth/dashboard/_layout/settings/billing",
)({
  component: BillingSettings,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      success: search.success === "true" ? "true" : undefined,
      canceled: search.canceled === "true" ? "true" : undefined,
    };
  },
  beforeLoad: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.app.getActivePlans, {}),
    );
    return {
      title: "Billing",
      headerTitle: "Billing",
      headerDescription: "Manage billing and your subscription plan.",
    };
  },
});

export default function BillingSettings() {
  const search = useSearch({ from: "/_app/_auth/dashboard/_layout/settings/billing" });
  const { data: user } = useQuery(convexQuery(api.app.getCurrentUser, {}));
  const { data: plans } = useQuery(convexQuery(api.app.getActivePlans, {}));
  
  // Show success message if redirected from successful payment
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  useEffect(() => {
    if (search.success === "true") {
      setShowSuccessMessage(true);
      // Remove success param from URL
      window.history.replaceState({}, "", window.location.pathname);
      // Hide message after 5 seconds
      const timer = setTimeout(() => setShowSuccessMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [search.success]);

  const [selectedPlanId, setSelectedPlanId] = useState(
    user?.subscription?.planId,
  );

  const [selectedPlanInterval, setSelectedPlanInterval] = useState<
    "month" | "year"
  >(
    user?.subscription?.planKey !== PLANS.FREE
      ? user?.subscription?.interval || "month"
      : "month",
  );
  const [showUpgradePlans, setShowUpgradePlans] = useState(false);
  const plansSectionRef = useRef<HTMLDivElement>(null);

  const { mutateAsync: createSubscriptionCheckout, isPending: isCreatingCheckout } = useMutation({
    mutationFn: useConvexAction(api.stripe.createSubscriptionCheckout),
  });
  const { mutateAsync: createCustomerPortal } = useMutation({
    mutationFn: useConvexAction(api.stripe.createCustomerPortal),
  });
  const { mutateAsync: createFallbackPlans, isPending: isCreatingPlans } = useMutation({
    mutationFn: useConvexMutation(api.app.createFallbackPlans),
    onSuccess: () => {
      // Refetch plans after creation
      window.location.reload();
    },
  });

  const currency = getLocaleCurrency();

  // Calculate savings for yearly plan
  const calculateYearlySavings = () => {
    if (!plans) return null;
    const monthlyPrice = plans.pro.prices.month[currency].amount;
    const yearlyPrice = plans.pro.prices.year[currency].amount;
    const monthlyYearly = monthlyPrice * 12;
    const savings = monthlyYearly - yearlyPrice;
    const savingsPercent = Math.round((savings / monthlyYearly) * 100);
    return { savings, savingsPercent };
  };

  const yearlySavings = calculateYearlySavings();

  // Plan features
  const planFeatures = {
    free: [
      "1 Project",
      "1 GB Storage",
      "1,000 API Requests/month",
      "Community Support",
      "Basic Analytics",
    ],
    pro: [
      "Unlimited Projects",
      "100 GB Storage",
      "Unlimited API Requests",
      "Priority Support",
      "Advanced Analytics",
      "Custom Integrations",
      "Team Collaboration",
      "Advanced Security",
    ],
  };

  const handleCreateSubscriptionCheckout = async () => {
    if (!user || !selectedPlanId || !plans) {
      alert("Please select a plan to continue.");
      return;
    }
    // If user is already on the selected plan, don't do anything
    if (user.subscription?.planId === selectedPlanId) {
      alert("You are already on this plan.");
      return;
    }
    
    try {
      console.log("Creating checkout session...", {
        userId: user._id,
        planId: selectedPlanId,
        planInterval: selectedPlanInterval,
        currency,
        hasCustomerId: !!user.customerId,
      });
      
      // If user doesn't have customerId, the backend will create it automatically
      // But we might need to wait a bit and retry
      let checkoutUrl: string | null | undefined;
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries && !checkoutUrl) {
        try {
          checkoutUrl = await createSubscriptionCheckout({
      userId: user._id,
      planId: selectedPlanId,
      planInterval: selectedPlanInterval,
      currency,
    });
          
          if (checkoutUrl) {
            break;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          
          // If customer creation is in progress, wait and retry
          if (errorMessage.includes("customer") && retries < maxRetries - 1) {
            console.log(`Retrying checkout creation (attempt ${retries + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            retries++;
            continue;
          }
          
          throw error;
        }
        
        // If no checkoutUrl but no error, wait and retry
        if (!checkoutUrl && retries < maxRetries - 1) {
          console.log(`Retrying checkout creation (attempt ${retries + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries++;
        } else {
          break;
        }
      }
      
      console.log("Checkout URL received:", checkoutUrl);
      
    if (!checkoutUrl) {
        alert("Failed to create checkout session. Please make sure you are on the Free plan and try again, or contact support.");
        console.error("Failed to create checkout URL - checkoutUrl is null or undefined");
      return;
    }
      
      // Redirect to Stripe checkout page where user can enter card details
      console.log("Redirecting to Stripe checkout:", checkoutUrl);
    window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Error creating checkout:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`An error occurred while setting up payment: ${errorMessage}. Please try again or contact support.`);
    }
  };
  const handleCreateCustomerPortal = async () => {
    if (!user?.customerId) {
      return;
    }
    const customerPortalUrl = await createCustomerPortal({
      userId: user._id,
    });
    if (!customerPortalUrl) {
      return;
    }
    window.location.href = customerPortalUrl;
  };

  const handleShowUpgradePlans = () => {
    setShowUpgradePlans(true);
    // If user is on Free plan, automatically select Pro plan
    if (user?.subscription?.planId === plans?.free._id && plans?.pro._id) {
      setSelectedPlanId(plans.pro._id);
    }
    // Scroll to plans section after a short delay
    setTimeout(() => {
      plansSectionRef.current?.scrollIntoView({ 
        behavior: "smooth", 
        block: "start" 
      });
    }, 100);
  };

  // Reset showUpgradePlans when user changes
  useEffect(() => {
    setShowUpgradePlans(false);
  }, [user?.subscription?.planId]);

  // Loading state
  if (!user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-primary/60">Loading billing information...</p>
        </div>
      </div>
    );
  }

  // Success message banner
  const SuccessBanner = showSuccessMessage ? (
    <div className="mb-6 flex w-full items-center gap-3 rounded-lg border border-green-500/30 bg-gradient-to-r from-green-500/10 to-green-500/5 p-4 backdrop-blur-sm animate-fade-in-down">
      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-sm font-semibold text-green-500">Payment Successful!</p>
        <p className="text-xs text-green-500/70">Your subscription has been updated successfully.</p>
      </div>
      <button
        onClick={() => setShowSuccessMessage(false)}
        className="text-green-500/70 hover:text-green-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  ) : null;

  // Error state - plans not found
  if (!plans) {
    return (
      <div className="flex h-full w-full flex-col gap-6">
        <div className="flex w-full flex-col gap-4 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-primary">
              Plans Not Found
            </h2>
          </div>
          <p className="text-sm text-primary/70 leading-relaxed">
            The subscription plans have not been initialized. You can create fallback plans now or run the init function to set up plans with Stripe integration.
          </p>
          <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-card/50 p-4">
            <p className="text-xs font-medium text-primary/80">
              Quick Fix: Create Fallback Plans
            </p>
            <p className="text-xs text-primary/60 leading-relaxed">
              This will create basic plans without Stripe integration. For full Stripe functionality, run the init function from the Convex dashboard.
            </p>
            <Button
              onClick={() => createFallbackPlans({})}
              disabled={isCreatingPlans}
              className="w-fit font-semibold shadow-md hover:shadow-lg transition-all duration-300"
            >
              {isCreatingPlans ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Plans...
                </>
              ) : (
                "Create Fallback Plans"
              )}
            </Button>
          </div>
          <div className="mt-2 rounded-lg border border-border/50 bg-muted/30 p-3">
            <p className="text-xs font-medium text-primary/70 mb-1">
              For Production Setup:
            </p>
            {/* <p className="text-xs text-primary/60 leading-relaxed">
              Run the init function from your Convex dashboard or terminal: <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 text-[10px]">npx convex dev --run init</code>
            </p> */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-6">
      {SuccessBanner}
      <div className="flex w-full flex-col gap-3 rounded-lg border border-border/50 bg-gradient-to-br from-primary/5 via-transparent to-transparent p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-primary">
            Demo App - Test Mode
        </h2>
        </div>
        <p className="text-sm font-normal text-primary/70 leading-relaxed">
          Convex SaaS is a demo app that uses Stripe test environment. You can
          find a list of test card numbers on the{" "}
          <a
            href="https://stripe.com/docs/testing#cards"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline hover:text-primary/80 transition-colors"
          >
            Stripe docs
          </a>
          .
        </p>
      </div>

      {/* Plans */}
      <div ref={plansSectionRef} className="flex w-full flex-col items-start rounded-lg border border-border/50 bg-card shadow-lg overflow-hidden">
        <div className="flex flex-col gap-3 p-6 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-primary">Subscription Plan</h2>
          </div>
          <p className="flex items-center gap-2 text-sm font-normal text-primary/70">
            You are currently on the{" "}
            <span className="flex h-6 items-center rounded-md bg-gradient-to-r from-primary/20 to-primary/10 px-2.5 text-sm font-semibold text-primary ring-1 ring-primary/20">
              {user.subscription
                ? user.subscription.planKey.charAt(0).toUpperCase() +
                  user.subscription.planKey.slice(1)
                : "Free"}
            </span>
            plan.
          </p>
        </div>

        {(user.subscription?.planId === plans.free._id || showUpgradePlans) && (
          <div className="flex w-full flex-col items-center justify-evenly gap-4 p-6">
            {Object.values(plans).map((plan) => {
              const isCurrentPlan = user.subscription?.planId === plan._id;
              const isSelected = selectedPlanId === plan._id;
              const isPro = plan._id !== plans.free._id;
              
              return (
              <div
                key={plan._id}
                tabIndex={0}
                role="button"
                  className={`relative flex w-full select-none flex-col rounded-lg border-2 transition-all duration-300 ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                      : isCurrentPlan
                      ? "border-primary/60 bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-primary/5"
                }`}
                onClick={() => setSelectedPlanId(plan._id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSelectedPlanId(plan._id);
                }}
              >
                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-4 z-10">
                      <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-green-500/20 to-green-500/10 px-3 py-1 text-xs font-semibold text-green-500 ring-2 ring-green-500/30 backdrop-blur-sm">
                        <Check className="h-3 w-3" />
                        Current Plan
                      </span>
                    </div>
                  )}

                  {/* Popular Badge for Pro */}
                  {isPro && !isCurrentPlan && (
                    <div className="absolute -top-3 right-4 z-10">
                      <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1 text-xs font-semibold text-primary ring-2 ring-primary/30 backdrop-blur-sm">
                        <Star className="h-3 w-3 fill-current" />
                        Popular
                      </span>
                    </div>
                  )}

                  <div className="flex w-full flex-col items-start p-5 pt-6">
                    <div className="flex w-full items-start justify-between gap-3">
                      <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-primary">
                      {plan.name}
                    </span>
                        </div>
                        <p className="text-start text-sm font-normal text-primary/70 leading-relaxed">
                          {plan.description}
                        </p>
                      </div>
                      {isPro && (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold text-primary">
                              {currency === CURRENCIES.USD ? "$" : "€"}
                        {selectedPlanInterval === "month"
                          ? plan.prices.month[currency].amount / 100
                                : plan.prices.year[currency].amount / 100}
                            </span>
                          </div>
                          <span className="text-xs text-primary/50">
                        / {selectedPlanInterval === "month" ? "month" : "year"}
                      </span>
                          {selectedPlanInterval === "year" && yearlySavings && (
                            <span className="mt-1 flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-500">
                              Save {yearlySavings.savingsPercent}%
                            </span>
                          )}
                        </div>
                    )}
                  </div>

                    {/* Features List */}
                    <div className="mt-4 w-full border-t border-border/30 pt-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary/50">
                        Features
                      </p>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {(plan.key === PLANS.FREE ? planFeatures.free : planFeatures.pro).map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Check className={`h-4 w-4 flex-shrink-0 ${isPro ? "text-green-500" : "text-primary/60"}`} />
                            <span className="text-sm text-primary/70">{feature}</span>
                          </div>
                        ))}
                      </div>
                </div>

                {/* Billing Switch */}
                    {isPro && (
                      <div className="mt-4 flex w-full items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-3">
                        <div className="flex flex-col gap-1">
                    <label
                            htmlFor={`interval-switch-${plan._id}`}
                            className="text-sm font-semibold text-primary/80"
                    >
                            {selectedPlanInterval === "month" ? "Monthly" : "Yearly"} billing
                    </label>
                          {selectedPlanInterval === "year" && yearlySavings && (
                            <p className="text-xs text-green-500">
                              Save {currency === CURRENCIES.USD ? "$" : "€"}
                              {yearlySavings.savings / 100} per year
                            </p>
                          )}
                        </div>
                    <Switch
                          id={`interval-switch-${plan._id}`}
                      checked={selectedPlanInterval === "year"}
                      onCheckedChange={() =>
                        setSelectedPlanInterval((prev) =>
                          prev === "month" ? "year" : "month",
                        )
                      }
                    />
                  </div>
                )}
              </div>
                </div>
              );
            })}
          </div>
        )}

        {user.subscription && user.subscription.planId !== plans.free._id && !showUpgradePlans && (
          <div className="flex w-full flex-col items-center justify-evenly gap-3 p-6">
            <div className="flex w-full items-center overflow-hidden rounded-lg border-2 border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-md">
              <div className="flex w-full flex-col items-start p-5">
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-primary">
                    {user.subscription.planKey.charAt(0).toUpperCase() +
                      user.subscription.planKey.slice(1)}
                  </span>
                      <span className="flex items-center rounded-md bg-gradient-to-r from-primary/20 to-primary/10 px-2 py-0.5 text-xs font-semibold text-primary ring-1 ring-primary/20">
                        Active
                      </span>
                    </div>
                    <p className="text-start text-sm font-normal text-primary/70">
                      {plans.pro.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {user.subscription.cancelAtPeriodEnd === true ? (
                      <span className="flex items-center gap-1.5 rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-500 ring-1 ring-red-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                        Expires
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 rounded-md bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-500 ring-1 ring-green-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                        Renews
                      </span>
                    )}
                    <p className="text-xs font-medium text-primary/60">
                    {new Date(
                      user.subscription.currentPeriodEnd * 1000,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex min-h-16 w-full items-center justify-between rounded-lg rounded-t-none border-t border-border bg-gradient-to-r from-secondary/50 to-secondary/30 px-6 py-4 backdrop-blur-sm">
          <p className="text-sm font-medium text-primary/70">
            {showUpgradePlans 
              ? "Select a plan to upgrade or change your subscription."
              : "You will not be charged for testing the subscription upgrade."}
          </p>
          {(user.subscription?.planId === plans.free._id || showUpgradePlans) && (
            <Button
              type="button"
              size="default"
              onClick={handleCreateSubscriptionCheckout}
              disabled={
                isCreatingCheckout ||
                !selectedPlanId || 
                selectedPlanId === user.subscription?.planId ||
                (user.subscription?.planId === plans.free._id && selectedPlanId === plans.free._id)
              }
              className="font-semibold shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingCheckout ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : user.subscription?.planId === plans.free._id ? (
                selectedPlanId === plans.pro._id
                  ? "Upgrade to PRO"
                  : "Select a Plan"
              ) : selectedPlanId === plans.free._id ? (
                "Downgrade to Free"
              ) : selectedPlanId === user.subscription?.planId ? (
                "Current Plan"
              ) : selectedPlanId === plans.pro._id ? (
                "Upgrade to PRO"
              ) : (
                "Change Plan"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="flex w-full flex-col items-start rounded-lg border border-border/50 bg-card shadow-lg overflow-hidden">
        <div className="flex flex-col gap-3 p-6 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-primary">
              Plan Comparison
            </h2>
          </div>
          <p className="text-sm font-normal text-primary/70">
            Compare features across different plans to find the best fit for you.
          </p>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="p-4 text-left text-sm font-semibold text-primary/80">Features</th>
                <th className="p-4 text-center text-sm font-semibold text-primary/80">Free</th>
                <th className="p-4 text-center text-sm font-semibold text-primary/80">Pro</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/30">
                <td className="p-4 text-sm text-primary/70">Projects</td>
                <td className="p-4 text-center text-sm text-primary/70">1</td>
                <td className="p-4 text-center text-sm text-primary/70 font-semibold">Unlimited</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="p-4 text-sm text-primary/70">Storage</td>
                <td className="p-4 text-center text-sm text-primary/70">1 GB</td>
                <td className="p-4 text-center text-sm text-primary/70 font-semibold">100 GB</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="p-4 text-sm text-primary/70">API Requests</td>
                <td className="p-4 text-center text-sm text-primary/70">1,000/month</td>
                <td className="p-4 text-center text-sm text-primary/70 font-semibold">Unlimited</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="p-4 text-sm text-primary/70">Priority Support</td>
                <td className="p-4 text-center">
                  <X className="h-4 w-4 text-destructive mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <Check className="h-4 w-4 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="p-4 text-sm text-primary/70">Advanced Analytics</td>
                <td className="p-4 text-center">
                  <X className="h-4 w-4 text-destructive mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <Check className="h-4 w-4 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="p-4 text-sm text-primary/70">Custom Integrations</td>
                <td className="p-4 text-center">
                  <X className="h-4 w-4 text-destructive mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <Check className="h-4 w-4 text-green-500 mx-auto" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Billing Summary */}
      {user.subscription && user.subscription.planId !== plans.free._id && (
        <div className="flex w-full flex-col items-start rounded-lg border border-border/50 bg-card shadow-lg overflow-hidden">
          <div className="flex flex-col gap-3 p-6 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-primary">
                Billing Summary
              </h2>
            </div>
            <p className="text-sm font-normal text-primary/70">
              Overview of your current subscription and billing details.
            </p>
          </div>

          <div className="flex w-full flex-col gap-4 p-6">
            <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-primary/60">Current Plan</p>
                <p className="text-lg font-semibold text-primary">
                  {user.subscription.planKey.charAt(0).toUpperCase() + user.subscription.planKey.slice(1)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className="text-sm font-medium text-primary/60">Billing Cycle</p>
                <p className="text-lg font-semibold text-primary capitalize">
                  {user.subscription.interval}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-primary/60">Next Billing Date</p>
                <p className="text-base font-semibold text-primary">
                  {new Date(user.subscription.currentPeriodEnd * 1000).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary/60" />
                <span className="text-sm text-primary/60">
                  {Math.ceil((user.subscription.currentPeriodEnd * 1000 - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-primary/60">Status</p>
                <div className="flex items-center gap-2">
                  {user.subscription.cancelAtPeriodEnd ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                      <p className="text-base font-semibold text-red-500">Cancelling</p>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      <p className="text-base font-semibold text-green-500">Active</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className="text-sm font-medium text-primary/60">Currency</p>
                <p className="text-base font-semibold text-primary uppercase">
                  {user.subscription.currency}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Subscription */}
      <div className="flex w-full flex-col items-start rounded-lg border border-border/50 bg-card shadow-lg overflow-hidden">
        <div className="flex flex-col gap-3 p-6 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-primary">
            Manage Subscription
          </h2>
          </div>
          <p className="flex items-start gap-1 text-sm font-normal text-primary/70">
            Update your payment method, billing address, view invoices, and more.
          </p>
        </div>

        <div className="flex min-h-16 w-full items-center justify-between rounded-lg rounded-t-none border-t border-border bg-gradient-to-r from-secondary/50 to-secondary/30 px-6 py-4 backdrop-blur-sm">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-primary/70">
              Access Stripe Customer Portal
            </p>
            <p className="text-xs text-primary/60">
              You will be redirected to manage all billing settings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              size="default" 
              onClick={handleShowUpgradePlans}
              className="font-semibold shadow-md hover:shadow-lg transition-all duration-300"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Change Plan
            </Button>
            {user?.customerId && (
              <Button 
                type="submit" 
                size="default" 
                variant="outline"
                onClick={handleCreateCustomerPortal}
                className="font-semibold shadow-md hover:shadow-lg transition-all duration-300"
              >
                <Receipt className="mr-2 h-4 w-4" />
                Stripe Portal
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      {user.subscription && user.subscription.planId !== plans.free._id && (
        <div className="flex w-full flex-col items-start rounded-lg border border-border/50 bg-card shadow-lg overflow-hidden">
          <div className="flex flex-col gap-3 p-6 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-primary">
                Usage Statistics
              </h2>
            </div>
            <p className="text-sm font-normal text-primary/70">
              Track your usage and consumption for the current billing period.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 p-6 md:grid-cols-3">
            <div className="flex flex-col gap-2 rounded-lg border border-border/30 bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary/60">API Requests</p>
                <Zap className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-primary">Unlimited</p>
              <p className="text-xs text-primary/50">Current period</p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border border-border/30 bg-gradient-to-br from-green-500/10 to-green-500/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary/60">Storage Used</p>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-primary">2.4 GB</p>
              <p className="text-xs text-primary/50">of 100 GB (2.4%)</p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border border-border/30 bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary/60">Projects</p>
                <Sparkles className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-primary">Unlimited</p>
              <p className="text-xs text-primary/50">Active projects</p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice History */}
      {user.subscription && user.subscription.planId !== plans.free._id && (
        <div className="flex w-full flex-col items-start rounded-lg border border-border/50 bg-card shadow-lg overflow-hidden">
          <div className="flex flex-col gap-3 p-6 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-primary">
                  Invoice History
                </h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateCustomerPortal}
                className="text-xs"
              >
                <Download className="mr-2 h-3 w-3" />
                View All
              </Button>
            </div>
            <p className="text-sm font-normal text-primary/70">
              View and download your past invoices and receipts.
            </p>
          </div>

          <div className="w-full p-6">
            <div className="flex flex-col gap-3">
              {/* Recent Invoice Item */}
              <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-4 transition-all duration-300 hover:border-primary/40 hover:bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-primary">
                      {user.subscription.planKey.charAt(0).toUpperCase() + user.subscription.planKey.slice(1)} Plan
                    </p>
                    <p className="text-xs text-primary/60">
                      {new Date(user.subscription.currentPeriodStart * 1000).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-sm font-semibold text-primary">
                      {currency === CURRENCIES.USD ? "$" : "€"}
                      {user.subscription.interval === "month"
                        ? plans.pro.prices.month[currency].amount / 100
                        : plans.pro.prices.year[currency].amount / 100}
                    </p>
                    <span className="flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                      <Check className="h-3 w-3" />
                      Paid
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCreateCustomerPortal}
                    className="text-xs"
                  >
                    View
                  </Button>
                </div>
              </div>

              {/* Placeholder for more invoices */}
              <div className="flex items-center justify-center rounded-lg border border-dashed border-border/30 bg-muted/20 p-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <FileText className="h-8 w-8 text-primary/40" />
                  <p className="text-sm font-medium text-primary/60">
                    More invoices available in Stripe Portal
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateCustomerPortal}
                    className="mt-2 text-xs"
                  >
                    View All Invoices
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method */}
      {user.customerId && (
        <div className="flex w-full flex-col items-start rounded-lg border border-border/50 bg-card shadow-lg overflow-hidden">
          <div className="flex flex-col gap-3 p-6 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-primary">
                Payment Method
              </h2>
            </div>
            <p className="text-sm font-normal text-primary/70">
              Manage your payment methods and billing information.
            </p>
          </div>

          <div className="flex w-full flex-col gap-4 p-6">
            <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-primary">
                    Payment Method
                  </p>
                  <p className="text-xs text-primary/60">
                    Manage your payment methods in Stripe Customer Portal
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateCustomerPortal}
              >
                Update
              </Button>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-start gap-2">
                <Bell className="h-4 w-4 text-primary mt-0.5" />
                <p className="text-xs text-primary/70 leading-relaxed">
                  <span className="font-semibold">Note:</span> Payment methods are securely stored and managed by Stripe. 
                  You can add, update, or remove payment methods through the Customer Portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Alerts & Notifications */}
      <div className="flex w-full flex-col items-start rounded-lg border border-border/50 bg-card shadow-lg overflow-hidden">
        <div className="flex flex-col gap-3 p-6 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-primary">
              Billing Alerts
            </h2>
          </div>
          <p className="text-sm font-normal text-primary/70">
            Configure notifications for important billing events.
          </p>
        </div>

        <div className="flex w-full flex-col gap-4 p-6">
          <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Bell className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-primary">
                  Payment Reminders
                </p>
                <p className="text-xs text-primary/60">
                  Get notified before your subscription renews
                </p>
              </div>
            </div>
            <Switch defaultChecked={true} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-primary">
                  Payment Confirmations
                </p>
                <p className="text-xs text-primary/60">
                  Receive email when payments are processed
                </p>
              </div>
            </div>
            <Switch defaultChecked={true} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-primary">
                  Payment Failures
                </p>
                <p className="text-xs text-primary/60">
                  Alert when payment attempts fail
                </p>
              </div>
            </div>
            <Switch defaultChecked={true} />
          </div>
          {user.subscription && user.subscription.cancelAtPeriodEnd && (
            <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex flex-col gap-1 flex-1">
                <p className="text-sm font-semibold text-yellow-500">
                  Subscription Cancelling
                </p>
                <p className="text-xs text-primary/70">
                  Your subscription will expire on{" "}
                  {new Date(user.subscription.currentPeriodEnd * 1000).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  . You can reactivate it anytime before then.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex w-full flex-col items-start rounded-lg border border-border/50 bg-card shadow-lg overflow-hidden">
        <div className="flex flex-col gap-3 p-6 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-primary">
              Quick Actions
            </h2>
          </div>
          <p className="text-sm font-normal text-primary/70">
            Common billing tasks and helpful resources.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
          <a
            href="https://stripe.com/docs/testing#cards"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col gap-2 rounded-lg border border-border/30 bg-secondary/30 p-4 transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-primary">Test Cards</h3>
            </div>
            <p className="text-xs text-primary/60">
              View Stripe test card numbers for testing payments.
            </p>
          </a>
          <a
            href="https://dashboard.stripe.com/test/products"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col gap-2 rounded-lg border border-border/30 bg-secondary/30 p-4 transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-primary">Stripe Dashboard</h3>
            </div>
            <p className="text-xs text-primary/60">
              Access your Stripe dashboard to view products and subscriptions.
            </p>
          </a>
          <a
            href="https://stripe.com/docs/billing/subscriptions/overview"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col gap-2 rounded-lg border border-border/30 bg-secondary/30 p-4 transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-primary">Billing Docs</h3>
            </div>
            <p className="text-xs text-primary/60">
              Learn more about Stripe billing and subscriptions.
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
