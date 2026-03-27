"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Package, Check, X, DollarSign, Star, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  rating: number;
  totalOrders: number;
  sourceUrl: string;
  shippingOptions: ShippingOption[];
  variants: FetchedVariant[];
  suggestedRetailPrice?: number;
  pricingMultiplier?: number;
}

interface StoreOption {
  id: string;
  name: string;
  platform: string;
}

interface ImportResult {
  externalId: string;
  success: boolean;
  message: string;
}

// Mock data matching seed products
const MOCK_PRODUCTS: FetchedProduct[] = [
  {
    externalId: "1005006123456789",
    title: "Wireless Bluetooth Earbuds TWS 5.3 Noise Cancelling",
    description: "High quality wireless earbuds with active noise cancellation and 30h battery life.",
    images: ["https://ae-pic-a1.aliexpress-media.com/kf/S1234.jpg"],
    rating: 4.7,
    totalOrders: 15420,
    sourceUrl: "https://www.aliexpress.com/item/1005006123456789.html",
    shippingOptions: [
      { carrier: "AliExpress Standard", cost: 0, days: "15-25" },
      { carrier: "ePacket", cost: 2.5, days: "10-18" },
    ],
    variants: [
      { externalId: "v1", name: "Black", price: 8.99, stock: 5000, sku: "TWS-BLK" },
      { externalId: "v2", name: "White", price: 8.99, stock: 3200, sku: "TWS-WHT" },
      { externalId: "v3", name: "Blue", price: 9.49, stock: 1800, sku: "TWS-BLU" },
    ],
    pricingMultiplier: 2.5,
  },
  {
    externalId: "1005007987654321",
    title: "LED Ring Light 10\" with Tripod Stand for TikTok Live Stream",
    description: "Professional ring light with adjustable brightness and color temperature.",
    images: ["https://ae-pic-a1.aliexpress-media.com/kf/S5678.jpg"],
    rating: 4.5,
    totalOrders: 8700,
    sourceUrl: "https://www.aliexpress.com/item/1005007987654321.html",
    shippingOptions: [
      { carrier: "AliExpress Standard", cost: 0, days: "20-30" },
    ],
    variants: [
      { externalId: "v1", name: "10 inch", price: 12.5, stock: 2400, sku: "RING-10" },
      { externalId: "v2", name: "12 inch + Phone Holder", price: 16.8, stock: 1100, sku: "RING-12P" },
    ],
    pricingMultiplier: 2.5,
  },
];

type Step = "input" | "fetching" | "review" | "importing" | "done";

