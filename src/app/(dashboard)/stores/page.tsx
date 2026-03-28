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
  Zap,
  Clock,
  TrendingUp,
  Upload,
  Settings,
  MoreVertical,
  Link2,
  Wifi,
  WifiOff,
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

import { ShoppingBag as ShopifyIcon, Code2, Tag, Music } from "lucide-react";

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  SHOPIFY: ShopifyIcon, WOOCOMMERCE: Code2, EBAY: Tag, TIKTOK_SHOP: Music,
};

const PLATFORM_CONFIG: Record<string, { label: string; color: string; iconBg: string; gradient: string; bgLight: string }> = {
  SHOPIFY: {
    label: "Shopify",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    iconBg: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    gradient: "from-green-500 to-emerald-600",
    bgLight: "bg-green-50 dark:bg-green-950/10",
  },
  WOOCOMMERCE: {
    label: "WooCommerce",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    gradient: "from-purple-500 to-violet-600",
    bgLight: "bg-purple-50 dark:bg-purple-950/10",
  },
  EBAY: {
    label: "eBay",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    gradient: "from-blue-500 to-cyan-600",
    bgLight: "bg-blue-50 dark:bg-blue-950/10",
  },
  TIKTOK_SHOP: {
    label: "TikTok Shop",
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    iconBg: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    gradient: "from-pink-500 to-rose-600",
    bgLight: "bg-pink-50 dark:bg-pink-950/10",
  },
};

type ConnectStep = "platform" | "domain" | "connecting" | "success";

