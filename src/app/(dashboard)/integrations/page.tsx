"use client";

import { useState } from "react";
import {
  Plug,
  ExternalLink,
  CheckCircle2,
  Clock,
  Search,
  ArrowRight,
  Star,
  Globe,
  Package,
  Truck,
  BarChart3,
  Zap,
  Shield,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type IntegrationStatus = "connected" | "available" | "coming_soon" | "beta";

interface Integration {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: string;
  category: "supplier" | "marketplace" | "tool" | "analytics";
  status: IntegrationStatus;
  features: string[];
  pricing: string;
  popularity: number;
  gradient: string;
  url?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "aliexpress",
    name: "AliExpress",
    description: "Source millions of products directly from AliExpress suppliers",
    longDescription:
      "Connect directly to AliExpress through our RapidAPI integration. Access millions of products, compare suppliers, track prices, and import products in one click.",
    icon: "🛒",
    category: "supplier",
    status: "connected",
    features: [
      "Product search & discovery",
      "Price tracking & alerts",
      "Supplier reliability scores",
      "One-click product import",
      "Automatic variant mapping",
      "Bulk order processing",
    ],
    pricing: "Included in all plans",
    popularity: 98,
    gradient: "from-orange-500 to-red-500",
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Connect your Shopify store for seamless product management",
    longDescription:
      "Full Shopify OAuth integration. Push products directly to your store, sync inventory and orders in real-time, and manage everything from OptiCart.",
    icon: "🛍️",
    category: "marketplace",
    status: "available",
    features: [
      "OAuth secure connection",
      "Product push to store",
      "Inventory sync",
      "Order import & tracking",
      "Automatic fulfillment",
      "Multi-store support",
    ],
    pricing: "Included in all plans",
    popularity: 95,
    gradient: "from-green-500 to-emerald-600",
    url: "/stores",
  },
  {
    id: "cj-dropshipping",
    name: "CJ Dropshipping",
    description: "Global fulfillment with warehouses in US, EU, and Asia",
    longDescription:
      "CJ Dropshipping offers free product sourcing, quality inspection, and global warehousing. Faster shipping times with local warehouses and competitive pricing.",
    icon: "📦",
    category: "supplier",
    status: "coming_soon",
    features: [
      "Free product sourcing",
      "Global warehousing (US, EU, Asia)",
      "Quality inspection",
      "Custom packaging & branding",
      "Print-on-demand",
      "API integration",
    ],
    pricing: "Free to join, pay per order",
    popularity: 88,
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    id: "alibaba-1688",
    name: "Alibaba / 1688",
    description: "Source wholesale products directly from Chinese manufacturers",
    longDescription:
      "Access Alibaba and 1688 factory-direct pricing. Get the lowest costs by sourcing directly from manufacturers with MOQ as low as 1 unit for many products.",
    icon: "🏭",
    category: "supplier",
    status: "coming_soon",
    features: [
      "Factory-direct pricing",
      "Low MOQ options",
      "Product customization",
      "Quality assurance",
      "Bulk discounts",
      "Trade Assurance protection",
    ],
    pricing: "Free to source, pay per order",
    popularity: 82,
    gradient: "from-orange-500 to-amber-600",
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    description: "Connect your WordPress/WooCommerce store",
    longDescription:
      "Integrate with WooCommerce stores running on WordPress. Sync products, inventory, and orders seamlessly with REST API integration.",
    icon: "🔮",
    category: "marketplace",
    status: "coming_soon",
    features: [
      "REST API integration",
      "Product sync",
      "Inventory management",
      "Order sync",
      "Webhook support",
      "Custom fields",
    ],
    pricing: "Included in Pro plan",
    popularity: 78,
    gradient: "from-purple-500 to-fuchsia-600",
  },
  {
    id: "ebay",
    name: "eBay",
    description: "List and sell products on eBay marketplace",
    longDescription:
      "Connect your eBay seller account to list products, manage orders, and track inventory across eBay marketplaces worldwide.",
    icon: "🏷️",
    category: "marketplace",
    status: "coming_soon",
    features: [
      "Multi-marketplace support",
      "Listing optimization",
      "Order management",
      "Return handling",
      "Bulk listing tools",
      "Analytics dashboard",
    ],
    pricing: "Included in Pro plan",
    popularity: 75,
    gradient: "from-red-500 to-pink-600",
  },
  {
    id: "tiktok-shop",
    name: "TikTok Shop",
    description: "Sell products through TikTok's built-in shop feature",
    longDescription:
      "Tap into TikTok's massive audience by listing products on TikTok Shop. Leverage viral content and creator partnerships to drive sales.",
    icon: "🎵",
    category: "marketplace",
    status: "coming_soon",
    features: [
      "Product listing sync",
      "Creator partnerships",
      "Live shopping support",
      "Order management",
      "Analytics & insights",
      "Viral product tools",
    ],
    pricing: "Included in Scale plan",
    popularity: 80,
    gradient: "from-pink-500 to-rose-600",
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Track store performance with advanced analytics",
    longDescription:
      "Connect Google Analytics to track visitor behavior, conversion rates, and marketing performance across all your stores.",
    icon: "📊",
    category: "analytics",
    status: "coming_soon",
    features: [
      "Conversion tracking",
      "Audience insights",
      "Marketing attribution",
      "Real-time data",
      "Custom reports",
      "E-commerce tracking",
    ],
    pricing: "Free",
    popularity: 70,
    gradient: "from-amber-500 to-yellow-600",
  },
  {
    id: "facebook-ads",
    name: "Facebook & Instagram Ads",
    description: "Run targeted ads and track ROAS from your dashboard",
    longDescription:
      "Integrate with Meta Ads to create campaigns, track return on ad spend, and optimize your marketing directly from OptiCart.",
    icon: "📱",
    category: "analytics",
    status: "coming_soon",
    features: [
      "Campaign management",
      "ROAS tracking",
      "Audience targeting",
      "Pixel integration",
      "Product catalog sync",
      "Automated rules",
    ],
    pricing: "Included in Pro plan",
    popularity: 72,
    gradient: "from-blue-600 to-indigo-700",
  },
];

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  all: { label: "All", icon: Globe },
  supplier: { label: "Suppliers", icon: Truck },
  marketplace: { label: "Stores", icon: Package },
  analytics: { label: "Analytics", icon: BarChart3 },
};