export default function ImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [urls, setUrls] = useState("");
  const [products, setProducts] = useState<FetchedProduct[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [results, setResults] = useState<ImportResult[]>([]);

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

  async function handleFetch() {
    const lines = urls.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    setStep("fetching");

    // Simulate network delay, then return mock data
    await new Promise((r) => setTimeout(r, 1500));

    // Add suggested retail prices
    const fetched = MOCK_PRODUCTS.map((p) => ({
      ...p,
      suggestedRetailPrice: Math.min(...p.variants.map((v) => v.price)) * (p.pricingMultiplier ?? 2.5),
    }));

    setProducts(fetched);
    setStep("review");
  }

  async function handleImport() {
    if (!selectedStore) {
      alert("Please select a store first.");
      return;
    }

    setStep("importing");

    try {
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: selectedStore,
          products: products.map((p) => ({
            sourceUrl: p.sourceUrl,
            externalId: p.externalId,
          })),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setResults(json.data?.results ?? products.map((p) => ({ externalId: p.externalId, success: true, message: "Imported successfully" })));
      } else {
        setResults(products.map((p) => ({ externalId: p.externalId, success: true, message: "Imported (demo mode)" })));
      }
    } catch {
      // Demo mode fallback
      setResults(products.map((p) => ({ externalId: p.externalId, success: true, message: "Imported (demo mode)" })));
    }
    setStep("done");
  }

  function getResultForProduct(externalId: string) {
    return results.find((r) => r.externalId === externalId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/products")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Import from AliExpress</h1>
      </div>

      {/* Step 1: Input URLs */}
      {step === "input" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 1: Paste AliExpress URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-500">
              Paste one AliExpress product URL per line. We will fetch product details, pricing, and variants.
            </p>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={5}
              placeholder={"https://www.aliexpress.com/item/1005006123456789.html\nhttps://www.aliexpress.com/item/1005007987654321.html"}
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
            />
            <div className="flex items-center gap-3">
              <Button onClick={handleFetch} disabled={!urls.trim()}>
                Fetch Products
              </Button>
              <p className="text-xs text-zinc-400">Demo mode: any URL will return sample products</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fetching */}
      {step === "fetching" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-zinc-400 mb-4" />
            <p className="text-sm text-zinc-500">Fetching product details from AliExpress...</p>
          </CardContent>
        </Card>
      )}

      {/* Step 2+3: Review Products */}
      {step === "review" && (
        <>
          <div className="text-sm text-zinc-500">
            Found {products.length} product(s). Review details and pricing below.
          </div>

          {products.map((product) => {
            const minCost = Math.min(...product.variants.map((v) => v.price));
            const maxCost = Math.max(...product.variants.map((v) => v.price));
            const multiplier = product.pricingMultiplier ?? 2.5;

            return (
              <Card key={product.externalId}>
                <CardContent className="p-5">
                  <div className="flex gap-5">
                    {/* Image placeholder */}
                    <div className="h-28 w-28 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Package className="h-10 w-10 text-zinc-400" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      <h3 className="font-semibold text-lg">{product.title}</h3>

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{product.rating}</span>
                        </div>
                        <span className="text-zinc-400">|</span>
                        <span className="text-zinc-500">{product.totalOrders.toLocaleString()} orders</span>
                        <span className="text-zinc-400">|</span>
                        <span className="text-zinc-500">{product.variants.length} variant(s)</span>
                      </div>

                      {/* Variants */}
                      <div className="flex flex-wrap gap-2">
                        {product.variants.map((v) => (
                          <Badge key={v.externalId} variant="secondary">
                            {v.name}: ${v.price.toFixed(2)}
                          </Badge>
                        ))}
                      </div>

                      {/* Shipping */}
                      <div className="flex flex-wrap gap-3 text-sm">
                        {product.shippingOptions.map((so, i) => (
                          <div key={i} className="flex items-center gap-1 text-zinc-500">
                            <Truck className="h-3.5 w-3.5" />
                            {so.carrier}: {so.cost === 0 ? "Free" : `$${so.cost.toFixed(2)}`} ({so.days}d)
                          </div>
                        ))}
                      </div>

                      {/* Pricing Preview */}
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">
                          <DollarSign className="h-4 w-4" />
                          Pricing Preview ({multiplier}x markup)
                        </div>
                        <div className="text-sm text-emerald-600 dark:text-emerald-300">
                          Supplier: ${minCost.toFixed(2)}{minCost !== maxCost ? ` - $${maxCost.toFixed(2)}` : ""}
                          {" -> "}
                          Retail: ${(minCost * multiplier).toFixed(2)}{minCost !== maxCost ? ` - $${(maxCost * multiplier).toFixed(2)}` : ""}
                          {" -> "}
                          Profit: ${((minCost * multiplier) - minCost).toFixed(2)}{minCost !== maxCost ? ` - $${((maxCost * multiplier) - maxCost).toFixed(2)}` : ""} per unit
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Step 4+5: Store Selection & Import */}
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Import to store:</label>
                  <Select value={selectedStore} onValueChange={setSelectedStore}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select a store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.platform})
                        </SelectItem>
                      ))}
                      {stores.length === 0 && (
                        <SelectItem value="_none" disabled>No stores configured</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1" />
                <Button onClick={handleImport} disabled={!selectedStore}>
                  Import {products.length} Product(s)
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
            <p className="text-sm text-zinc-500">Importing products...</p>
          </CardContent>
        </Card>
      )}

      {/* Done */}
      {step === "done" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Import Complete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {products.map((product) => {
                const result = getResultForProduct(product.externalId);
                const success = result?.success ?? true;
                return (
                  <div key={product.externalId} className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                    {success ? (
                      <div className="rounded-full bg-emerald-100 p-1 dark:bg-emerald-900">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                    ) : (
                      <div className="rounded-full bg-red-100 p-1 dark:bg-red-900">
                        <X className="h-4 w-4 text-red-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.title}</p>
                      <p className="text-xs text-zinc-500">{result?.message}</p>
                    </div>
                    <Badge variant={success ? "success" : "destructive"}>
                      {success ? "Imported" : "Failed"}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={() => router.push("/products")}>View Products</Button>
            <Button variant="outline" onClick={() => { setStep("input"); setUrls(""); setProducts([]); setResults([]); }}>
              Import More
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
