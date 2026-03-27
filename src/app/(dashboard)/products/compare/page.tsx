"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  X,
  Star,
  Truck,
  Package,
  DollarSign,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  BarChart3,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface SupplierProduct {
  id: string;
  title: string;
  images: string[];
  rating: number | null;
  totalOrders: number | null;
  variants: Array<{ price: number; name: string }>;
  shippingOptions: Array<{ serviceName: string; deliveryDays: string; price: number }>;
}

export default function ProductComparePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SupplierProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [compareList, setCompareList] = useState<SupplierProduct[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const searchProducts = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/sourcing/search?q=${encodeURIComponent(searchQuery)}&limit=12`
      );
      const json = await res.json();
      if (json.ok) {
        setSearchResults(
          (json.data ?? []).map((p: Record<string, unknown>) => ({
            id: p.id,
            title: p.title,
            images: Array.isArray(p.images) ? p.images : [],
            rating: p.rating ? Number(p.rating) : null,
            totalOrders: p.totalOrders ? Number(p.totalOrders) : null,
            variants: Array.isArray(p.variants)
              ? (p.variants as Array<Record<string, unknown>>).map((v) => ({
                  price: Number(v.price || v.supplierCost || 0),
                  name: String(v.name || "Default"),
                }))
              : [],
            shippingOptions: Array.isArray(p.shippingOptions) ? p.shippingOptions : [],
          }))
        );
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  function addToCompare(product: SupplierProduct) {
    if (compareList.length >= 4) return;
    if (compareList.find((p) => p.id === product.id)) return;
    setCompareList([...compareList, product]);
    setShowSearch(false);
  }

  function removeFromCompare(id: string) {
    setCompareList(compareList.filter((p) => p.id !== id));
  }

  function getLowestPrice(product: SupplierProduct): number {
    if (product.variants.length === 0) return 0;
    return Math.min(...product.variants.map((v) => v.price));
  }

  function getHighestPrice(product: SupplierProduct): number {
    if (product.variants.length === 0) return 0;
    return Math.max(...product.variants.map((v) => v.price));
  }

  function getShippingDays(product: SupplierProduct): string {
    if (product.shippingOptions.length === 0) return "N/A";
    const first = product.shippingOptions[0];
    return first.deliveryDays || "7-15 days";
  }

  function getShippingCost(product: SupplierProduct): number {
    if (product.shippingOptions.length === 0) return 0;
    return product.shippingOptions[0].price || 0;
  }

  function getSupplierScore(product: SupplierProduct): number {
    let score = 50;
    if (product.rating && product.rating >= 4.5) score += 25;
    else if (product.rating && product.rating >= 4.0) score += 15;
    else if (product.rating) score += 5;
    if (product.totalOrders && product.totalOrders > 1000) score += 25;
    else if (product.totalOrders && product.totalOrders > 100) score += 15;
    else if (product.totalOrders) score += 5;
    return Math.min(100, score);
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  }

  function getScoreBg(score: number): string {
    if (score >= 80) return "bg-emerald-50 dark:bg-emerald-950/20";
    if (score >= 60) return "bg-amber-50 dark:bg-amber-950/20";
    return "bg-red-50 dark:bg-red-950/20";
  }

  // Find the best values for highlighting
  const bestPrice = compareList.length > 0 ? Math.min(...compareList.map(getLowestPrice)) : 0;
  const bestRating = compareList.length > 0 ? Math.max(...compareList.map((p) => p.rating || 0)) : 0;
  const bestOrders = compareList.length > 0 ? Math.max(...compareList.map((p) => p.totalOrders || 0)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Comparison</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Compare up to 4 products side-by-side to find the best deals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {compareList.length}/4 products selected
          </Badge>
          {compareList.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setCompareList([])}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {compareList.length === 0 && !showSearch && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
              <ArrowUpDown className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No Products to Compare</h3>
            <p className="mt-1 max-w-sm text-center text-sm text-zinc-500">
              Search and add products to compare prices, ratings, shipping times, and supplier reliability.
            </p>
            <Button onClick={() => setShowSearch(true)} className="mt-6 gap-2">
              <Search className="h-4 w-4" />
              Search Products
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search panel */}
      {(showSearch || compareList.length > 0) && (
        <Card>
          <CardContent className="py-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchProducts()}
                  placeholder="Search products to compare..."
                  className="pl-10"
                />
              </div>
              <Button onClick={searchProducts} disabled={searching}>
                {searching ? "Searching..." : "Search"}
              </Button>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-2 max-h-64 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((product) => {
                  const alreadyAdded = compareList.find((p) => p.id === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => !alreadyAdded && addToCompare(product)}
                      disabled={!!alreadyAdded || compareList.length >= 4}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                        alreadyAdded
                          ? "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/10"
                          : compareList.length >= 4
                          ? "opacity-50"
                          : "border-zinc-200 hover:border-indigo-300 hover:shadow-sm dark:border-zinc-700"
                      }`}
                    >
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt=""
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
                          <Package className="h-4 w-4 text-zinc-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{product.title}</p>
                        <p className="text-xs text-zinc-400">
                          ${getLowestPrice(product).toFixed(2)}
                          {product.rating ? ` | ${product.rating}★` : ""}
                        </p>
                      </div>
                      {alreadyAdded ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <Plus className="h-4 w-4 shrink-0 text-zinc-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comparison table */}
      {compareList.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Product headers */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }}>
              <div /> {/* Label column */}
              {compareList.map((product) => (
                <Card key={product.id} className="relative overflow-hidden">
                  <button
                    onClick={() => removeFromCompare(product.id)}
                    className="absolute right-2 top-2 rounded-full bg-zinc-100 p-1 hover:bg-red-100 dark:bg-zinc-800 dark:hover:bg-red-900/30"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <CardContent className="py-4 text-center">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt=""
                        className="mx-auto h-24 w-24 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                        <Package className="h-8 w-8 text-zinc-400" />
                      </div>
                    )}
                    <p className="mt-2 text-xs font-medium line-clamp-2">{product.title}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Comparison rows */}
            {[
              {
                label: "Price Range",
                icon: DollarSign,
                render: (p: SupplierProduct) => {
                  const low = getLowestPrice(p);
                  const high = getHighestPrice(p);
                  const isBest = low === bestPrice;
                  return (
                    <div className={`text-center ${isBest ? "font-bold text-emerald-600 dark:text-emerald-400" : ""}`}>
                      ${low.toFixed(2)} - ${high.toFixed(2)}
                      {isBest && <Badge variant="success" className="ml-1 text-[10px]">Best</Badge>}
                    </div>
                  );
                },
              },
              {
                label: "Rating",
                icon: Star,
                render: (p: SupplierProduct) => {
                  const isBest = (p.rating || 0) === bestRating && bestRating > 0;
                  return (
                    <div className={`text-center ${isBest ? "font-bold text-amber-600 dark:text-amber-400" : ""}`}>
                      {p.rating ? (
                        <span className="flex items-center justify-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {p.rating}
                          {isBest && <Badge variant="success" className="ml-1 text-[10px]">Best</Badge>}
                        </span>
                      ) : (
                        <span className="text-zinc-400">N/A</span>
                      )}
                    </div>
                  );
                },
              },
              {
                label: "Orders",
                icon: TrendingUp,
                render: (p: SupplierProduct) => {
                  const isBest = (p.totalOrders || 0) === bestOrders && bestOrders > 0;
                  return (
                    <div className={`text-center ${isBest ? "font-bold text-blue-600 dark:text-blue-400" : ""}`}>
                      {p.totalOrders ? p.totalOrders.toLocaleString() : "N/A"}
                      {isBest && <Badge variant="success" className="ml-1 text-[10px]">Most</Badge>}
                    </div>
                  );
                },
              },
              {
                label: "Shipping",
                icon: Truck,
                render: (p: SupplierProduct) => (
                  <div className="text-center text-xs">
                    <p>{getShippingDays(p)}</p>
                    <p className="text-zinc-400">
                      {getShippingCost(p) === 0 ? "Free shipping" : `$${getShippingCost(p).toFixed(2)}`}
                    </p>
                  </div>
                ),
              },
              {
                label: "Variants",
                icon: Package,
                render: (p: SupplierProduct) => (
                  <div className="text-center text-xs">
                    {p.variants.length} option{p.variants.length !== 1 ? "s" : ""}
                  </div>
                ),
              },
              {
                label: "Supplier Score",
                icon: ShieldCheck,
                render: (p: SupplierProduct) => {
                  const score = getSupplierScore(p);
                  return (
                    <div className="flex flex-col items-center gap-1">
                      <div className={`rounded-lg px-3 py-1 text-sm font-bold ${getScoreBg(score)} ${getScoreColor(score)}`}>
                        {score}/100
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        {score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Fair"}
                      </p>
                    </div>
                  );
                },
              },
              {
                label: "Est. Profit (2.5x)",
                icon: BarChart3,
                render: (p: SupplierProduct) => {
                  const cost = getLowestPrice(p);
                  const sell = cost * 2.5;
                  const profit = sell - cost;
                  return (
                    <div className="text-center">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        ${profit.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        Sell at ${sell.toFixed(2)}
                      </p>
                    </div>
                  );
                },
              },
            ].map((row) => (
              <div
                key={row.label}
                className="mt-2 grid items-center gap-4 rounded-lg bg-zinc-50/50 p-3 dark:bg-zinc-900/50"
                style={{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }}
              >
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  <row.icon className="h-3.5 w-3.5" />
                  {row.label}
                </div>
                {compareList.map((product) => (
                  <div key={product.id} className="text-sm">
                    {row.render(product)}
                  </div>
                ))}
              </div>
            ))}

            {/* Action row */}
            <div
              className="mt-4 grid items-center gap-4 p-3"
              style={{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }}
            >
              <div className="text-xs font-medium text-zinc-400">Actions</div>
              {compareList.map((product) => (
                <div key={product.id} className="flex justify-center">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                      window.location.href = `/products/import?productId=${product.id}`
                    }
                  >
                    <Plus className="h-3 w-3" />
                    Import
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add more button */}
      {compareList.length > 0 && compareList.length < 4 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowSearch(true)}
          >
            <Plus className="h-4 w-4" />
            Add Another Product ({4 - compareList.length} slots left)
          </Button>
        </div>
      )}
    </div>
  );
}
