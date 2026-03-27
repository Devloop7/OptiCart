"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, TrendingUp, Package, Star, X } from "lucide-react";

interface WinningProduct {
  id: string;
  title: string;
  image: string;
  supplierPrice: number;
  suggestedPrice: number;
  margin: number;
  score: number;
  category: string;
  niche: string;
  country: string;
  supplier: string;
  trending: boolean;
  insights: string[];
  sourceUrl: string;
}

const scoreColor = (score: number) =>
  score >= 90 ? "text-emerald-500" : score >= 80 ? "text-yellow-500" : score >= 70 ? "text-orange-500" : "text-zinc-400";

export default function WinningProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<WinningProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<WinningProduct | null>(null);

  const [niche, setNiche] = useState("all");
  const [minScore, setMinScore] = useState("0");
  const [country, setCountry] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams();
    if (niche !== "all") params.set("category", niche);
    if (minScore !== "0") params.set("minScore", minScore);
    if (country !== "all") params.set("country", country);

    setLoading(true);
    fetch(`/api/ai/winning-products?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setProducts(json.data?.products ?? []);
          setCategories(json.data?.categories ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [niche, minScore, country]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-2">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Winning Products</h1>
          <p className="text-sm text-zinc-500">AI-curated products with high profit potential</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={niche} onValueChange={setNiche}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Niche" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Niches</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={minScore} onValueChange={setMinScore}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Min Score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any Score</SelectItem>
            <SelectItem value="70">70+</SelectItem>
            <SelectItem value="80">80+</SelectItem>
            <SelectItem value="90">90+</SelectItem>
          </SelectContent>
        </Select>

        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            <SelectItem value="US">United States</SelectItem>
            <SelectItem value="UK">United Kingdom</SelectItem>
            <SelectItem value="DE">Germany</SelectItem>
            <SelectItem value="FR">France</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Sparkles className="h-12 w-12 mb-3" />
            <p className="text-sm font-medium">No winning products found</p>
            <p className="text-xs mt-1">Try adjusting your filters or check back later</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => setSelectedProduct(product)}
            >
              <CardContent className="p-4">
                {/* Image placeholder */}
                <div className="relative mb-3 h-36 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
                  <Package className="h-12 w-12 text-zinc-400" />
                  {product.trending && (
                    <Badge variant="destructive" className="absolute top-2 left-2 text-[10px]">
                      <TrendingUp className="h-3 w-3 mr-1" /> TRENDING
                    </Badge>
                  )}
                  <div className={`absolute top-2 right-2 flex items-center gap-1 font-bold text-lg ${scoreColor(product.score)}`}>
                    <Star className="h-4 w-4 fill-current" />
                    {product.score}
                  </div>
                </div>

                <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.title}</h3>

                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-[10px]">{product.category}</Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-zinc-500 text-xs">Cost</div>
                    <div className="font-medium">${product.supplierPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-xs">Sell</div>
                    <div className="font-medium">${product.suggestedPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-xs">Margin</div>
                    <div className="font-bold text-emerald-600">{product.margin}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedProduct(null)}>
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-900 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold pr-4">{selectedProduct.title}</h2>
              <button onClick={() => setSelectedProduct(null)} className="text-zinc-400 hover:text-zinc-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Score */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex items-center gap-2 ${scoreColor(selectedProduct.score)}`}>
                <Star className="h-6 w-6 fill-current" />
                <span className="text-2xl font-bold">{selectedProduct.score}/100</span>
              </div>
              {selectedProduct.trending && (
                <Badge variant="destructive"><TrendingUp className="h-3 w-3 mr-1" /> Trending</Badge>
              )}
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                <div className="text-xs text-zinc-500">Supplier Cost</div>
                <div className="text-lg font-bold">${selectedProduct.supplierPrice.toFixed(2)}</div>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                <div className="text-xs text-zinc-500">Suggested Price</div>
                <div className="text-lg font-bold">${selectedProduct.suggestedPrice.toFixed(2)}</div>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950">
                <div className="text-xs text-emerald-600">Estimated Profit</div>
                <div className="text-lg font-bold text-emerald-600">
                  ${(selectedProduct.suggestedPrice - selectedProduct.supplierPrice).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Insights */}
            {selectedProduct.insights.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-purple-500" /> AI Insights
                </h3>
                <ul className="space-y-2">
                  {selectedProduct.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  setSelectedProduct(null);
                  router.push("/products/import");
                }}
              >
                <Package className="h-4 w-4 mr-1" /> Import to Store
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