const STATUS_CONFIG: Record<IntegrationStatus, { label: string; variant: "success" | "default" | "secondary" | "warning" }> = {
  connected: { label: "Connected", variant: "success" },
  available: { label: "Available", variant: "default" },
  coming_soon: { label: "Coming Soon", variant: "secondary" },
  beta: { label: "Beta", variant: "warning" },
};

export default function IntegrationsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = INTEGRATIONS.filter((i) => {
    const matchSearch =
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "all" || i.category === category;
    return matchSearch && matchCategory;
  }).sort((a, b) => {
    // Connected first, then available, then by popularity
    const statusOrder = { connected: 0, available: 1, beta: 2, coming_soon: 3 };
    const diff = statusOrder[a.status] - statusOrder[b.status];
    if (diff !== 0) return diff;
    return b.popularity - a.popularity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Connect your favorite tools and platforms to supercharge your dropshipping business
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Plug className="h-3 w-3" />
            {INTEGRATIONS.filter((i) => i.status === "connected").length} connected
          </Badge>
          <Badge variant="secondary" className="gap-1">
            {INTEGRATIONS.length} total
          </Badge>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integrations..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          {Object.entries(CATEGORY_LABELS).map(([key, { label, icon: Icon }]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                category === key
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Integrations grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((integration) => {
          const statusCfg = STATUS_CONFIG[integration.status];
          const isExpanded = expandedId === integration.id;

          return (
            <Card
              key={integration.id}
              className={`group relative overflow-hidden transition-all hover:shadow-lg ${
                integration.status === "connected"
                  ? "ring-2 ring-emerald-500/20"
                  : ""
              }`}
            >
              {/* Gradient top */}
              <div
                className={`h-1 bg-gradient-to-r ${integration.gradient} ${
                  integration.status === "coming_soon" ? "opacity-30" : ""
                }`}
              />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-xl dark:bg-zinc-800">
                      {integration.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{integration.name}</CardTitle>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Badge variant={statusCfg.variant} className="text-[10px]">
                          {integration.status === "connected" && (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                          )}
                          {integration.status === "coming_soon" && (
                            <Clock className="mr-1 h-3 w-3" />
                          )}
                          {statusCfg.label}
                        </Badge>
                        {integration.popularity >= 90 && (
                          <Badge
                            variant="secondary"
                            className="gap-0.5 text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                          >
                            <Star className="h-2.5 w-2.5 fill-current" />
                            Popular
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {isExpanded ? integration.longDescription : integration.description}
                </p>

                {/* Features (expanded) */}
                {isExpanded && (
                  <div className="space-y-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Key Features</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {integration.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                          <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Tag className="h-3 w-3" />
                  {integration.pricing}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  {integration.status === "connected" && (
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </Button>
                  )}
                  {integration.status === "available" && integration.url && (
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => (window.location.href = integration.url!)}
                    >
                      Connect
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                  {integration.status === "coming_soon" && (
                    <Button size="sm" variant="outline" disabled className="flex-1 gap-1.5">
                      <Clock className="h-3 w-3" />
                      Coming Soon
                    </Button>
                  )}
                  {integration.status === "beta" && (
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5">
                      <Shield className="h-3 w-3" />
                      Join Beta
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpandedId(isExpanded ? null : integration.id)}
                  >
                    {isExpanded ? "Less" : "More"}
                  </Button>
                  {integration.url && (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={integration.url}>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Request integration CTA */}
      <Card className="border-dashed bg-zinc-50/50 dark:bg-zinc-900/50">
        <CardContent className="flex flex-col items-center py-8 text-center">
          <div className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
            <Plug className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="mt-3 text-sm font-semibold">Missing an integration?</h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500">
            We&apos;re constantly adding new integrations. Let us know which platforms and tools you&apos;d like to see connected.
          </p>
          <Button variant="outline" size="sm" className="mt-4">
            Request Integration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
