"use client";

import { useEffect, useState } from "react";
import { CreditCard, Check, Zap, Crown, TrendingUp, Shield, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PlanInfo {
  tier: string;
  name: string;
  monthlyPrice: number;
  maxProducts: number;
  maxOrdersMonth: number;
  maxStores: number;
  maxAiRequests: number;
  features: string[];
}

interface UsageInfo {
  products: number;
  orders: number;
  aiRequests: number;
}

interface BillingData {
  currentPlan: PlanInfo | null;
  usage: UsageInfo | null;
  plans: PlanInfo[];
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-emerald-500";

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="font-medium">{used.toLocaleString()} / {limit.toLocaleString()}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/billing")
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((json) => {
        if (json.ok) setData(json.data);
      })
      .catch(() => {
        // Billing API not yet implemented - use fallback data
      })
      .finally(() => setLoading(false));
  }, []);

  // Fallback plans if API doesn't return them
  const fallbackPlans: PlanInfo[] = [
    { tier: "FREE", name: "Free", monthlyPrice: 0, maxProducts: 25, maxOrdersMonth: 10, maxStores: 1, maxAiRequests: 5, features: ["Basic product import", "Manual order fulfillment"] },
    { tier: "STARTER", name: "Starter", monthlyPrice: 29, maxProducts: 200, maxOrdersMonth: 100, maxStores: 2, maxAiRequests: 50, features: ["AliExpress import", "Stock/price sync", "Basic AI research"] },
    { tier: "PRO", name: "Pro", monthlyPrice: 79, maxProducts: 1000, maxOrdersMonth: 500, maxStores: 5, maxAiRequests: 200, features: ["Everything in Starter", "Fast automations", "Advanced AI", "Priority support"] },
    { tier: "SCALE", name: "Scale", monthlyPrice: 199, maxProducts: 10000, maxOrdersMonth: 5000, maxStores: 20, maxAiRequests: 1000, features: ["Everything in Pro", "Unlimited stores", "API access", "Dedicated support"] },
  ];

  const currentPlan = data?.currentPlan ?? fallbackPlans[0];
  const usage = data?.usage ?? { products: 0, orders: 0, aiRequests: 0 };
  const plans = data?.plans?.length ? data.plans : fallbackPlans;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Billing</h1>
        <div className="h-40 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-64 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing & Plans</h1>
          <p className="text-sm text-zinc-500">Manage your subscription and track usage</p>
        </div>
      </div>

      {/* Current Plan — Hero card */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <CardContent className="p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">Current Plan</p>
              <h2 className="mt-1 text-3xl font-extrabold">{currentPlan.name}</h2>
              <p className="mt-1 text-sm text-white/80">
                {currentPlan.monthlyPrice === 0 ? "Free forever" : `$${currentPlan.monthlyPrice}/month`}
              </p>
            </div>
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Crown className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {[
              { label: "Products", value: `${currentPlan.maxProducts.toLocaleString()} max` },
              { label: "Orders", value: `${currentPlan.maxOrdersMonth.toLocaleString()}/mo` },
              { label: "Stores", value: `${currentPlan.maxStores} stores` },
              { label: "AI Requests", value: `${currentPlan.maxAiRequests}/mo` },
            ].map((item) => (
              <div key={item.label} className="text-sm">
                <span className="text-white/60">{item.label}: </span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {currentPlan.features.map((f, i) => (
              <div key={i} className="flex items-center gap-1 text-xs text-white/80">
                <Check className="h-3 w-3 text-white" />
                {f}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageBar label="Products" used={usage.products} limit={currentPlan.maxProducts} />
          <UsageBar label="Orders (this month)" used={usage.orders} limit={currentPlan.maxOrdersMonth} />
          <UsageBar label="AI Requests (this month)" used={usage.aiRequests} limit={currentPlan.maxAiRequests} />
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compare Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const isCurrent = plan.tier === currentPlan.tier;
              return (
                <div
                  key={plan.tier}
                  className={`relative rounded-xl border-2 p-5 transition-all ${
                    isCurrent
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm"
                      : plan.tier === "PRO"
                      ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/10 shadow-md"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  {plan.tier === "PRO" && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-[10px] font-bold text-white">
                      Most Popular
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-[10px] font-bold text-white">
                      Current Plan
                    </div>
                  )}
                  <div className="mb-3">
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <p className="text-2xl font-bold">
                      {plan.monthlyPrice === 0 ? "Free" : `$${plan.monthlyPrice}`}
                      {plan.monthlyPrice > 0 && <span className="text-sm font-normal text-zinc-500">/mo</span>}
                    </p>
                  </div>
                  <ul className="space-y-2 mb-4 text-sm">
                    <li className="text-zinc-600 dark:text-zinc-400">{plan.maxProducts.toLocaleString()} products</li>
                    <li className="text-zinc-600 dark:text-zinc-400">{plan.maxOrdersMonth.toLocaleString()} orders/mo</li>
                    <li className="text-zinc-600 dark:text-zinc-400">{plan.maxStores} stores</li>
                    <li className="text-zinc-600 dark:text-zinc-400">{plan.maxAiRequests} AI requests</li>
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-1 text-zinc-600 dark:text-zinc-400">
                        <Check className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => alert("Stripe integration coming soon!")}
                    >
                      <Zap className="mr-1 h-3 w-3" />
                      {plan.monthlyPrice > currentPlan.monthlyPrice ? "Upgrade" : "Switch"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
