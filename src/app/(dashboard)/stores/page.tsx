"use client";

import { useState, useEffect } from "react";
import {
  Store,
  Plus,
  ExternalLink,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Package,
  ArrowRight,
  Globe,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StoreInfo {
  id: string;
  name: string;
  platform: string;
  domain: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  _count: { storeLinks: number; orders: number };
}

const PLATFORM_CONFIG: Record<string, { label: string; color: string; icon: string; gradient: string }> = {
  SHOPIFY: {
    label: "Shopify",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: "🛍️",
    gradient: "from-green-500 to-emerald-600",
  },
  WOOCOMMERCE: {
    label: "WooCommerce",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    icon: "🔮",
    gradient: "from-purple-500 to-violet-600",
  },
  EBAY: {
    label: "eBay",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: "🏷️",
    gradient: "from-blue-500 to-cyan-600",
  },
  TIKTOK_SHOP: {
    label: "TikTok Shop",
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    icon: "🎵",
    gradient: "from-pink-500 to-rose-600",
  },
};

export default function StoresPage() {
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState(false);
  const [shopDomain, setShopDomain] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check URL params for callback messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "connected") {
      setMessage({ type: "success", text: "Store connected successfully!" });
      window.history.replaceState({}, "", "/stores");
    } else if (params.get("error")) {
      const errorMap: Record<string, string> = {
        missing_params: "Missing OAuth parameters from Shopify",
        invalid_hmac: "Security verification failed",
        invalid_state: "Session expired. Please try connecting again.",
        connection_failed: "Failed to connect to Shopify. Please try again.",
      };
      setMessage({
        type: "error",
        text: errorMap[params.get("error")!] || "Connection failed",
      });
      window.history.replaceState({}, "", "/stores");
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function fetchStores() {
    try {
      const res = await fetch("/api/stores");
      const json = await res.json();
      if (json.ok) setStores(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function connectShopify() {
    setConnecting(true);
    setConnectError("");

    try {
      const domain = shopDomain.trim().includes(".")
        ? shopDomain.trim()
        : `${shopDomain.trim()}.myshopify.com`;

      const res = await fetch("/api/shopify/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop: domain }),
      });

      const json = await res.json();

      if (json.ok && json.data?.authUrl) {
        // For demo: show success since we can't actually redirect to Shopify without real API keys
        if (!process.env.NEXT_PUBLIC_SHOPIFY_API_KEY) {
          // Demo mode: create connected store directly
          const storeRes = await fetch("/api/stores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: domain.split(".")[0],
              platform: "SHOPIFY",
              domain: domain,
            }),
          });
          const storeJson = await storeRes.json();
          if (storeJson.ok) {
            setMessage({ type: "success", text: `Store "${domain}" connected successfully!` });
            setShowConnect(false);
            setShopDomain("");
            fetchStores();
          }
        } else {
          window.location.href = json.data.authUrl;
        }
      } else {
        setConnectError(json.error || "Failed to initiate connection");
      }
    } catch {
      setConnectError("Network error. Please try again.");
    } finally {
      setConnecting(false);
    }
  }

  async function disconnectStore(storeId: string) {
    try {
      const res = await fetch("/api/shopify/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      const json = await res.json();
      if (json.ok) {
        setMessage({ type: "success", text: "Store disconnected." });
        fetchStores();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to disconnect store." });
    }
  }

  async function deleteStore(storeId: string) {
    try {
      const res = await fetch(`/api/stores/${storeId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        setMessage({ type: "success", text: "Store removed." });
        fetchStores();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to remove store." });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Stores</h1>
            <p className="text-sm text-zinc-500">Manage your connected e-commerce stores</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stores</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Connect and manage your e-commerce stores
          </p>
        </div>
        <Button onClick={() => setShowConnect(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Connect Store
        </Button>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
              : "border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Empty state */}
      {stores.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
              <Store className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No stores connected</h3>
            <p className="mt-1 text-sm text-zinc-500 max-w-sm text-center">
              Connect your Shopify, WooCommerce, eBay, or TikTok Shop store to start importing and selling products.
            </p>
            <Button onClick={() => setShowConnect(true)} className="mt-6 gap-2">
              <Plus className="h-4 w-4" />
              Connect Your First Store
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Store cards */}
      {stores.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => {
            const cfg = PLATFORM_CONFIG[store.platform] || PLATFORM_CONFIG.SHOPIFY;
            return (
              <Card
                key={store.id}
                className="group relative overflow-hidden transition-all hover:shadow-lg"
              >
                {/* Gradient top bar */}
                <div className={`h-1.5 bg-gradient-to-r ${cfg.gradient}`} />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-lg dark:bg-zinc-800">
                        {cfg.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{store.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {store.domain || "No domain set"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={store.isActive ? "success" : "secondary"}>
                      {store.isActive ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge className={cfg.color}>{cfg.label}</Badge>
                    {store.lastSyncAt && (
                      <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <RefreshCw className="h-3 w-3" />
                        {new Date(store.lastSyncAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Package className="h-3 w-3" />
                        Products
                      </div>
                      <p className="mt-1 text-lg font-semibold">{store._count.storeLinks}</p>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <ShoppingBag className="h-3 w-3" />
                        Orders
                      </div>
                      <p className="mt-1 text-lg font-semibold">{store._count.orders}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {store.domain && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 flex-1"
                        onClick={() =>
                          window.open(
                            `https://${store.domain}`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visit
                      </Button>
                    )}
                    {store.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-amber-600 hover:text-amber-700"
                        onClick={() => disconnectStore(store.id)}
                      >
                        <XCircle className="h-3 w-3" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-red-600 hover:text-red-700"
                        onClick={() => deleteStore(store.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add store card */}
          <Card
            className="flex cursor-pointer items-center justify-center border-dashed transition-all hover:border-zinc-400 hover:shadow-sm dark:hover:border-zinc-600"
            onClick={() => setShowConnect(true)}
          >
            <CardContent className="flex flex-col items-center py-12 text-zinc-400">
              <Plus className="h-8 w-8" />
              <p className="mt-2 text-sm font-medium">Add Store</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Connect Store Dialog */}
      <Dialog open={showConnect} onOpenChange={setShowConnect}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect a Store</DialogTitle>
            <DialogDescription>
              Choose a platform and connect your store to start importing and selling products.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Platform selector */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                    key === "SHOPIFY"
                      ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                      : "border-zinc-200 opacity-50 dark:border-zinc-700"
                  }`}
                  disabled={key !== "SHOPIFY"}
                >
                  <span className="text-2xl">{cfg.icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{cfg.label}</p>
                    <p className="text-xs text-zinc-500">
                      {key === "SHOPIFY" ? "Ready" : "Coming soon"}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Shopify domain input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Shopify Store URL</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    value={shopDomain}
                    onChange={(e) => {
                      setShopDomain(e.target.value);
                      setConnectError("");
                    }}
                    placeholder="mystore.myshopify.com"
                    className="pl-10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && shopDomain.trim()) connectShopify();
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-400">
                Enter your store name or full domain (e.g. mystore or mystore.myshopify.com)
              </p>
            </div>

            {connectError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
                <XCircle className="h-4 w-4 shrink-0" />
                {connectError}
              </div>
            )}

            <Button
              onClick={connectShopify}
              disabled={!shopDomain.trim() || connecting}
              className="w-full gap-2"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Connect to Shopify
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
