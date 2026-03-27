"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Package,
  Check,
  X,
  DollarSign,
  Star,
  Truck,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ShippingOption {
  carrier: string;
  cost: number;
  days: string;
}

interface FetchedVariant {
  externalId: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
}

interface FetchedProduct {
  externalId: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  rating: number;
  totalOrders: number;
  sourceUrl: string;
  shippingOptions: ShippingOption[];
  variants: FetchedVariant[];
  suggestedRetailPrice: number;
  retailPrice: number;
  pricingMultiplier: number;
}

interface StoreOption {
  id: string;
  name: string;
  platform: string;
}

interface ImportResult {
  productId?: string;
  externalId: string;
  success: boolean;
  message: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='%23e4e4e7'%3E%3Crect width='400' height='400' fill='%23f4f4f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='48' fill='%23a1a1aa'%3ENo Image%3C/text%3E%3C/svg%3E";

function fixImageUrl(url: string): string {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

function ProductImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const fixedSrc = fixImageUrl(src);

  if (!fixedSrc || error) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={PLACEHOLDER_IMAGE} alt={alt} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fixedSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}

// ─── Steps ──────────────────────────────────────────────────────────────────

type Step = "input" | "fetching" | "review" | "importing" | "done";

export default function ImportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preloadProductId = searchParams.get("productId");
  const [step, setStep] = useState<Step>("input");
  const [urls, setUrls] = useState("");
  const [products, setProducts] = useState<FetchedProduct[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [results, setResults] = useState<ImportResult[]>([]);
  const [fetchError, setFetchError] = useState("");

  // Load stores
  useEffect(() => {
    fetch("/api/stores")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok && Array.isArray(json.data)) {
          setStores(json.data);
          if (json.data.length > 0) setSelectedStore(json.data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-load product from discover page
  useEffect(() => {
    if (!preloadProductId) return;
    setStep("fetching");
    setFetchError("");

    fetch(`/api/sourcing/product/${encodeURIComponent(preloadProductId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok && json.data) {
          const p = json.data;
          const price = Number(p.price) || 0;
          const suggestedRetail = price * 2.5;
          const fetched: FetchedProduct = {
            externalId: p.externalId,
            title: p.title,
            description: p.description ?? "",
            images: (p.images ?? []).map((img: string) => fixImageUrl(img)),
            price,
            rating: Number(p.rating) || 0,
            totalOrders: Number(p.totalOrders) || 0,
            sourceUrl: p.sourceUrl ?? "",
            shippingOptions: p.shippingOptions ?? [],
            variants: (p.variants ?? []).map(
              (v: {
                id: string;
                name: string;
                price: number;
                stock: number;
              }) => ({
                externalId: v.id,
                name: v.name,
                price: Number(v.price) || 0,
                stock: v.stock,
                sku: v.id,
              })
            ),
            pricingMultiplier: 2.5,
            suggestedRetailPrice: suggestedRetail,
            retailPrice: suggestedRetail,
          };
          setProducts([fetched]);
          setStep("review");
        } else {
          setFetchError(
            json.error ?? "Product not found. It may not be in the catalog yet."
          );
          setStep("input");
        }
      })
      .catch(() => {
        setFetchError("Failed to fetch product details. Please try again.");
        setStep("input");
      });
  }, [preloadProductId]);

  function handleRetailPriceChange(externalId: string, value: string) {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;
    setProducts((prev) =>
      prev.map((p) =>
        p.externalId === externalId ? { ...p, retailPrice: num } : p
      )
    );
  }

  async function handleFetch() {
    const lines = urls
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    setStep("fetching");
    setFetchError("");

    // Try to extract product ID from the first URL and fetch from API
    const firstUrl = lines[0];
    const idMatch = firstUrl.match(/\/item\/(\d+)/);
    if (idMatch) {
      try {
        const res = await fetch(
          `/api/sourcing/product/${encodeURIComponent(idMatch[1])}`
        );
        const json = await res.json();
        if (json.ok && json.data) {
          const p = json.data;
          const price = Number(p.price) || 0;
          const suggestedRetail = price * 2.5;
          const fetched: FetchedProduct = {
            externalId: p.externalId,
            title: p.title,
            description: p.description ?? "",
            images: (p.images ?? []).map((img: string) => fixImageUrl(img)),
            price,
            rating: Number(p.rating) || 0,
            totalOrders: Number(p.totalOrders) || 0,
            sourceUrl: p.sourceUrl ?? firstUrl,
            shippingOptions: p.shippingOptions ?? [],
            variants: (p.variants ?? []).map(
              (v: {
                id: string;
                name: string;
                price: number;
                stock: number;
              }) => ({
                externalId: v.id,
                name: v.name,
                price: Number(v.price) || 0,
                stock: v.stock,
                sku: v.id,
              })
            ),
            pricingMultiplier: 2.5,
            suggestedRetailPrice: suggestedRetail,
            retailPrice: suggestedRetail,
          };
          setProducts([fetched]);
          setStep("review");
          return;
        }
      } catch {
        // Fall through to error
      }
    }

    setFetchError(
      "Could not fetch product details from the provided URL. Make sure the product exists in the supplier catalog."
    );
    setStep("input");
  }

  async function handleImport() {
    if (!selectedStore) {
      alert("Please select a store first.");
      return;
    }

    setStep("importing");

    const importResults: ImportResult[] = [];

    for (const p of products) {
      try {
        const res = await fetch("/api/products/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceUrl: p.sourceUrl,
            storeId: selectedStore,
          }),
        });
        const json = await res.json();
        if (json.ok && json.data) {
          importResults.push({
            externalId: p.externalId,
            productId: json.data.id,
            success: true,
            message: "Imported successfully",
          });
        } else {
          importResults.push({
            externalId: p.externalId,
            success: false,
            message: json.error ?? "Import failed",
          });
        }
      } catch {
        importResults.push({
          externalId: p.externalId,
          success: false,
          message: "Network error during import",
        });
      }
    }

    setResults(importResults);
    setStep("done");
  }

  function getResultForProduct(externalId: string) {
    return results.find((r) => r.externalId === externalId);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/products")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Import Product</h1>
          <p className="text-sm text-zinc-500">
            Import products from AliExpress into your store
          </p>
        </div>
      </div>

      {/* Step 1: Input URLs */}
      {step === "input" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {preloadProductId
                ? "Product could not be loaded"
                : "Paste AliExpress URL"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fetchError && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400">
                {fetchError}
              </div>
            )}
            <p className="text-sm text-zinc-500">
              Paste an AliExpress product URL below. We will fetch product
              details, pricing, and variants automatically.
            </p>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={3}
              placeholder="https://www.aliexpress.com/item/1005006123456789.html"
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <Button onClick={handleFetch} disabled={!urls.trim()}>
              Fetch Product
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Fetching */}
      {step === "fetching" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-zinc-400 mb-4" />
            <p className="text-sm text-zinc-500">
              Fetching product details...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review Product */}
      {step === "review" && (
        <>
          {products.map((product) => {
            const profit = product.retailPrice - product.price;
            const marginPct =
              product.retailPrice > 0
                ? Math.round((profit / product.retailPrice) * 100)
                : 0;

            return (
              <Card key={product.externalId}>
                <CardContent className="p-5 space-y-5">
                  {/* Product Preview */}
                  <div className="flex gap-5">
                    {/* Image */}
                    <div className="h-32 w-32 shrink-0 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      {product.images?.[0] ? (
                        <ProductImage
                          src={product.images[0]}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-10 w-10 text-zinc-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <h3 className="font-semibold text-lg leading-snug line-clamp-2">
                        {product.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{Number(product.rating).toFixed(1)}</span>
                        </div>
                        <span className="text-zinc-400">|</span>
                        <span className="text-zinc-500">
                          {Number(product.totalOrders).toLocaleString()} orders
                        </span>
                        {product.variants.length > 0 && (
                          <>
                            <span className="text-zinc-400">|</span>
                            <span className="text-zinc-500">
                              {product.variants.length} variant(s)
                            </span>
                          </>
                        )}
                      </div>

                      {/* Source link */}
                      {product.sourceUrl && (
                        <a
                          href={product.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                        >
                          View on AliExpress
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Variants */}
                  {product.variants.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                        Variants
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.map((v) => (
                          <Badge key={v.externalId} variant="secondary">
                            {v.name}: ${Number(v.price).toFixed(2)}
                            {v.stock > 0 && (
                              <span className="text-zinc-400 ml-1">
                                ({v.stock})
                              </span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shipping */}
                  {product.shippingOptions.length > 0 && (
                    <div className="flex flex-wrap gap-3 text-sm">
                      {product.shippingOptions.map((so, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 text-zinc-500"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          {so.carrier}:{" "}
                          {so.cost === 0
                            ? "Free"
                            : `$${Number(so.cost).toFixed(2)}`}{" "}
                          ({so.days}d)
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pricing Section */}
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      <DollarSign className="h-4 w-4" />
                      Pricing
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {/* Supplier Cost */}
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">
                          Supplier Cost
                        </div>
                        <div className="text-lg font-bold">
                          ${Number(product.price).toFixed(2)}
                        </div>
                      </div>

                      {/* Retail Price (editable) */}
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">
                          Your Retail Price
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 font-medium">
                            $
                          </span>
                          <Input
                            type="number"
                            min={product.price}
                            step="0.01"
                            value={product.retailPrice.toFixed(2)}
                            onChange={(e) =>
                              handleRetailPriceChange(
                                product.externalId,
                                e.target.value
                              )
                            }
                            className="pl-6 font-bold text-lg h-auto py-0.5 border-emerald-300 dark:border-emerald-700"
                          />
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          Suggested: $
                          {Number(product.suggestedRetailPrice).toFixed(2)} (
                          {product.pricingMultiplier}x)
                        </div>
                      </div>

                      {/* Profit */}
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">
                          Profit Per Sale
                        </div>
                        <div
                          className={`text-lg font-bold ${profit > 0 ? "text-emerald-600" : "text-red-500"}`}
                        >
                          ${profit.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          {marginPct}% margin
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Store Selection & Import */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShoppingBag className="h-4 w-4" />
                Select Store
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.platform})
                      </SelectItem>
                    ))}
                    {stores.length === 0 && (
                      <SelectItem value="_none" disabled>
                        No stores configured
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {stores.length === 0 && (
                  <Button
                    variant="link"
                    className="text-sm"
                    onClick={() => router.push("/stores")}
                  >
                    Create a store first
                  </Button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleImport}
                  disabled={!selectedStore}
                  className="flex-1 sm:flex-none"
                >
                  Confirm Import
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/products/discover")}
                >
                  Back to Discover
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Importing */}
      {step === "importing" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-zinc-400 mb-4" />
            <p className="text-sm text-zinc-500">
              Importing product to your store...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Done */}
      {step === "done" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-600" />
                Import Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {products.map((product) => {
                const result = getResultForProduct(product.externalId);
                const success = result?.success ?? false;
                return (
                  <div
                    key={product.externalId}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      success
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                        : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800">
                      {product.images?.[0] ? (
                        <ProductImage
                          src={product.images[0]}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-5 w-5 text-zinc-400" />
                        </div>
                      )}
                    </div>

                    {success ? (
                      <div className="rounded-full bg-emerald-100 p-1 dark:bg-emerald-900 shrink-0">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                    ) : (
                      <div className="rounded-full bg-red-100 p-1 dark:bg-red-900 shrink-0">
                        <X className="h-4 w-4 text-red-600" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {product.title}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {result?.message}
                      </p>
                    </div>

                    {success && result?.productId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(`/products/${result.productId}`)
                        }
                      >
                        View
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={() => router.push("/products")}>
              View All Products
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/products/discover")}
            >
              Discover More
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setStep("input");
                setUrls("");
                setProducts([]);
                setResults([]);
                setFetchError("");
              }}
            >
              Import Another
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