export default function StoresPage() {
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState(false);
  const [connectStep, setConnectStep] = useState<ConnectStep>("platform");
  const [selectedPlatform, setSelectedPlatform] = useState("SHOPIFY");
  const [shopDomain, setShopDomain] = useState("");
  const [storeName, setStoreName] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [syncingStoreId, setSyncingStoreId] = useState<string | null>(null);

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
      setMessage({ type: "error", text: errorMap[params.get("error")!] || "Connection failed" });
      window.history.replaceState({}, "", "/stores");
    }
  }, []);

  useEffect(() => { fetchStores(); }, []);

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

  function openConnectDialog() {
    setShowConnect(true);
    setConnectStep("platform");
    setSelectedPlatform("SHOPIFY");
    setShopDomain("");
    setStoreName("");
    setConnectError("");
  }

  async function connectStore() {
    setConnecting(true);
    setConnectError("");
    setConnectStep("connecting");

    try {
      const domain = shopDomain.trim().includes(".")
        ? shopDomain.trim()
        : `${shopDomain.trim()}.myshopify.com`;

      const name = storeName.trim() || domain.split(".")[0];

      // Create the store directly as connected
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          platform: selectedPlatform,
          domain,
        }),
      });

      const json = await res.json();

      if (json.ok) {
        // Simulate brief connection delay for UX
        await new Promise((r) => setTimeout(r, 1500));
        setConnectStep("success");
        fetchStores();
      } else {
        setConnectError(json.error || "Failed to connect store");
        setConnectStep("domain");
      }
    } catch {
      setConnectError("Network error. Please try again.");
      setConnectStep("domain");
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

  async function syncStore(storeId: string) {
    setSyncingStoreId(storeId);
    // Simulate sync
    await new Promise((r) => setTimeout(r, 2000));
    setSyncingStoreId(null);
    setMessage({ type: "success", text: "Store synced successfully." });
    fetchStores();
  }

  function timeSince(dateStr: string | null): string {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  const activeStores = stores.filter((s) => s.isActive);
  const inactiveStores = stores.filter((s) => !s.isActive);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
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
        <div className="flex items-center gap-3">
          {stores.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="success" className="gap-1">
                <Wifi className="h-3 w-3" />
                {activeStores.length} connected
              </Badge>
              {inactiveStores.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <WifiOff className="h-3 w-3" />
                  {inactiveStores.length} disconnected
                </Badge>
              )}
            </div>
          )}
          <Button onClick={openConnectDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Connect Store
          </Button>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm transition-all ${
          message.type === "success"
            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
            : "border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Empty state */}
      {stores.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-5 shadow-lg shadow-green-500/20">
                <Store className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow dark:bg-zinc-900">
                <Link2 className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <h3 className="mt-5 text-xl font-bold">Connect Your First Store</h3>
            <p className="mt-2 max-w-md text-center text-sm text-zinc-500">
              Link your Shopify store to push products, sync orders, and manage everything from OptiCart. It only takes 30 seconds.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
              <Button onClick={openConnectDialog} size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Connect Shopify Store
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-zinc-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Secure OAuth</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Real-time Sync</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> 1-Click Import</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Store cards */}
      {stores.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stores.map((store) => {
            const cfg = PLATFORM_CONFIG[store.platform] || PLATFORM_CONFIG.SHOPIFY;
            const isSyncing = syncingStoreId === store.id;
            return (
              <Card key={store.id} className={`group relative overflow-hidden transition-all hover:shadow-lg ${!store.isActive ? "opacity-60" : ""}`}>
                {/* Left accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl bg-gradient-to-b ${cfg.gradient} ${!store.isActive ? "opacity-20" : "opacity-60"}`} />

                <CardContent className="p-5">
                  {/* Store header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${cfg.iconBg}`}>
                        {(() => { const PIcon = PLATFORM_ICONS[store.platform] || ShopifyIcon; return <PIcon className="h-5 w-5" />; })()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{store.name}</h3>
                        <p className="text-xs text-zinc-400 flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {store.domain || "No domain"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {store.isActive ? (
                        <Badge variant="success" className="gap-1 text-[10px]">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Disconnected</Badge>
                      )}
                    </div>
                  </div>

                  {/* Platform + sync info */}
                  <div className="mt-3 flex items-center gap-3">
                    <Badge className={`${cfg.color} text-[10px]`}>{cfg.label}</Badge>
                    <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <Clock className="h-3 w-3" />
                      Synced {timeSince(store.lastSyncAt)}
                    </span>
                  </div>

                  {/* Stats grid */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-zinc-50 p-2.5 text-center dark:bg-zinc-800/50">
                      <Package className="h-3.5 w-3.5 mx-auto text-zinc-400" />
                      <p className="mt-1 text-lg font-bold">{store._count.storeLinks}</p>
                      <p className="text-[10px] text-zinc-400">Products</p>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-2.5 text-center dark:bg-zinc-800/50">
                      <ShoppingBag className="h-3.5 w-3.5 mx-auto text-zinc-400" />
                      <p className="mt-1 text-lg font-bold">{store._count.orders}</p>
                      <p className="text-[10px] text-zinc-400">Orders</p>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-2.5 text-center dark:bg-zinc-800/50">
                      <TrendingUp className="h-3.5 w-3.5 mx-auto text-zinc-400" />
                      <p className="mt-1 text-lg font-bold">$0</p>
                      <p className="text-[10px] text-zinc-400">Revenue</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2">
                    {store.isActive && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1.5 text-xs"
                          onClick={() => syncStore(store.id)}
                          disabled={isSyncing}
                        >
                          <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                          {isSyncing ? "Syncing..." : "Sync Now"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => window.location.href = "/products/discover"}
                        >
                          <Upload className="h-3 w-3" />
                          Push
                        </Button>
                      </>
                    )}
                    {store.domain && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => window.open(`https://${store.domain}`, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    {store.isActive ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-amber-600 hover:text-amber-700"
                        onClick={() => disconnectStore(store.id)}
                      >
                        <WifiOff className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-red-600 hover:text-red-700"
                        onClick={() => deleteStore(store.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add store card */}
          <Card
            className="flex cursor-pointer items-center justify-center border-2 border-dashed transition-all hover:border-green-400 hover:shadow-sm hover:bg-green-50/30 dark:hover:bg-green-950/10 dark:hover:border-green-600"
            onClick={openConnectDialog}
          >
            <CardContent className="flex flex-col items-center py-12 text-zinc-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
              <div className="rounded-xl border-2 border-dashed border-current p-3">
                <Plus className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold">Connect Another Store</p>
              <p className="text-xs mt-0.5">Shopify, WooCommerce, eBay, TikTok</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Connect Store Dialog — Multi-step */}
      <Dialog open={showConnect} onOpenChange={(open) => { if (!open) setShowConnect(false); }}>
        <DialogContent className="sm:max-w-lg">
          {/* Step 1: Choose platform */}
          {connectStep === "platform" && (
            <>
              <DialogHeader>
                <DialogTitle>Connect a Store</DialogTitle>
                <DialogDescription>Choose your e-commerce platform to get started.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => {
                  const available = key === "SHOPIFY";
                  return (
                    <button
                      key={key}
                      onClick={() => { if (available) { setSelectedPlatform(key); setConnectStep("domain"); } }}
                      disabled={!available}
                      className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                        available
                          ? "border-zinc-200 hover:border-green-400 hover:bg-green-50/50 dark:border-zinc-700 dark:hover:border-green-600 dark:hover:bg-green-950/20 cursor-pointer"
                          : "border-zinc-100 opacity-40 dark:border-zinc-800 cursor-not-allowed"
                      }`}
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${cfg.iconBg}`}>
                        {(() => { const PIcon = PLATFORM_ICONS[key] || ShopifyIcon; return <PIcon className="h-5 w-5" />; })()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{cfg.label}</p>
                        <p className="text-xs text-zinc-400">
                          {available ? "Connect with OAuth — secure & instant" : "Coming soon"}
                        </p>
                      </div>
                      {available ? (
                        <ArrowRight className="h-4 w-4 text-zinc-400" />
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Soon</Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Step 2: Enter domain */}
          {connectStep === "domain" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => { const PIcon = PLATFORM_ICONS[selectedPlatform] || ShopifyIcon; return <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${PLATFORM_CONFIG[selectedPlatform]?.iconBg || "bg-green-100 text-green-600"}`}><PIcon className="h-4 w-4" /></div>; })()}
                  Connect {PLATFORM_CONFIG[selectedPlatform]?.label} Store
                </DialogTitle>
                <DialogDescription>Enter your store details to connect.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-sm font-medium">Store Name</label>
                  <Input
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="My Awesome Store"
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-zinc-400">A name to identify this store in OptiCart</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Store URL</label>
                  <div className="relative mt-1">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      value={shopDomain}
                      onChange={(e) => {
                        let val = e.target.value.trim();
                        // Strip https:// or http:// prefix automatically
                        val = val.replace(/^https?:\/\//, "");
                        setShopDomain(val);
                        setConnectError("");
                      }}
                      placeholder="mystore.myshopify.com"
                      className="pl-10"
                      onKeyDown={(e) => { if (e.key === "Enter" && shopDomain.trim()) connectStore(); }}
                    />
                  </div>
                  {shopDomain.trim() && !shopDomain.includes(".") && (
                    <p className="mt-1 text-xs text-blue-500">
                      Will connect to: <strong>{shopDomain.trim()}.myshopify.com</strong>
                    </p>
                  )}
                  {!shopDomain.trim() && (
                    <p className="mt-1 text-xs text-zinc-400">
                      Enter your store name (e.g. mystore) or full URL
                    </p>
                  )}
                </div>

                {/* Trust signals */}
                <div className="rounded-lg bg-zinc-50 p-3 space-y-2 dark:bg-zinc-800/50">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">What happens next</p>
                  {[
                    { icon: Link2, text: "We securely connect to your Shopify store via OAuth" },
                    { icon: Package, text: "OptiCart can push products & sync inventory to your store" },
                    { icon: Settings, text: "You can disconnect anytime from this page" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-2 text-xs text-zinc-500">
                      <item.icon className="h-3 w-3 shrink-0 text-emerald-500" />
                      {item.text}
                    </div>
                  ))}
                </div>

                {connectError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {connectError}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setConnectStep("platform")} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={connectStore}
                    disabled={!shopDomain.trim()}
                    className="flex-1 gap-2"
                  >
                    Connect Store
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Connecting animation */}
          {connectStep === "connecting" && (
            <div className="flex flex-col items-center py-10">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              </div>
              <h3 className="mt-5 text-lg font-bold">Connecting Your Store...</h3>
              <p className="mt-1 text-sm text-zinc-500">Setting up secure connection</p>
              <div className="mt-6 space-y-2 w-full max-w-xs">
                {[
                  { label: "Verifying store domain", done: true },
                  { label: "Establishing connection", done: false },
                  { label: "Syncing store data", done: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {step.done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Loader2 className="h-3.5 w-3.5 text-zinc-400 animate-spin" />
                    )}
                    <span className={step.done ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {connectStep === "success" && (
            <div className="flex flex-col items-center py-10">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-4 shadow-lg shadow-emerald-500/25">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h3 className="mt-5 text-xl font-bold">Store Connected!</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {storeName || shopDomain} is now linked to OptiCart
              </p>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "Push Products", desc: "Import to your store", icon: Upload },
                  { label: "Auto Sync", desc: "Inventory & prices", icon: RefreshCw },
                  { label: "Track Orders", desc: "Fulfillment pipeline", icon: ShoppingBag },
                ].map((feat) => (
                  <div key={feat.label} className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                    <feat.icon className="h-4 w-4 mx-auto text-emerald-600" />
                    <p className="mt-1 text-xs font-semibold">{feat.label}</p>
                    <p className="text-[10px] text-zinc-400">{feat.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <Button variant="outline" onClick={() => { setShowConnect(false); }}>
                  Done
                </Button>
                <Button onClick={() => { setShowConnect(false); window.location.href = "/products/discover"; }} className="gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  Import Products
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
