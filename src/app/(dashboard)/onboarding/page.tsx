"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Package,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Globe,
  Rocket,
  Target,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const NICHES = [
  { id: "electronics", label: "Electronics & Gadgets", icon: "🔌", desc: "Phone accessories, smart home, wearables" },
  { id: "fashion", label: "Fashion & Accessories", icon: "👗", desc: "Clothing, jewelry, bags, sunglasses" },
  { id: "home", label: "Home & Garden", icon: "🏡", desc: "Decor, kitchen gadgets, organization" },
  { id: "beauty", label: "Beauty & Health", icon: "💄", desc: "Skincare, makeup, wellness products" },
  { id: "fitness", label: "Fitness & Sports", icon: "💪", desc: "Workout gear, yoga, outdoor equipment" },
  { id: "pets", label: "Pet Supplies", icon: "🐾", desc: "Toys, accessories, grooming, food" },
  { id: "baby", label: "Baby & Kids", icon: "🍼", desc: "Toys, clothing, nursery, strollers" },
  { id: "automotive", label: "Automotive", icon: "🚗", desc: "Car accessories, tools, electronics" },
  { id: "general", label: "General Store", icon: "🏪", desc: "Mixed niche, trending products" },
];

const STEPS = [
  { id: "welcome", title: "Welcome", icon: Sparkles },
  { id: "niche", title: "Choose Niche", icon: Target },
  { id: "store", title: "Connect Store", icon: Store },
  { id: "products", title: "Import Products", icon: Package },
  { id: "pricing", title: "Set Pricing", icon: DollarSign },
  { id: "done", title: "All Set!", icon: Rocket },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [niche, setNiche] = useState<string | null>(null);
  const [shopDomain, setShopDomain] = useState("");
  const [markup, setMarkup] = useState("2.5");
  const [connecting, setConnecting] = useState(false);
  const [storeConnected, setStoreConnected] = useState(false);

  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  async function connectStore() {
    if (!shopDomain.trim()) return;
    setConnecting(true);

    try {
      const domain = shopDomain.includes(".")
        ? shopDomain
        : `${shopDomain}.myshopify.com`;

      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: domain.split(".")[0],
          platform: "SHOPIFY",
          domain,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        setStoreConnected(true);
      }
    } catch {
      // Continue anyway
    } finally {
      setConnecting(false);
    }
  }

  function finish() {
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Setup Your Store</h1>
          <span className="text-xs text-zinc-400">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-1 text-[10px] font-medium ${
                i <= step
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-300 dark:text-zinc-600"
              }`}
            >
              {i < step ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <s.icon className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 0: Welcome */}
      {step === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Welcome to OptiCart!</h2>
            <p className="mt-3 max-w-md mx-auto text-zinc-500">
              Let&apos;s get your dropshipping business set up in just a few minutes.
              We&apos;ll help you connect your store, choose your niche, and import your first products.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
                <Store className="h-5 w-5 mx-auto text-blue-600" />
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Connect Store</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/20">
                <Package className="h-5 w-5 mx-auto text-emerald-600" />
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Import Products</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-950/20">
                <DollarSign className="h-5 w-5 mx-auto text-purple-600" />
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Start Selling</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Choose Niche */}
      {step === 1 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center mb-6">
              <Target className="h-8 w-8 mx-auto text-indigo-600" />
              <h2 className="mt-2 text-xl font-bold">Choose Your Niche</h2>
              <p className="text-sm text-zinc-500">
                Select the product category you want to focus on. You can always change this later.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {NICHES.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setNiche(n.id)}
                  className={`flex flex-col items-center rounded-xl border-2 p-4 text-center transition-all ${
                    niche === n.id
                      ? "border-indigo-500 bg-indigo-50/50 shadow-sm dark:bg-indigo-950/20"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                >
                  <span className="text-2xl">{n.icon}</span>
                  <p className="mt-1 text-sm font-semibold">{n.label}</p>
                  <p className="mt-0.5 text-[10px] text-zinc-400">{n.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Connect Store */}
      {step === 2 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center mb-6">
              <Store className="h-8 w-8 mx-auto text-indigo-600" />
              <h2 className="mt-2 text-xl font-bold">Connect Your Store</h2>
              <p className="text-sm text-zinc-500">
                Link your Shopify store to start pushing products. You can skip this and connect later.
              </p>
            </div>

            {!storeConnected ? (
              <div className="max-w-md mx-auto space-y-4">
                <div className="flex items-center gap-3 rounded-xl border-2 border-green-500 bg-green-50/50 p-4 dark:bg-green-950/20">
                  <span className="text-2xl">🛍️</span>
                  <div>
                    <p className="text-sm font-semibold">Shopify</p>
                    <p className="text-xs text-zinc-500">Connect with OAuth</p>
                  </div>
                  <Badge variant="success" className="ml-auto">Recommended</Badge>
                </div>

                <div>
                  <label className="text-sm font-medium">Store URL</label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      value={shopDomain}
                      onChange={(e) => setShopDomain(e.target.value)}
                      placeholder="mystore.myshopify.com"
                    />
                    <Button onClick={connectStore} disabled={connecting || !shopDomain.trim()}>
                      {connecting ? "Connecting..." : "Connect"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 opacity-50">
                  {["WooCommerce", "eBay", "TikTok Shop"].map((p) => (
                    <div
                      key={p}
                      className="flex flex-col items-center rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                    >
                      <span className="text-xs font-medium text-zinc-400">{p}</span>
                      <span className="text-[10px] text-zinc-300">Coming soon</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto text-center">
                <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50/50 p-6 dark:bg-emerald-950/20">
                  <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-600" />
                  <p className="mt-2 font-semibold text-emerald-700 dark:text-emerald-400">
                    Store Connected!
                  </p>
                  <p className="text-sm text-zinc-500">{shopDomain}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Import Products */}
      {step === 3 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center mb-6">
              <Package className="h-8 w-8 mx-auto text-indigo-600" />
              <h2 className="mt-2 text-xl font-bold">Import Your First Products</h2>
              <p className="text-sm text-zinc-500">
                Browse our catalog of {niche ? NICHES.find((n) => n.id === niche)?.label.toLowerCase() : "trending"} products.
                You can import more anytime from the Discover page.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { title: "Browse Catalog", desc: "Explore 500+ real AliExpress products", icon: Globe, href: "/products/discover" },
                { title: "AI Recommendations", desc: "Get AI-powered winning product suggestions", icon: Sparkles, href: "/ai/winning-products" },
                { title: "Search Products", desc: "Search by keyword, category, or niche", icon: ShoppingBag, href: "/products/discover" },
                { title: "Trending Now", desc: "See what's selling hot right now", icon: Zap, href: "/products/discover" },
              ].map((action) => (
                <button
                  key={action.title}
                  onClick={() => router.push(action.href)}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 text-left transition-all hover:border-indigo-300 hover:shadow-sm dark:border-zinc-700"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                    <action.icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{action.title}</p>
                    <p className="text-xs text-zinc-400">{action.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Set Pricing */}
      {step === 4 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center mb-6">
              <DollarSign className="h-8 w-8 mx-auto text-indigo-600" />
              <h2 className="mt-2 text-xl font-bold">Set Your Pricing Strategy</h2>
              <p className="text-sm text-zinc-500">
                Choose your default markup multiplier. This will be applied to all imported products.
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "2.0", label: "2x", desc: "100% markup", risk: "Conservative" },
                  { value: "2.5", label: "2.5x", desc: "150% markup", risk: "Recommended" },
                  { value: "3.0", label: "3x", desc: "200% markup", risk: "Aggressive" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMarkup(option.value)}
                    className={`rounded-xl border-2 p-4 text-center transition-all ${
                      markup === option.value
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                        : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <p className="text-2xl font-bold">{option.label}</p>
                    <p className="text-xs text-zinc-500">{option.desc}</p>
                    <Badge
                      variant={option.value === "2.5" ? "success" : "secondary"}
                      className="mt-2 text-[10px]"
                    >
                      {option.risk}
                    </Badge>
                  </button>
                ))}
              </div>

              <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                <p className="text-sm font-medium mb-2">Example with {markup}x markup:</p>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div>
                    <p className="text-zinc-400">Supplier Cost</p>
                    <p className="font-bold text-lg">$8.99</p>
                  </div>
                  <div>
                    <p className="text-zinc-400">Your Price</p>
                    <p className="font-bold text-lg text-blue-600">
                      ${(8.99 * parseFloat(markup)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400">Your Profit</p>
                    <p className="font-bold text-lg text-emerald-600">
                      ${(8.99 * parseFloat(markup) - 8.99).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Custom Multiplier</label>
                <Input
                  type="number"
                  step="0.1"
                  min="1.1"
                  max="10"
                  value={markup}
                  onChange={(e) => setMarkup(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Done */}
      {step === 5 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
              <Rocket className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold">You&apos;re All Set!</h2>
            <p className="mt-3 max-w-md mx-auto text-zinc-500">
              Your OptiCart account is ready to go. Start discovering winning products, import them to your store, and let automation handle the rest.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 max-w-sm mx-auto">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => router.push("/products/discover")}
              >
                <Globe className="h-4 w-4" />
                Browse Products
              </Button>
              <Button
                className="gap-2"
                onClick={() => router.push("/dashboard")}
              >
                <Sparkles className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <div className="flex gap-2">
            {step >= 2 && step < 5 && (
              <Button variant="ghost" onClick={() => setStep(step + 1)}>
                Skip
              </Button>
            )}
            <Button onClick={() => setStep(step + 1)} className="gap-1">
              {step === 0 ? "Get Started" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button onClick={finish} className="gap-1">
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
